import {
  AccessToken,
  RoomServiceClient,
  TrackSource,
} from "livekit-server-sdk";
import { env } from "@/lib/env";
import type { RoomRole } from "@/generated/prisma/client";
import type { Identity } from "@/lib/auth/session";

/** LiveKit room name = the DB room id. Never derived from client input. */
export function livekitRoomName(roomId: string): string {
  return `sr_${roomId}`;
}

/** Stable, backend-assigned participant identity. */
export function livekitIdentity(identity: Identity): string {
  return `${identity.kind}:${identity.id}`;
}

const TOKEN_TTL_SECONDS = 20 * 60; // short-lived; client renews before expiry

interface GrantArgs {
  roomId: string;
  identity: Identity;
  role: RoomRole;
  displayName: string;
}

/**
 * Mint a LiveKit access token. The backend fully determines room, identity,
 * publish rights and metadata — the client never chooses any of them.
 * Only OWNER/MODERATOR may publish; VIEWER is subscribe-only.
 */
export async function createRoomToken({
  roomId,
  identity,
  role,
  displayName,
}: GrantArgs): Promise<{ token: string; url: string; expiresAt: number }> {
  const canPublish = role === "OWNER" || role === "MODERATOR";

  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: livekitIdentity(identity),
    name: displayName,
    ttl: TOKEN_TTL_SECONDS,
    metadata: JSON.stringify({ role }),
  });

  at.addGrant({
    room: livekitRoomName(roomId),
    roomJoin: true,
    roomCreate: false,
    canPublish,
    canSubscribe: true,
    canPublishData: true, // reactions / presence pings
    canPublishSources: canPublish
      ? [
          TrackSource.SCREEN_SHARE,
          TrackSource.SCREEN_SHARE_AUDIO,
          TrackSource.MICROPHONE,
        ]
      : [],
    canUpdateOwnMetadata: false,
  });

  return {
    token: await at.toJwt(),
    url: env.LIVEKIT_URL,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
  };
}

let roomService: RoomServiceClient | null = null;

function getRoomService(): RoomServiceClient {
  if (!roomService) {
    // RoomServiceClient wants an http(s) URL, not ws(s).
    const httpUrl = env.LIVEKIT_URL.replace(/^ws/, "http");
    roomService = new RoomServiceClient(
      httpUrl,
      env.LIVEKIT_API_KEY,
      env.LIVEKIT_API_SECRET,
    );
  }
  return roomService;
}

/** Forcibly disconnect a participant (kick). Safe to call if absent. */
export async function disconnectParticipant(
  roomId: string,
  identity: Identity,
): Promise<void> {
  try {
    await getRoomService().removeParticipant(
      livekitRoomName(roomId),
      livekitIdentity(identity),
    );
  } catch {
    /* participant not connected — nothing to do */
  }
}

/** Tear down the whole LiveKit room (on room end). */
export async function deleteLivekitRoom(roomId: string): Promise<void> {
  try {
    await getRoomService().deleteRoom(livekitRoomName(roomId));
  } catch {
    /* room may not exist yet */
  }
}
