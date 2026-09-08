import { db } from "@/lib/db";
import { generateInviteToken, hashInviteToken } from "@/lib/security/ids";
import { Errors } from "@/lib/api/http";
import { absoluteUrl } from "@/lib/utils";
import type { CreateInviteInput } from "@/schemas/room";
import { recordAudit } from "./audit-service";

export interface CreatedInvite {
  id: string;
  url: string;
  expiresAt: string;
  maxUses: number | null;
}

export async function createInvite(
  roomId: string,
  actorId: string,
  input: CreateInviteInput,
): Promise<CreatedInvite> {
  const token = generateInviteToken();
  const invite = await db.roomInvite.create({
    data: {
      roomId,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + input.expiresInHours * 3_600_000),
      maxUses: input.maxUses,
    },
    select: { id: true, expiresAt: true, maxUses: true },
  });

  await recordAudit({ roomId, actorId, event: "invite.created" });
  return {
    id: invite.id,
    url: absoluteUrl(`/join/${token}`),
    expiresAt: invite.expiresAt.toISOString(),
    maxUses: invite.maxUses,
  };
}

/** Validate a raw invite token; returns the room slug when usable. */
export async function resolveInvite(
  token: string,
): Promise<{ slug: string; roomName: string }> {
  const invite = await db.roomInvite.findFirst({
    where: {
      tokenHash: hashInviteToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      maxUses: true,
      uses: true,
      room: { select: { slug: true, name: true, status: true } },
    },
  });

  if (!invite || invite.room.status === "ENDED") {
    throw Errors.gone("Convite inválido ou expirado");
  }
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    throw Errors.gone("Convite esgotado");
  }
  return { slug: invite.room.slug, roomName: invite.room.name };
}

export async function revokeInvite(
  roomId: string,
  inviteId: string,
  actorId: string,
): Promise<void> {
  const result = await db.roomInvite.updateMany({
    where: { id: inviteId, roomId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw Errors.notFound("Convite não encontrado");
  await recordAudit({ roomId, actorId, event: "invite.revoked" });
}

export async function listInvites(roomId: string) {
  const invites = await db.roomInvite.findMany({
    where: { roomId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, expiresAt: true, maxUses: true, uses: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return invites.map((i) => ({
    id: i.id,
    expiresAt: i.expiresAt.toISOString(),
    maxUses: i.maxUses,
    uses: i.uses,
    createdAt: i.createdAt.toISOString(),
  }));
}
