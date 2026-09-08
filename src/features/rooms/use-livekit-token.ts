"use client";

import { useEffect, useRef, useState } from "react";

interface Grant {
  token: string;
  url: string;
  expiresAt: number;
}

type Status = "loading" | "ready" | "error" | "ended";

/**
 * Fetches a LiveKit token for the room and refreshes it a minute before it
 * expires, so a long session never drops on token expiry.
 */
export function useLivekitToken(slug: string) {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const retryRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function run() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (cancelled) return;

        if (res.status === 410) {
          setStatus("ended");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          timer = setTimeout(run, 5_000);
          return;
        }

        const next = (await res.json()) as Grant;
        if (cancelled) return;
        setGrant(next);
        setStatus("ready");

        const refreshIn = Math.max(
          30_000,
          next.expiresAt - Date.now() - 60_000,
        );
        timer = setTimeout(run, refreshIn);
      } catch {
        if (cancelled) return;
        setStatus("error");
        timer = setTimeout(run, 5_000);
      }
    }

    retryRef.current = () => {
      clearTimeout(timer);
      void run();
    };
    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  return { grant, status, retry: () => retryRef.current() };
}
