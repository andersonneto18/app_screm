import { db } from "@/lib/db";
import { Errors } from "@/lib/api/http";
import { PermissionError } from "@/lib/permissions";
import { disconnectParticipant } from "@/lib/livekit/token";
import type { RoomMember, RoomRole } from "@/generated/prisma/client";
import type { Identity } from "@/lib/auth/session";
import { recordAudit } from "./audit-service";

function memberIdentity(member: Pick<RoomMember, "userId" | "guestId">): Identity {
  if (member.userId) return { kind: "user", id: member.userId };
  if (member.guestId) return { kind: "guest", id: member.guestId };
  throw Errors.badRequest("Participante sem identidade");
}

/**
 * A moderator may act on viewers only; the owner may act on anyone but
 * themselves. Nobody may act on the owner — except a platform admin, who may
 * act on anyone but themselves.
 */
function assertCanActOn(
  actor: RoomMember,
  target: RoomMember,
  isAdmin: boolean,
): void {
  if (actor.id === target.id) {
    throw Errors.badRequest("Não pode fazer isto a si próprio");
  }
  if (isAdmin) return;
  if (target.role === "OWNER") {
    throw new PermissionError("REMOVE_PARTICIPANT");
  }
  if (actor.role === "MODERATOR" && target.role !== "VIEWER") {
    throw new PermissionError("REMOVE_PARTICIPANT");
  }
}

async function loadTarget(roomId: string, memberId: string): Promise<RoomMember> {
  const target = await db.roomMember.findFirst({
    where: { id: memberId, roomId },
  });
  if (!target) throw Errors.notFound("Participante não encontrado");
  return target;
}

export async function kickParticipant(
  roomId: string,
  memberId: string,
  actor: RoomMember,
  isAdmin = false,
): Promise<void> {
  const target = await loadTarget(roomId, memberId);
  assertCanActOn(actor, target, isAdmin);

  await db.roomMember.update({
    where: { id: target.id },
    data: { leftAt: new Date() },
  });
  await disconnectParticipant(roomId, memberIdentity(target));
  await recordAudit({
    roomId,
    actorId: actor.userId,
    event: "participant.kicked",
    metadata: { targetMemberId: target.id, targetName: target.displayName },
  });
}

export async function banParticipant(
  roomId: string,
  memberId: string,
  actor: RoomMember,
  reason?: string,
  isAdmin = false,
): Promise<void> {
  const target = await loadTarget(roomId, memberId);
  assertCanActOn(actor, target, isAdmin);

  await db.$transaction([
    db.roomBan.create({
      data: {
        roomId,
        userId: target.userId,
        guestId: target.guestId,
        reason: reason ?? null,
      },
    }),
    db.roomMember.update({
      where: { id: target.id },
      data: { leftAt: new Date() },
    }),
  ]);
  await disconnectParticipant(roomId, memberIdentity(target));
  await recordAudit({
    roomId,
    actorId: actor.userId,
    event: "participant.banned",
    metadata: { targetMemberId: target.id, targetName: target.displayName, reason },
  });
}

/** Owner (or platform admin) only: promote a viewer or demote a moderator. */
export async function setParticipantRole(
  roomId: string,
  memberId: string,
  actor: RoomMember,
  role: Extract<RoomRole, "MODERATOR" | "VIEWER">,
  isAdmin = false,
): Promise<void> {
  if (actor.role !== "OWNER" && !isAdmin) {
    throw new PermissionError("PROMOTE_MODERATOR");
  }

  const target = await loadTarget(roomId, memberId);
  if (target.role === "OWNER") throw new PermissionError("PROMOTE_MODERATOR");
  if (target.id === actor.id) {
    throw Errors.badRequest("Não pode alterar o seu próprio papel");
  }

  await db.roomMember.update({ where: { id: target.id }, data: { role } });
  await recordAudit({
    roomId,
    actorId: actor.userId,
    event: role === "MODERATOR" ? "participant.promoted" : "participant.demoted",
    metadata: { targetMemberId: target.id },
  });
}
