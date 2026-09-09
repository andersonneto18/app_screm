"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { ScreenShare, ScreenShareOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareControls({
  slug,
  canPublish,
  allowAudio,
  onStatusChange,
}: {
  slug: string;
  canPublish: boolean;
  allowAudio: boolean;
  onStatusChange: () => void;
}) {
  const { localParticipant, isScreenShareEnabled, isMicrophoneEnabled } =
    useLocalParticipant();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wasSharing = useRef(false);

  // Reflect stream state to the server (covers the browser's own "stop sharing").
  useEffect(() => {
    if (!canPublish) return;
    if (isScreenShareEnabled && !wasSharing.current) {
      wasSharing.current = true;
      void reportStatus(slug, "LIVE").then(onStatusChange);
    } else if (!isScreenShareEnabled && wasSharing.current) {
      wasSharing.current = false;
      void reportStatus(slug, "WAITING").then(onStatusChange);
    }
  }, [isScreenShareEnabled, canPublish, slug, onStatusChange]);

  if (!canPublish) return null;

  async function toggleShare() {
    setError(null);
    setPending(true);
    try {
      // Let the browser present its own screen/window/tab picker; never auto-pick.
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
        audio: allowAudio,
        // Capture at 1080p so the top SVC layer really is 1080p for
        // big-screen viewers. Dynacast means that layer is only encoded/sent
        // while someone actually requests it — phone viewers pull 540p/270p
        // and the host never pays for 1080p unless a TV/PC viewer asks.
        resolution: { width: 1920, height: 1080, frameRate: 30 },
        contentHint: "motion", // smooth playback of video content
        selfBrowserSurface: "include",
        surfaceSwitching: "include",
        systemAudio: allowAudio ? "include" : "exclude",
      });
    } catch (err) {
      // User dismissed the picker → not an error worth showing.
      if (!(err instanceof DOMException && err.name === "NotAllowedError")) {
        setError("Não foi possível iniciar a partilha de ecrã.");
      }
    } finally {
      setPending(false);
    }
  }

  async function toggleMic() {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch {
      setError("Não foi possível ligar o microfone.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isScreenShareEnabled ? "danger" : "secondary"}
        size="sm"
        onClick={toggleShare}
        disabled={pending}
      >
        {isScreenShareEnabled ? (
          <>
            <ScreenShareOff className="h-4 w-4" />
            Parar partilha
          </>
        ) : (
          <>
            <ScreenShare className="h-4 w-4" />
            Partilhar ecrã
          </>
        )}
      </Button>

      {allowAudio && (
        <Button variant="ghost" size="sm" onClick={toggleMic}>
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4 text-muted" />
          )}
          {isMicrophoneEnabled ? "Microfone: ligado" : "Microfone"}
        </Button>
      )}

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

async function reportStatus(slug: string, status: "LIVE" | "WAITING") {
  try {
    await fetch(`/api/rooms/${slug}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
  } catch {
    /* best-effort; polling will reconcile */
  }
}
