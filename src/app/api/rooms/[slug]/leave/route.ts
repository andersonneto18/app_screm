import { handleRoute, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { leaveRoom } from "@/server/services/room-service";
import { recordAudit } from "@/server/services/audit-service";

type Ctx = RouteContext<"/api/rooms/[slug]/leave">;

export const POST = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug);
  await leaveRoom(room.id, member.id);
  await recordAudit({ roomId: room.id, actorId: member.userId, event: "room.left" });
  return json({ ok: true });
});
