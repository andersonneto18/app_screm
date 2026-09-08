import { handleRoute, parseBody, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { participantActionSchema } from "@/schemas/room";
import { banParticipant } from "@/server/services/participant-service";

type Ctx = RouteContext<"/api/rooms/[slug]/participants/[id]/ban">;

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug, id } = await ctx.params;
  const { room, member, isAdmin } = await loadRoomContext(
    slug,
    "BAN_PARTICIPANT",
  );
  const { reason } = await parseBody(req, participantActionSchema);
  await banParticipant(room.id, id, member, reason, isAdmin);
  return json({ ok: true });
});
