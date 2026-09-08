import { handleRoute, parseBody, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { getRoomDetail } from "@/server/services/room-queries";
import { getIdentity } from "@/lib/auth/session";
import { updateRoomSchema } from "@/schemas/room";
import { updateRoom, endRoom } from "@/server/services/room-service";
import { Errors } from "@/lib/api/http";

type Ctx = RouteContext<"/api/rooms/[slug]">;

export const GET = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const identity = await getIdentity();
  const detail = await getRoomDetail(slug, identity);
  if (!detail) throw Errors.notFound("Sala inexistente");
  return json(detail);
});

export const PATCH = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "UPDATE_ROOM_SETTINGS");
  const input = await parseBody(req, updateRoomSchema);
  const updated = await updateRoom(room.id, member.userId ?? member.id, input);
  return json({ slug: updated.slug });
});

export const DELETE = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "END_ROOM");
  await endRoom(room.id, member.userId ?? member.id);
  return json({ ok: true });
});
