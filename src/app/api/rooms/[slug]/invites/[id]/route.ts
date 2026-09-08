import { handleRoute, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { revokeInvite } from "@/server/services/invite-service";

type Ctx = RouteContext<"/api/rooms/[slug]/invites/[id]">;

export const DELETE = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug, id } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "REVOKE_INVITE");
  await revokeInvite(room.id, id, member.userId ?? member.id);
  return json({ ok: true });
});
