"use client";

import { isTrackReference, useTracks, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";
import { MonitorPlay } from "lucide-react";
import { AudioUnlock } from "./audio-unlock";

export function ScreenStage({ isOwner }: { isOwner: boolean }) {
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true },
  );
  const screen = tracks.find(isTrackReference);

  return (
    <div
      data-screen-stage
      className="absolute inset-0 flex items-center justify-center bg-black"
    >
      {screen ? (
        <VideoTrack trackRef={screen} className="h-full w-full object-contain" />
      ) : (
        <div className="p-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border">
            <MonitorPlay className="h-6 w-6 text-muted-2" />
          </div>
          <p className="mt-3 text-sm text-foreground">
            {isOwner
              ? "Ainda não iniciou a partilha"
              : "O anfitrião ainda não iniciou a partilha."}
          </p>
          <p className="mt-1 text-xs text-muted-2">
            Quando começar, o ecrã aparece aqui automaticamente.
          </p>
        </div>
      )}

      <AudioUnlock />
    </div>
  );
}
