import { z } from "zod";
import { handleRoute, parseBody, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { setParticipantRole } from "@/server/services/participant-service";

type Ctx = RouteContext<"/api/rooms/[slug]/participants/[id]/role">;

const bodySchema = z.object({ role: z.enum(["MODERATOR", "VIEWER"]) });

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug, id } = await ctx.params;
  const { room, member, isAdmin } = await loadRoomContext(
    slug,
    "PROMOTE_MODERATOR",
  );
  const { role } = await parseBody(req, bodySchema);
  await setParticipantRole(room.id, id, member, role, isAdmin);
  return json({ role });
});
