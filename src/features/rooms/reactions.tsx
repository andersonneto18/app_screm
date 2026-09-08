"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { cn } from "@/lib/utils";

export const REACTION_EMOJIS = ["❤️", "👏", "😂", "🔥", "😮", "👍"] as const;

interface FloatingReaction {
  key: string;
  emoji: string;
  left: number;
  name: string;
}

/**
 * Emoji reactions over the stream. Published client-to-client on the LiveKit
 * data plane (RELIABLE) — ephemeral, never persisted. Locally throttled so a
 * viewer can't spam the channel.
 */
export function useReactions() {
  const room = useRoomContext();
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const lastSent = useRef(0);
  const encoder = useRef(new TextEncoder());
  const decoder = useRef(new TextDecoder());

  const spawn = useCallback((emoji: string, name: string) => {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setFloating((prev) => [
      ...prev.slice(-24),
      { key, emoji, name, left: 6 + Math.random() * 78 },
    ]);
    setTimeout(() => {
      setFloating((prev) => prev.filter((f) => f.key !== key));
    }, 2600);
  }, []);

  const send = useCallback(
    (emoji: string) => {
      if (!room) return;
      const now = Date.now();
      if (now - lastSent.current < 450) return;
      lastSent.current = now;

      const name = room.localParticipant?.name ?? "Alguém";
      spawn(emoji, name);

      const payload = encoder.current.encode(
        JSON.stringify({ t: "reaction", emoji, name, at: new Date().toISOString() }),
      );
      void room.localParticipant?.publishData(payload, { reliable: true });
    },
    [room, spawn],
  );

  useEffect(() => {
    if (!room) return;
    const onData = (bytes: Uint8Array) => {
      try {
        const env = JSON.parse(decoder.current.decode(bytes));
        if (env?.t === "reaction" && typeof env.emoji === "string") {
          spawn(env.emoji, env.name ?? "Alguém");
        }
      } catch {
        /* ignore */
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, spawn]);

  return { floating, send };
}

export function ReactionOverlay({
  floating,
}: {
  floating: ReturnType<typeof useReactions>["floating"];
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {floating.map((f) => (
        <span
          key={f.key}
          className="reaction-float absolute bottom-6 text-3xl drop-shadow"
          style={{ left: `${f.left}%` }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}

export function ReactionBar({
  onReact,
  className,
}: {
  onReact: (emoji: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onReact(e)}
          className="rounded-lg px-1.5 py-1 text-lg transition-transform hover:scale-125"
          aria-label={`Reagir com ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
