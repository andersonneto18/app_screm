"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Grant {
  token: string;
  url: string;
  expiresAt: number;
}

type Status = "loading" | "ready" | "error" | "ended";

/** Why the token request failed — drives the message the user sees. */
export type TokenError = "auth" | "rate" | "network" | null;

/**
 * Fetches a LiveKit token for the room and refreshes it a minute before it
 * expires, so a long session never drops on token expiry.
 */
export function useLivekitToken(slug: string) {
  const [grant, setGrant] = useState<Grant | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<TokenError>(null);
  const runRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

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
        if (res.status === 401 || res.status === 403) {
          // No access / session gone — retrying won't help.
          setError("auth");
          setStatus("error");
          return;
        }
        if (!res.ok) {
          attempt += 1;
          setError(res.status === 429 ? "rate" : "network");
          setStatus("error");
          timer = setTimeout(run, Math.min(2_000 * attempt, 15_000));
          return;
        }

        const next = (await res.json()) as Grant;
        if (cancelled) return;
        attempt = 0;
        setError(null);
        setGrant(next);
        setStatus("ready");

        const refreshIn = Math.max(
          30_000,
          next.expiresAt - Date.now() - 60_000,
        );
        timer = setTimeout(run, refreshIn);
      } catch {
        if (cancelled) return;
        attempt += 1;
        setError("network");
        setStatus("error");
        timer = setTimeout(run, Math.min(2_000 * attempt, 15_000));
      }
    }

    runRef.current = () => {
      clearTimeout(timer);
      attempt = 0;
      void run();
    };
    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  // Stable identity — LiveKitRoom's connect effect keys on the callbacks it gets.
  const retry = useCallback(() => runRef.current(), []);

  return { grant, status, error, retry };
}
