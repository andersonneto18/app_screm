import { db } from "@/lib/db";
import { Errors } from "@/lib/api/http";
import { getIdentity, type Identity } from "@/lib/auth/session";
import {
  requireRoomPermission,
  type Permission,
} from "@/lib/permissions";
import type { Room, RoomMember } from "@/generated/prisma/client";

export interface RoomContext {
  room: Room;
  identity: Identity;
  member: RoomMember;
}

/**
 * Load room + the caller's active membership. Throws 401/404/403 as needed.
 * Pass `permission` to also enforce an RBAC check in one step.
 */
export async function loadRoomContext(
  slug: string,
  permission?: Permission,
): Promise<RoomContext> {
  const identity = await getIdentity();
  if (!identity) throw Errors.unauthorized();

  const room = await db.room.findUnique({ where: { slug } });
  if (!room) throw Errors.notFound("Sala inexistente");

  const member = await db.roomMember.findFirst({
    where: {
      roomId: room.id,
      leftAt: null,
      ...(identity.kind === "user"
        ? { userId: identity.id }
        : { guestId: identity.id }),
    },
  });
  if (!member) throw Errors.forbidden("Não é membro desta sala");

  if (permission) requireRoomPermission(member.role, permission);

  return { room, identity, member };
}
