import { handleRoute, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { endRoom } from "@/server/services/room-service";

type Ctx = RouteContext<"/api/rooms/[slug]/end">;

export const POST = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "END_ROOM");
  await endRoom(room.id, member.userId ?? member.id);
  return json({ ok: true });
});
