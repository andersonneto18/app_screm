"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { DisconnectReason, Room } from "livekit-client";
import { MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoomDetail } from "@/server/services/room-queries";
import { useLivekitToken } from "./use-livekit-token";
import { useRoomDetail } from "./use-room-detail";
import { RoomLayout } from "./room-layout";

// Reasons the media server won't let us back in — no point auto-retrying.
const FATAL_DISCONNECTS = new Set<DisconnectReason>([
  DisconnectReason.DUPLICATE_IDENTITY,
  DisconnectReason.SERVER_SHUTDOWN,
  DisconnectReason.PARTICIPANT_REMOVED,
  DisconnectReason.ROOM_DELETED,
  DisconnectReason.ROOM_CLOSED,
]);

export function RoomShell({
  slug,
  initialDetail,
  viewerName,
}: {
  slug: string;
  initialDetail: RoomDetail;
  viewerName: string;
}) {
  const { grant, status, retry } = useLivekitToken(slug);
  const { detail, refresh, stale } = useRoomDetail(slug, initialDetail);
  const [fatal, setFatal] = useState<null | "removed" | "closed" | "media">(null);

  // One Room instance for the page lifetime — never recreated on render.
  const room = useMemo(
    () =>
      new Room({
        // Viewers pull the layer that matches their view — but count device
        // pixel ratio, so a retina screen / fullscreen gets the crisp layer.
        adaptiveStream: { pixelDensity: "screen" },
        dynacast: true, // pause layers nobody is watching
        publishDefaults: {
          // Audience is mostly phones watching video content. 720p is
          // indistinguishable from 1080p on a ~6" screen but roughly halves
          // the host's encode load and everyone's data use — the biggest win
          // against stutter. VP9 SVC: one encode, 3 layers each viewer picks
          // from; motion stays smooth and resolution scales down (not freezes)
          // under congestion. VP8 backup covers the rare non-VP9 device.
          screenShareEncoding: {
            maxBitrate: 3_500_000, // ample for crisp 720p30 motion
            maxFramerate: 30,
            priority: "high",
          },
          videoCodec: "vp9",
          scalabilityMode: "L3T3_KEY",
          backupCodec: true,
          degradationPreference: "maintain-framerate",
        },
      }),
    [],
  );

  // Stable — LiveKitRoom's connect effect keys on these.
  const onError = useCallback((err: Error) => {
    // Transient; LiveKit retries on its own. Just record it.
    console.warn("LiveKit error (recoverable):", err.message);
  }, []);

  const onDisconnected = useCallback((reason?: DisconnectReason) => {
    if (reason === undefined) return;
    if (
      reason === DisconnectReason.PARTICIPANT_REMOVED
    ) {
      setFatal("removed");
    } else if (
      reason === DisconnectReason.ROOM_DELETED ||
      reason === DisconnectReason.ROOM_CLOSED ||
      reason === DisconnectReason.SERVER_SHUTDOWN
    ) {
      setFatal("closed");
    } else if (FATAL_DISCONNECTS.has(reason)) {
      setFatal("media");
    }
  }, []);

  const ended = detail.status === "ENDED" || stale || status === "ended";
  if (ended || fatal === "closed") return <EndedView />;
  if (fatal === "removed") {
    return (
      <Centered>
        <MonitorPlay className="h-10 w-10 text-muted-2" />
        <h1 className="mt-4 text-lg font-medium">Foi removido desta sala.</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </Centered>
    );
  }

  if (status === "loading" || !grant) {
    return (
      <Centered>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-sm text-muted">A ligar à sala…</p>
      </Centered>
    );
  }

  if (status === "error" || fatal === "media") {
    return (
      <Centered>
        <MonitorPlay className="h-10 w-10 text-muted-2" />
        <p className="mt-4 text-sm text-foreground">
          Não foi possível ligar ao servidor de media.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => {
            setFatal(null);
            void retry();
          }}
        >
          Tentar novamente
        </Button>
      </Centered>
    );
  }

  return (
    <LiveKitRoom
      room={room}
      serverUrl={grant.url}
      token={grant.token}
      connect
      audio={false}
      video={false}
      onError={onError}
      onDisconnected={onDisconnected}
      className="contents"
    >
      <RoomAudioRenderer />
      <RoomLayout
        slug={slug}
        detail={detail}
        viewerName={viewerName}
        refreshDetail={refresh}
      />
    </LiveKitRoom>
  );
}

function EndedView() {
  return (
    <Centered>
      <MonitorPlay className="h-10 w-10 text-muted-2" />
      <h1 className="mt-4 text-lg font-medium">A transmissão terminou.</h1>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">Voltar ao início</Link>
      </Button>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-background p-6 text-center">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
