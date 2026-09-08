import { db } from "@/lib/db";
import { Errors } from "@/lib/api/http";
import { broadcastToRoom } from "@/lib/livekit/data";
import type { RoomMember } from "@/generated/prisma/client";

export interface ChatMessageView {
  id: string;
  memberId: string;
  name: string;
  content: string;
  at: string;
}

export async function postMessage(
  room: { id: string; allowChat: boolean },
  member: RoomMember,
  content: string,
): Promise<ChatMessageView> {
  if (!room.allowChat) throw Errors.forbidden("O chat está desativado");

  const message = await db.chatMessage.create({
    data: { roomId: room.id, memberId: member.id, content },
    select: { id: true, content: true, createdAt: true },
  });

  const view: ChatMessageView = {
    id: message.id,
    memberId: member.id,
    name: member.displayName,
    content: message.content,
    at: message.createdAt.toISOString(),
  };

  await broadcastToRoom(room.id, { t: "chat", ...view });
  return view;
}

/** Last `limit` messages, oldest first. */
export async function listMessages(
  roomId: string,
  limit = 50,
): Promise<ChatMessageView[]> {
  const rows = await db.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      createdAt: true,
      member: { select: { id: true, displayName: true } },
    },
  });

  return rows.reverse().map((r) => ({
    id: r.id,
    memberId: r.member.id,
    name: r.member.displayName,
    content: r.content,
    at: r.createdAt.toISOString(),
  }));
}
