import { handleRoute, json, Errors } from "@/lib/api/http";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { reopenRoom } from "@/server/services/room-service";

type Ctx = RouteContext<"/api/admin/rooms/[slug]/reopen">;

/** Reactivate an ENDED room (keeps link, cover and settings). Admin only. */
export const POST = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  if (!(await isCurrentUserAdmin())) throw Errors.notFound();

  const room = await db.room.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!room) throw Errors.notFound("Sala inexistente");

  await reopenRoom(room.id, (await getUserId())!);
  return json({ ok: true });
});
