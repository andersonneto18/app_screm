import { handleRoute, parseBody, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { participantActionSchema } from "@/schemas/room";
import { kickParticipant } from "@/server/services/participant-service";

type Ctx = RouteContext<"/api/rooms/[slug]/participants/[id]/kick">;

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug, id } = await ctx.params;
  const { room, member, isAdmin } = await loadRoomContext(
    slug,
    "REMOVE_PARTICIPANT",
  );
  await parseBody(req, participantActionSchema);
  await kickParticipant(room.id, id, member, isAdmin);
  return json({ ok: true });
});
