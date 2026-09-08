"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessageView } from "@/server/services/chat-service";

const MAX = 1000;

export function ChatPanel({
  slug,
  allowChat,
  selfMemberId,
}: {
  slug: string;
  allowChat: boolean;
  selfMemberId: string | null;
}) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const append = useCallback((msg: ChatMessageView) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }, []);

  // History
  useEffect(() => {
    let active = true;
    void fetch(`/api/rooms/${slug}/chat`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d: { messages: ChatMessageView[] }) => {
        if (active) setMessages(d.messages);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [slug]);

  // Live messages over the LiveKit data plane
  useEffect(() => {
    if (!room) return;
    const onData = (payload: Uint8Array) => {
      try {
        const env = JSON.parse(new TextDecoder().decode(payload));
        if (env?.t === "chat") append(env as ChatMessageView);
      } catch {
        /* ignore malformed */
      }
    };
    room.on(RoomEvent.DataReceived, onData);
    return () => {
      room.off(RoomEvent.DataReceived, onData);
    };
  }, [room, append]);

  // Auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${slug}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await res.json().catch(() => null)) as
        | (ChatMessageView & { message?: string })
        | null;
      if (!res.ok) throw new Error(data?.message ?? "Não foi possível enviar");
      if (data?.id) append(data);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  if (!allowChat) {
    return (
      <div className="grid h-full place-items-center text-center text-sm text-muted">
        <p>O chat está desativado nesta sala.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="pt-4 text-center text-sm text-muted-2">
            Ainda sem mensagens.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span
                className={cn(
                  "font-medium",
                  m.memberId === selfMemberId
                    ? "text-primary"
                    : "text-foreground",
                )}
              >
                {m.name}
              </span>
              <span className="ml-1.5 text-[10px] text-muted-2">
                {new Date(m.at).toLocaleTimeString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <p className="whitespace-pre-wrap break-words text-muted">
                {m.content}
              </p>
            </div>
          ))
        )}
      </div>

      {error && <p className="py-1 text-xs text-danger">{error}</p>}

      <form onSubmit={send} className="mt-2 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e);
            }
          }}
          rows={1}
          placeholder="Mensagem…"
          className="max-h-24 min-h-[2.5rem] flex-1 resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted-2 focus-visible:border-border-strong focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
          aria-label="Enviar"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
