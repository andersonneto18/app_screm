"use client";

import {
  isTrackReference,
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
    </div>
  );
}
