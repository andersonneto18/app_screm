import { handleRoute, json, Errors } from "@/lib/api/http";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { deleteRoom } from "@/server/services/room-service";

type Ctx = RouteContext<"/api/admin/rooms/[slug]">;

/** Permanently delete a room. Admin only. */
export const DELETE = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  if (!(await isCurrentUserAdmin())) throw Errors.notFound();

  const userId = await getUserId();
  const room = await db.room.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!room) throw Errors.notFound("Sala inexistente");

  await deleteRoom(room.id, userId!);
  return json({ ok: true });
});
