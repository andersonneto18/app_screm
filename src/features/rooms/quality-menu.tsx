"use client";

import { useEffect, useState } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, VideoQuality, type RemoteTrackPublication } from "livekit-client";
import { Gauge } from "lucide-react";

type Choice = "auto" | "high" | "medium" | "low" | "audio";

const OPTIONS: { value: Choice; label: string }[] = [
  { value: "auto", label: "Automática" },
  { value: "high", label: "Alta (720p)" },
  { value: "medium", label: "Média (360p)" },
  { value: "low", label: "Baixa — poupar dados" },
  { value: "audio", label: "Só áudio" },
];

const STORAGE_KEY = "sr-quality";

function load(): Choice {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v && OPTIONS.some((o) => o.value === v)) return v as Choice;
  } catch {
    /* private mode / blocked */
  }
  return "auto";
}

/**
 * Lets each viewer cap the video quality they receive — useful on a phone
 * with a weak signal or a limited data plan. "Automática" hands control back
 * to adaptive streaming (quality follows the view size and the connection).
 */
export function QualityMenu() {
  // Client-only (rendered inside <LiveKitRoom> after connect) — safe to read
  // localStorage in the initialiser without a hydration mismatch.
  const [choice, setChoice] = useState<Choice>(load);

  // The remote screen-share publication, if someone is sharing.
  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  );
  const publication = tracks.find((t) => !t.participant.isLocal)?.publication as
    | RemoteTrackPublication
    | undefined;

  useEffect(() => {
    if (!publication) return;
    try {
      if (choice === "audio") {
        publication.setEnabled(false);
        return;
      }
      publication.setEnabled(true);
      publication.setVideoQuality(
        choice === "low"
          ? VideoQuality.LOW
          : choice === "medium"
            ? VideoQuality.MEDIUM
            : VideoQuality.HIGH, // "high" and "auto" both cap at HIGH; adaptive trims "auto" down by view size
      );
    } catch {
      /* not subscribed yet — re-runs when the publication changes */
    }
  }, [publication, choice]);

  function pick(value: Choice) {
    setChoice(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }

  if (!publication) return null;

  return (
    <label className="relative inline-flex items-center">
      <Gauge className="pointer-events-none absolute left-2 h-4 w-4 text-muted" />
      <span className="sr-only">Qualidade do vídeo</span>
      <select
        value={choice}
        onChange={(e) => pick(e.target.value as Choice)}
        className="h-8 rounded-lg border border-border bg-surface-2 pl-7 pr-2 text-xs text-foreground focus-visible:border-border-strong focus-visible:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
