import { handleRoute, parseBody, json } from "@/lib/api/http";
import { z } from "zod";
import { loadRoomContext } from "@/lib/api/room-context";
import { setRoomLock } from "@/server/services/room-service";

type Ctx = RouteContext<"/api/rooms/[slug]/lock">;

const bodySchema = z.object({ locked: z.boolean() });

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "LOCK_ROOM");
  const { locked } = await parseBody(req, bodySchema);
  await setRoomLock(room.id, member.userId ?? member.id, locked);
  return json({ locked });
});
