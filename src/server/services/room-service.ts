import { Prisma, type Room, type RoomMember } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { generateRoomSlug, hashInviteToken } from "@/lib/security/ids";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { AppError, Errors } from "@/lib/api/http";
import { logger } from "@/lib/logger";
import type { CreateRoomInput, UpdateRoomInput } from "@/schemas/room";
import type { Identity } from "@/lib/auth/session";
import { deleteLivekitRoom } from "@/lib/livekit/token";
import { recordAudit } from "./audit-service";

const MAX_SLUG_ATTEMPTS = 5;

export async function createRoom(
  ownerId: string,
  input: CreateRoomInput,
): Promise<Room> {
  const passwordHash =
    input.password && input.password.length > 0
      ? await hashPassword(input.password)
      : null;

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = generateRoomSlug();
    try {
      const room = await db.$transaction(async (tx) => {
        const created = await tx.room.create({
          data: {
            slug,
            name: input.name,
            ownerId,
            visibility: input.visibility,
            passwordHash,
            allowGuests: input.allowGuests,
            allowChat: input.allowChat,
            allowAudio: input.allowAudio,
            maxParticipants: input.maxParticipants,
          },
        });
        await tx.roomMember.create({
          data: {
            roomId: created.id,
            userId: ownerId,
            displayName: "Anfitrião",
            role: "OWNER",
          },
        });
        return created;
      });

      await recordAudit({ roomId: room.id, actorId: ownerId, event: "room.created" });
      logger.info({ roomId: room.id, slug: room.slug }, "Room created");
      return room;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // slug collision — retry with a new slug
      }
      throw err;
    }
  }
  throw new AppError(500, "SLUG_EXHAUSTED", "Não foi possível gerar a sala");
}

export async function getRoomBySlug(slug: string) {
  const room = await db.room.findUnique({ where: { slug } });
  if (!room) throw Errors.notFound("Sala inexistente");
  return room;
}

interface JoinArgs {
  slug: string;
  identity: Identity;
  displayName: string;
  password?: string;
  inviteToken?: string;
}

const identityWhere = (identity: Identity) =>
  identity.kind === "user"
    ? { userId: identity.id }
    : { guestId: identity.id };

/**
 * Atomically: verify room state, ban, capacity, then upsert membership.
 * Capacity is enforced inside the transaction to survive concurrent joins.
 * A valid invite token bypasses the password and the allowGuests restriction.
 */
export async function joinRoom({
  slug,
  identity,
  displayName,
  password,
  inviteToken,
}: JoinArgs): Promise<{ room: Room; member: RoomMember }> {
  return db.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { slug } });
    if (!room) throw Errors.notFound("Sala inexistente");
    if (room.status === "ENDED") throw Errors.gone("A transmissão terminou");

    const ban = await tx.roomBan.findFirst({
      where: { roomId: room.id, ...identityWhere(identity) },
    });
    if (ban) throw Errors.forbidden("Foi removido desta sala");

    const existing = await tx.roomMember.findFirst({
      where: { roomId: room.id, ...identityWhere(identity) },
    });

    // Rejoin path: existing members skip all gates (even when the room is locked).
    if (existing) {
      const member = await tx.roomMember.update({
        where: { id: existing.id },
        data: { leftAt: null, displayName },
      });
      return { room, member };
    }

    const admin = identity.kind === "user" && identity.isAdmin === true;

    let invite: { id: string; maxUses: number | null; uses: number } | null =
      null;
    if (inviteToken && !admin) {
      invite = await tx.roomInvite.findFirst({
        where: {
          roomId: room.id,
          tokenHash: hashInviteToken(inviteToken),
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true, maxUses: true, uses: true },
      });
      if (!invite) throw Errors.gone("Convite inválido ou expirado");
      if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
        throw Errors.gone("Convite esgotado");
      }
    }

    // Platform admins bypass guest/lock/password/capacity gates entirely.
    if (!invite && !admin) {
      if (identity.kind === "guest" && !room.allowGuests) {
        throw Errors.forbidden("Esta sala não permite convidados");
      }
      if (room.lockedAt) {
        throw Errors.forbidden(
          "Esta sala não está a aceitar novos participantes",
        );
      }
      if (room.passwordHash) {
        const ok = password
          ? await verifyPassword(room.passwordHash, password)
          : false;
        if (!ok) throw new AppError(401, "BAD_PASSWORD", "Senha incorreta");
      }
    }

    if (!admin) {
      const activeCount = await tx.roomMember.count({
        where: { roomId: room.id, leftAt: null },
      });
      if (activeCount >= room.maxParticipants) {
        throw Errors.conflict("Sala cheia");
      }
    }

    const member = await tx.roomMember.create({
      data: {
        roomId: room.id,
        role: admin ? "MODERATOR" : "VIEWER",
        userId: identity.kind === "user" ? identity.id : null,
        guestId: identity.kind === "guest" ? identity.id : null,
        displayName,
      },
    });

    if (invite) {
      await tx.roomInvite.update({
        where: { id: invite.id },
        data: { uses: { increment: 1 } },
      });
    }

    return { room, member };
  });
}

export async function updateRoom(
  roomId: string,
  actorId: string,
  input: UpdateRoomInput,
): Promise<Room> {
  const data: Prisma.RoomUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.allowChat !== undefined) data.allowChat = input.allowChat;
  if (input.allowAudio !== undefined) data.allowAudio = input.allowAudio;
  if (input.maxParticipants !== undefined)
    data.maxParticipants = input.maxParticipants;
  if (input.locked !== undefined)
    data.lockedAt = input.locked ? new Date() : null;
  if (input.password !== undefined) {
    data.passwordHash = input.password
      ? await hashPassword(input.password)
      : null;
  }

  const room = await db.room.update({ where: { id: roomId }, data });
  await recordAudit({ roomId, actorId, event: "room.updated" });
  return room;
}

export async function setRoomLock(
  roomId: string,
  actorId: string,
  locked: boolean,
): Promise<void> {
  await db.room.update({
    where: { id: roomId },
    data: { lockedAt: locked ? new Date() : null },
  });
  await recordAudit({
    roomId,
    actorId,
    event: locked ? "room.locked" : "room.unlocked",
  });
}

export async function leaveRoom(roomId: string, memberId: string): Promise<void> {
  await db.roomMember.updateMany({
    where: { id: memberId, roomId },
    data: { leftAt: new Date() },
  });
}

export async function endRoom(roomId: string, actorId: string): Promise<void> {
  await db.$transaction([
    db.room.update({
      where: { id: roomId },
      data: { status: "ENDED", endedAt: new Date() },
    }),
    db.roomMember.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: new Date() },
    }),
    db.roomInvite.updateMany({
      where: { roomId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
  await deleteLivekitRoom(roomId);
  await recordAudit({ roomId, actorId, event: "room.ended" });
}

export async function setRoomStatus(
  roomId: string,
  status: "WAITING" | "LIVE",
): Promise<void> {
  await db.room.updateMany({
    where: { id: roomId, status: { not: "ENDED" } },
    data: { status },
  });
}
