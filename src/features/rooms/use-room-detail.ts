"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomDetail } from "@/server/services/room-queries";

/**
 * Polls the room detail endpoint. In phase 3 this is superseded by LiveKit
 * room events for presence; polling stays as the fallback for metadata.
 */
export function useRoomDetail(slug: string, initial: RoomDetail) {
  const [detail, setDetail] = useState(initial);
  const [stale, setStale] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${slug}`, { cache: "no-store" });
      if (res.status === 404) {
        setStale(true);
        return;
      }
      if (res.ok) setDetail((await res.json()) as RoomDetail);
    } catch {
      /* transient — keep last known state */
    }
  }, [slug]);

  useEffect(() => {
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return { detail, refresh, stale };
}
