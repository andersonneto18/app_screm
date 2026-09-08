import { z } from "zod";
import {
  handleRoute,
  parseBody,
  json,
  Errors,
  clientIp,
} from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { loadRoomContext } from "@/lib/api/room-context";
import { roomSlugSchema } from "@/schemas/room";
import { createRoomToken } from "@/lib/livekit/token";

const bodySchema = z.object({ slug: roomSlugSchema });

/**
 * Issues a LiveKit access token. The backend is the sole authority on room
 * name, participant identity, role and publish rights — nothing here is taken
 * from the client except which room (by slug) they want to connect to, and
 * that is still checked against their membership.
 */
export const POST = handleRoute(async (req) => {
  const { slug } = await parseBody(req, bodySchema);

  const limit = await rateLimit(
    `livekitToken:${clientIp(req)}:${slug}`,
    RATE_LIMITS.livekitToken,
  );
  if (!limit.success) throw Errors.tooMany();

  const { room, identity, member } = await loadRoomContext(slug);
  if (room.status === "ENDED") throw Errors.gone("A transmissão terminou");

  const grant = await createRoomToken({
    roomId: room.id,
    identity,
    role: member.role,
    displayName: member.displayName,
  });

  return json(grant);
});
