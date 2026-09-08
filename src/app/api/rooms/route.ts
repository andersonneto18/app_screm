import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getUserId } from "@/lib/auth/session";
import { createRoomSchema } from "@/schemas/room";
import { createRoom } from "@/server/services/room-service";
import { listPublicRooms } from "@/server/services/room-queries";

export const GET = handleRoute(async () => {
  const rooms = await listPublicRooms();
  return json({ rooms });
});

export const POST = handleRoute(async (req) => {
  const userId = await getUserId();
  if (!userId) throw Errors.unauthorized();

  const limit = await rateLimit(
    `createRoom:${userId}:${clientIp(req)}`,
    RATE_LIMITS.createRoom,
  );
  if (!limit.success) throw Errors.tooMany("Demasiadas salas criadas. Tente mais tarde.");

  const input = await parseBody(req, createRoomSchema);
  const room = await createRoom(userId, input);

  return json({ slug: room.slug }, { status: 201 });
});
