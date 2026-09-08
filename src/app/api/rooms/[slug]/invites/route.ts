import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { loadRoomContext } from "@/lib/api/room-context";
import { createInviteSchema } from "@/schemas/room";
import { createInvite, listInvites } from "@/server/services/invite-service";

type Ctx = RouteContext<"/api/rooms/[slug]/invites">;

export const GET = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room } = await loadRoomContext(slug, "CREATE_INVITE");
  return json({ invites: await listInvites(room.id) });
});

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "CREATE_INVITE");

  const limit = await rateLimit(
    `createInvite:${member.userId ?? member.id}:${clientIp(req)}`,
    RATE_LIMITS.createInvite,
  );
  if (!limit.success) throw Errors.tooMany();

  const input = await parseBody(req, createInviteSchema);
  const invite = await createInvite(room.id, member.userId ?? member.id, input);
  return json(invite, { status: 201 });
});
