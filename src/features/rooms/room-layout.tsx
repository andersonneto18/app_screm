"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useConnectionState,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Crown, LogOut, Maximize, MessageSquare, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import type { RoomDetail } from "@/server/services/room-queries";
import { ScreenStage } from "./screen-stage";
import { ShareControls } from "./share-controls";
import { InvitePanel } from "./invite-panel";
import { ParticipantMenu } from "./participant-menu";
import { ChatPanel } from "./chat-panel";
import { ReactionBar, ReactionOverlay, useReactions } from "./reactions";

type Tab = "participants" | "chat";

interface ParsedMeta {
  role?: "OWNER" | "MODERATOR" | "VIEWER";
}

export function RoomLayout({
  slug,
  detail,
  viewerName,
  refreshDetail,
}: {
  slug: string;
  detail: RoomDetail;
  viewerName: string;
  refreshDetail: () => void;
}) {
  const router = useRouter();
  const connection = useConnectionState();
  const participants = useParticipants();
  const { floating, send: react } = useReactions();
  const [tab, setTab] = useState<Tab>("chat");
  const [busy, setBusy] = useState(false);

  // A platform admin gets full host controls in any room.
  const isOwner = detail.viewerRole === "OWNER" || detail.viewerIsAdmin;
  const canManage =
    isOwner || detail.viewerRole === "MODERATOR" || detail.viewerIsAdmin;
  const isLive = detail.status === "LIVE";

  async function post(path: string) {
    setBusy(true);
    try {
      await fetch(`/api/rooms/${slug}${path}`, { method: "POST" });
      refreshDetail();
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    await post("/leave");
    router.push("/");
  }

  async function endRoom() {
    if (!confirm("Tem a certeza que deseja terminar esta sala?")) return;
    await post("/end");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-3 sm:h-14 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Logo />
          <span className="truncate text-sm text-muted">/ {detail.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
          <ConnectionBadge state={connection} live={isLive} />
          <span className="hidden text-muted sm:inline">{viewerName}</span>
        </div>
      </header>

      {connection === ConnectionState.Reconnecting && (
        <p className="shrink-0 bg-yellow-500/10 px-4 py-1.5 text-center text-xs text-yellow-500">
          A reconectar…
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Media + controls */}
        <div className="flex min-w-0 flex-col lg:flex-1">
          <div className="relative aspect-video w-full overflow-hidden bg-black lg:aspect-auto lg:min-h-0 lg:flex-1">
            <ScreenStage isOwner={isOwner} />
            <ReactionOverlay floating={floating} />
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-border px-3 py-2 sm:gap-2 sm:px-4 sm:py-3">
            <ShareControls
              slug={slug}
              canPublish={canManage}
              allowAudio={detail.allowAudio}
              onStatusChange={refreshDetail}
            />
            <ReactionBar onReact={react} />
            {!isOwner && <FullscreenButton />}

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {canManage && <InvitePanel slug={slug} />}
              <Button variant="ghost" size="sm" onClick={leave} disabled={busy}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
              {isOwner && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={endRoom}
                  disabled={busy}
                >
                  <span className="sm:hidden">Terminar</span>
                  <span className="hidden sm:inline">Terminar sala</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: fills the rest on mobile, fixed column on desktop */}
        <aside className="flex min-h-0 flex-1 flex-col border-t border-border lg:w-80 lg:flex-none lg:border-l lg:border-t-0">
          <div className="flex shrink-0 border-b border-border">
            <TabButton
              active={tab === "chat"}
              onClick={() => setTab("chat")}
              icon={MessageSquare}
              label="Chat"
            />
            <TabButton
              active={tab === "participants"}
              onClick={() => setTab("participants")}
              icon={Users}
              label={`Pessoas · ${Math.max(participants.length, detail.members.length)}`}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-3">
            {tab === "participants" ? (
              <div className="h-full overflow-y-auto">
              <ParticipantList
                slug={slug}
                detail={detail}
                onlineNames={
                  new Set(
                    participants
                      .map((p) => p.name)
                      .filter((n): n is string => Boolean(n)),
                  )
                }
                canManage={canManage}
                onChange={refreshDetail}
              />
              </div>
            ) : (
              <ChatPanel
                slug={slug}
                allowChat={detail.allowChat}
                selfMemberId={detail.viewerMemberId}
              />
            )}
          </div>

          <p className="border-t border-border px-3 py-2 text-center text-xs text-muted-2">
            A transmissão não está a ser gravada.
          </p>
        </aside>
      </div>
    </div>
  );
}

function ParticipantList({
  slug,
  detail,
  onlineNames,
  canManage,
  onChange,
}: {
  slug: string;
  detail: RoomDetail;
  onlineNames: Set<string>;
  canManage: boolean;
  onChange: () => void;
}) {
  const actorRole = detail.viewerRole === "MODERATOR" ? "MODERATOR" : "OWNER";
  return (
    <ul className="space-y-1">
      {detail.members.map((m) => {
        const online = m.isSelf || onlineNames.has(m.displayName);
        return (
          <li
            key={m.id}
            className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-2"
          >
            <span className="flex items-center gap-2">
              <span className="relative grid h-7 w-7 place-items-center rounded-full bg-surface-3 text-xs font-medium">
                {m.displayName.charAt(0).toUpperCase()}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface",
                    online ? "bg-success" : "bg-muted-2",
                  )}
                />
              </span>
              <span>
                <span className="flex items-center gap-1 text-sm text-foreground">
                  {m.role === "OWNER" && (
                    <Crown className="h-3.5 w-3.5 text-yellow-400" />
                  )}
                  {m.displayName}
                  {m.isSelf && (
                    <span className="text-xs text-muted-2">· você</span>
                  )}
                </span>
                <span className="block text-xs text-muted">
                  {ROLE_LABEL[m.role]}
                </span>
              </span>
            </span>
            {canManage && !m.isSelf && m.role !== "OWNER" && (
              <ParticipantMenu
                slug={slug}
                member={m}
                actorRole={actorRole}
                onDone={onChange}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ConnectionBadge({
  state,
  live,
}: {
  state: ConnectionState;
  live: boolean;
}) {
  if (state === ConnectionState.Connected && live) {
    return (
      <span className="inline-flex items-center gap-1.5 text-live">
        <span className="live-dot h-2 w-2 rounded-full bg-live" />
        <LiveTimer />
      </span>
    );
  }
  if (state === ConnectionState.Connected) {
    return <span className="text-muted">Ligado</span>;
  }
  return <span className="text-muted-2">Offline</span>;
}

function LiveTimer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">Em direto · {formatDuration(seconds)}</span>;
}

function FullscreenButton() {
  async function toggle() {
    const el = document.querySelector<HTMLElement>("[data-screen-stage]");
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await el.requestFullscreen();
      // Best-effort: land in landscape on a phone.
      const orientation = screen.orientation as
        | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
        | undefined;
      await orientation?.lock?.("landscape").catch(() => {});
    } catch {
      /* not supported / denied */
    }
  }
  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      <Maximize className="h-4 w-4" />
      <span className="hidden sm:inline">Tela cheia</span>
    </Button>
  );
}

const ROLE_LABEL: Record<RoomDetail["members"][number]["role"], string> = {
  OWNER: "Anfitrião",
  MODERATOR: "Moderador",
  VIEWER: "Espectador",
};

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 px-3 py-3 text-sm transition-colors",
        active
          ? "border-b-2 border-primary text-foreground"
          : "text-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export type { ParsedMeta };
