import { db } from "@/lib/db";
import { Errors } from "@/lib/api/http";
import { getIdentity, type Identity } from "@/lib/auth/session";
import { requireRoomPermission, type Permission } from "@/lib/permissions";
import type { Room, RoomMember } from "@/generated/prisma/client";

export interface RoomContext {
  room: Room;
  identity: Identity;
  member: RoomMember;
  isAdmin: boolean;
}

/**
 * Load room + the caller's active membership. Throws 401/404/403 as needed.
 * Pass `permission` to also enforce an RBAC check in one step.
 *
 * Platform admins are auto-enrolled as MODERATOR on first touch and bypass
 * every permission check.
 */
export async function loadRoomContext(
  slug: string,
  permission?: Permission,
): Promise<RoomContext> {
  const identity = await getIdentity();
  if (!identity) throw Errors.unauthorized();
  const isAdmin = identity.kind === "user" && identity.isAdmin === true;

  const room = await db.room.findUnique({ where: { slug } });
  if (!room) throw Errors.notFound("Sala inexistente");

  const where = {
    roomId: room.id,
    leftAt: null,
    ...(identity.kind === "user"
      ? { userId: identity.id }
      : { guestId: identity.id }),
  };

  let member = await db.roomMember.findFirst({ where });

  if (!member && isAdmin) {
    member = await db.roomMember.upsert({
      where: { roomId_userId: { roomId: room.id, userId: identity.id } },
      update: { leftAt: null, role: "MODERATOR" },
      create: {
        roomId: room.id,
        userId: identity.id,
        displayName: identity.name ?? "Admin",
        role: "MODERATOR",
      },
    });
  }

  if (!member) throw Errors.forbidden("Não é membro desta sala");

  if (permission && !isAdmin) requireRoomPermission(member.role, permission);

  return { room, identity, member, isAdmin };
}
