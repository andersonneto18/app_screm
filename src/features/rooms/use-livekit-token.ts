"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 410) {
        setStatus("ended");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const next = (await res.json()) as Grant;
      setGrant(next);
      setStatus("ready");

      const refreshIn = Math.max(30_000, next.expiresAt - Date.now() - 60_000);
      clearTimeout(timer.current);
      timer.current = setTimeout(fetchToken, refreshIn);
    } catch {
      setStatus("error");
      clearTimeout(timer.current);
      timer.current = setTimeout(fetchToken, 5_000);
    }
  }, [slug]);

  useEffect(() => {
    void fetchToken();
    return () => clearTimeout(timer.current);
  }, [fetchToken]);

  return { grant, status, retry: fetchToken };
}
