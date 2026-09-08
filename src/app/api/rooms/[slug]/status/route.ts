import { z } from "zod";
import { handleRoute, parseBody, json } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import { requireRoomPermission } from "@/lib/permissions";
import { setRoomStatus } from "@/server/services/room-service";
import { recordAudit } from "@/server/services/audit-service";

type Ctx = RouteContext<"/api/rooms/[slug]/status">;

const bodySchema = z.object({ status: z.enum(["WAITING", "LIVE"]) });

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member, isAdmin } = await loadRoomContext(slug);
  const { status } = await parseBody(req, bodySchema);

  if (!isAdmin) {
    requireRoomPermission(
      member.role,
      status === "LIVE" ? "START_SHARE" : "STOP_SHARE",
    );
  }

  await setRoomStatus(room.id, status);
  await recordAudit({
    roomId: room.id,
    actorId: member.userId,
    event: status === "LIVE" ? "stream.started" : "stream.stopped",
  });
  return json({ status });
});
