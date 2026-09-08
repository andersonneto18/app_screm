import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getIdentity } from "@/lib/auth/session";
import { createRoomSchema } from "@/schemas/room";
import { createRoom } from "@/server/services/room-service";
import { listPublicRooms } from "@/server/services/room-queries";
import { getPlatformSettings } from "@/server/services/settings-service";

export const GET = handleRoute(async () => {
  const rooms = await listPublicRooms();
  return json({ rooms });
});

export const POST = handleRoute(async (req) => {
  const identity = await getIdentity();
  if (!identity || identity.kind !== "user") throw Errors.unauthorized();

  if (!identity.isAdmin) {
    const { allowUserBroadcast } = await getPlatformSettings();
    if (!allowUserBroadcast) {
      throw Errors.forbidden(
        "A criação de salas está reservada ao anfitrião.",
      );
    }
  }

  const limit = await rateLimit(
    `createRoom:${identity.id}:${clientIp(req)}`,
    RATE_LIMITS.createRoom,
  );
  if (!limit.success) {
    throw Errors.tooMany("Demasiadas salas criadas. Tente mais tarde.");
  }

  const input = await parseBody(req, createRoomSchema);
  const room = await createRoom(identity.id, input);

  return json({ slug: room.slug }, { status: 201 });
});
