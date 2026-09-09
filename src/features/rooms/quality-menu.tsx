"use client";

import { useEffect, useState } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, VideoQuality, type RemoteTrackPublication } from "livekit-client";
import { Gauge } from "lucide-react";

type Choice =
  | "auto"
  | "max"
  | "high"
  | "mid"
  | "midlow"
  | "low"
  | "min"
  | "audio";

interface Option {
  value: Choice;
  label: string;
  /** Cap by resolution (maps to the nearest encoded layer). */
  dims?: { width: number; height: number };
  /** Cap by SVC layer. */
  quality?: VideoQuality;
  /** Cap the frame rate the server sends this viewer. */
  fps?: number;
}

const OPTIONS: Option[] = [
  { value: "auto", label: "Automática" },
  {
    value: "max",
    label: "Máxima · 1080p",
    dims: { width: 1920, height: 1080 },
    fps: 30,
  },
  {
    value: "high",
    label: "Alta · 1080p · 20 fps",
    dims: { width: 1920, height: 1080 },
    fps: 20,
  },
  { value: "mid", label: "Média · 540p", quality: VideoQuality.MEDIUM, fps: 30 },
  {
    value: "midlow",
    label: "Média · 540p · 15 fps",
    quality: VideoQuality.MEDIUM,
    fps: 15,
  },
  { value: "low", label: "Baixa · 270p", quality: VideoQuality.LOW, fps: 30 },
  {
    value: "min",
    label: "Dados mínimos · 270p · 10 fps",
    quality: VideoQuality.LOW,
    fps: 10,
  },
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
 * Lets each viewer pick the video quality they receive — useful on a phone
 * with a weak signal or a limited data plan, or on a big screen that wants
 * the full 1080p. "Automática" hands control back to adaptive streaming
 * (quality follows the view size and the connection).
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
    const opt = OPTIONS.find((o) => o.value === choice) ?? OPTIONS[0];
    try {
      if (opt.value === "audio") {
        publication.setEnabled(false);
        return;
      }
      publication.setEnabled(true);

      if (opt.value === "auto") {
        // Reset any manual cap; adaptive dimensions drive it again.
        publication.setVideoQuality(VideoQuality.HIGH);
        publication.setVideoFPS(30);
        return;
      }

      if (opt.dims) publication.setVideoDimensions(opt.dims);
      else if (opt.quality !== undefined)
        publication.setVideoQuality(opt.quality);
      if (opt.fps) publication.setVideoFPS(opt.fps);
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
