import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { loadRoomContext } from "@/lib/api/room-context";
import { chatMessageSchema } from "@/schemas/room";
import { postMessage, listMessages } from "@/server/services/chat-service";

type Ctx = RouteContext<"/api/rooms/[slug]/chat">;

export const GET = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room } = await loadRoomContext(slug);
  return json({ messages: await listMessages(room.id) });
});

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "SEND_CHAT");

  const limit = await rateLimit(
    `chat:${member.id}:${clientIp(req)}`,
    RATE_LIMITS.chat,
  );
  if (!limit.success) {
    throw Errors.tooMany("Está a enviar mensagens demasiado depressa");
  }

  const { content } = await parseBody(req, chatMessageSchema);
  const message = await postMessage(room, member, content);
  return json(message, { status: 201 });
});
