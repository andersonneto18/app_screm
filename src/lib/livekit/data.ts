import { RoomServiceClient, DataPacket_Kind } from "livekit-server-sdk";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { livekitRoomName } from "./token";

let client: RoomServiceClient | null = null;
function service(): RoomServiceClient {
  if (!client) {
    client = new RoomServiceClient(
      env.LIVEKIT_URL.replace(/^ws/, "http"),
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET,
    );
  }
  return client;
}

export interface ChatEnvelope {
  t: "chat";
  id: string;
  memberId: string;
  name: string;
  content: string;
  at: string;
}

export type RoomDataEnvelope = ChatEnvelope;

/** Broadcast a JSON envelope to every participant over the LiveKit data plane. */
export async function broadcastToRoom(
  roomId: string,
  envelope: RoomDataEnvelope,
): Promise<void> {
  try {
    const payload = new TextEncoder().encode(JSON.stringify(envelope));
    await service().sendData(
      livekitRoomName(roomId),
      payload,
      DataPacket_Kind.RELIABLE,
      {},
    );
  } catch (err) {
    // Non-fatal: message is persisted; clients reconcile via history fetch.
    logger.warn({ err, roomId, kind: envelope.t }, "broadcastToRoom failed");
  }
}
