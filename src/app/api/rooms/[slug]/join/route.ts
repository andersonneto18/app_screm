import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getIdentity, ensureGuestId } from "@/lib/auth/session";
import { joinRoomSchema } from "@/schemas/room";
import { joinRoom } from "@/server/services/room-service";
import { recordAudit } from "@/server/services/audit-service";

type Ctx = RouteContext<"/api/rooms/[slug]/join">;

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const ip = clientIp(req);

  const joinLimit = await rateLimit(`join:${ip}`, RATE_LIMITS.joinRoom);
  if (!joinLimit.success) throw Errors.tooMany();

  const input = await parseBody(req, joinRoomSchema);

  // Authenticated users keep their identity; everyone else joins as a guest.
  let identity = await getIdentity();
  if (!identity) {
    if (!input.displayName) throw Errors.badRequest("Indique um nome");
    const guestId = await ensureGuestId();
    identity = { kind: "guest", id: guestId };
  }

  if (input.password) {
    const pwLimit = await rateLimit(
      `roomPassword:${slug}:${ip}`,
      RATE_LIMITS.roomPassword,
    );
    if (!pwLimit.success)
      throw Errors.tooMany("Demasiadas tentativas de senha");
  }

  const displayName =
    input.displayName ??
    (identity.kind === "user" ? "Participante" : "Convidado");

  const { room, member } = await joinRoom({
    slug,
    identity,
    displayName,
    password: input.password,
    inviteToken: input.inviteToken,
  });

  await recordAudit({
    roomId: room.id,
    actorId: member.userId,
    event: "room.joined",
    metadata: { guest: identity.kind === "guest" },
  });

  return json({ slug: room.slug, memberId: member.id, role: member.role });
});
