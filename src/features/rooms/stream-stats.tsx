"use client";

import { useEffect, useRef, useState } from "react";
import { useTracks } from "@livekit/components-react";
import { Track, type RemoteVideoTrack } from "livekit-client";
import { Activity } from "lucide-react";

interface Stat {
  height: number;
  fps: number;
  kbps: number;
  ms: number | null;
}

/**
 * Small live readout of what this viewer is actually receiving —
 * resolution / frame rate / bitrate / latency. Toggled by the badge.
 */
export function StreamStats() {
  const [open, setOpen] = useState(false);
  const [stat, setStat] = useState<Stat | null>(null);
  const prev = useRef<{ bytes: number; ts: number } | null>(null);

  const tracks = useTracks(
    [{ source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: true },
  );
  const track = tracks.find((t) => !t.participant.isLocal)?.publication?.track as
    | RemoteVideoTrack
    | undefined;

  useEffect(() => {
    if (!track) return;
    let alive = true;
    const tick = async () => {
      const report = await track.getRTCStatsReport().catch(() => undefined);
      if (!report || !alive) return;
      let inbound: RTCInboundRtpStreamStats | undefined;
      let rtt: number | null = null;
      report.forEach((s) => {
        if (s.type === "inbound-rtp" && (s as RTCInboundRtpStreamStats).kind === "video")
          inbound = s as RTCInboundRtpStreamStats;
        if (s.type === "candidate-pair" && "currentRoundTripTime" in s)
          rtt = (s as RTCIceCandidatePairStats).currentRoundTripTime ?? null;
      });
      if (!inbound) return;
      const bytes = inbound.bytesReceived ?? 0;
      const ts = inbound.timestamp;
      let kbps = 0;
      if (prev.current) {
        const dt = (ts - prev.current.ts) / 1000;
        if (dt > 0) kbps = Math.round(((bytes - prev.current.bytes) * 8) / 1000 / dt);
      }
      prev.current = { bytes, ts };
      setStat({
        height: inbound.frameHeight ?? 0,
        fps: Math.round(inbound.framesPerSecond ?? 0),
        kbps,
        ms: rtt != null ? Math.round(rtt * 1000) : null,
      });
    };
    void tick();
    const id = setInterval(tick, 2000);
    return () => {
      alive = false;
      clearInterval(id);
      prev.current = null;
    };
  }, [track]);

  if (!track) return null;

  const label = stat
    ? `${stat.height ? `${stat.height}p` : "—"} · ${stat.fps} fps`
    : "…";

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur"
      >
        <Activity className="h-3 w-3" />
        {label}
      </button>
      {open && stat && (
        <div className="rounded-lg bg-black/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-white backdrop-blur">
          <div>Resolução: {stat.height ? `${stat.height}p` : "—"}</div>
          <div>Fluidez: {stat.fps} fps</div>
          <div>Ritmo: {stat.kbps ? `${(stat.kbps / 1000).toFixed(1)} Mb/s` : "—"}</div>
          <div>Latência: {stat.ms != null ? `${stat.ms} ms` : "—"}</div>
        </div>
      )}
    </div>
  );
}
