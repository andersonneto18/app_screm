"use client";

import { useState } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoomDetail } from "@/server/services/room-queries";
import { useLivekitToken } from "./use-livekit-token";
import { useRoomDetail } from "./use-room-detail";
import { RoomLayout } from "./room-layout";

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
  const [connError, setConnError] = useState(false);

  const ended = detail.status === "ENDED" || stale || status === "ended";

  if (ended) {
    return <EndedView />;
  }

  if (status === "loading" || !grant) {
    return (
      <Centered>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-sm text-muted">A ligar à sala…</p>
      </Centered>
    );
  }

  if (status === "error" || connError) {
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
            setConnError(false);
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
      serverUrl={grant.url}
      token={grant.token}
      connect
      audio={false}
      video={false}
      onError={() => setConnError(true)}
      className="flex min-h-full flex-1 flex-col"
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
        <a href="/">Voltar ao início</a>
      </Button>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 place-items-center p-6 text-center">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
