import { handleRoute, json, Errors } from "@/lib/api/http";
import { getUserId } from "@/lib/auth/session";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import { purgeEndedRooms } from "@/server/services/room-service";

/** Permanently delete every ENDED room. Admin only. */
export const POST = handleRoute(async () => {
  if (!(await isCurrentUserAdmin())) throw Errors.notFound();
  const count = await purgeEndedRooms((await getUserId())!);
  return json({ deleted: count });
});
