"use client";

import { useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Volume2 } from "lucide-react";

/**
 * iOS Safari (and others) block audio autoplay until a user gesture. When the
 * room can't play audio, show a tap target over the stage; it disappears once
 * playback is unlocked.
 */
export function AudioUnlock() {
  const room = useRoomContext();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!room) return;
    const sync = () => setBlocked(!room.canPlaybackAudio);
    sync();
    room.on(RoomEvent.AudioPlaybackStatusChanged, sync);
    return () => {
      room.off(RoomEvent.AudioPlaybackStatusChanged, sync);
    };
  }, [room]);

  if (!blocked) return null;

  return (
    <button
      type="button"
      onClick={() => void room?.startAudio()}
      className="absolute inset-0 z-20 grid place-items-center bg-black/55 backdrop-blur-sm"
    >
      <span className="flex flex-col items-center gap-2 text-white">
        <Volume2 className="h-8 w-8" />
        <span className="text-sm font-medium">Toque para ativar o som</span>
      </span>
    </button>
  );
}
