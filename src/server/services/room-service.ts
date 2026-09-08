import { Prisma, type Room, type RoomMember } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { generateRoomSlug } from "@/lib/security/ids";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { AppError, Errors } from "@/lib/api/http";
import { logger } from "@/lib/logger";
import type { CreateRoomInput } from "@/schemas/room";
import type { Identity } from "@/lib/auth/session";
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
  locked: boolean;
}

/**
 * Atomically: verify room state, ban, capacity, then upsert membership.
 * Capacity is enforced inside the transaction to survive concurrent joins.
 */
export async function joinRoom({
  slug,
  identity,
  displayName,
  password,
}: JoinArgs): Promise<{ room: Room; member: RoomMember }> {
  return db.$transaction(async (tx) => {
    const room = await tx.room.findUnique({ where: { slug } });
    if (!room) throw Errors.notFound("Sala inexistente");
    if (room.status === "ENDED") throw Errors.gone("A transmissão terminou");

    const isGuest = identity.kind === "guest";
    if (isGuest && !room.allowGuests) {
      throw Errors.forbidden("Esta sala não permite convidados");
    }

    const ban = await tx.roomBan.findFirst({
      where: {
        roomId: room.id,
        ...(identity.kind === "user"
          ? { userId: identity.id }
          : { guestId: identity.id }),
      },
    });
    if (ban) throw Errors.forbidden("Foi removido desta sala");

    const existing = await tx.roomMember.findFirst({
      where: {
        roomId: room.id,
        ...(identity.kind === "user"
          ? { userId: identity.id }
          : { guestId: identity.id }),
      },
    });

    if (!existing && room.passwordHash) {
      const ok = password
        ? await verifyPassword(room.passwordHash, password)
        : false;
      if (!ok) throw new AppError(401, "BAD_PASSWORD", "Senha incorreta");
    }

    if (existing) {
      const member = await tx.roomMember.update({
        where: { id: existing.id },
        data: { leftAt: null, displayName },
      });
      return { room, member };
    }

    const activeCount = await tx.roomMember.count({
      where: { roomId: room.id, leftAt: null },
    });
    if (activeCount >= room.maxParticipants) {
      throw Errors.conflict("Sala cheia");
    }

    const member = await tx.roomMember.create({
      data: {
        roomId: room.id,
        userId: identity.kind === "user" ? identity.id : null,
        guestId: identity.kind === "guest" ? identity.id : null,
        displayName,
        role: "VIEWER",
      },
    });
    return { room, member };
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
