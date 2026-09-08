"use client";

import {
  isTrackReference,
  StartAudio,
  useTracks,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { MonitorPlay } from "lucide-react";

export function ScreenStage({ isOwner }: { isOwner: boolean }) {
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true },
  );
  const screen = tracks.find(isTrackReference);

  return (
    <div
      data-screen-stage
      className="relative flex flex-1 items-center justify-center bg-black p-0"
    >
      {screen ? (
        <VideoTrack
          trackRef={screen}
          className="h-full max-h-full w-full object-contain"
        />
      ) : (
        <div className="p-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border">
            <MonitorPlay className="h-7 w-7 text-muted-2" />
          </div>
          <p className="mt-4 text-sm text-foreground">
            {isOwner
              ? "Ainda não iniciou a partilha"
              : "O anfitrião ainda não iniciou a partilha."}
          </p>
          <p className="mt-1 text-xs text-muted-2">
            Quando começar, o ecrã aparece aqui automaticamente.
          </p>
        </div>
      )}

      {/* Shown only when the browser blocks audio autoplay (iOS Safari etc.). */}
      <StartAudio
        label="🔊  Toque para ativar o som"
        className="absolute inset-0 z-10 grid place-items-center bg-black/55 text-base font-medium text-white backdrop-blur-sm"
      />
    </div>
  );
}
