"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  LogOut,
  type LucideIcon,
  Maximize,
  MessageSquare,
  MonitorPlay,
  ScreenShare,
  Settings,
  Users,
  Volume2,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RoomDetail } from "@/server/services/room-queries";
import { useRoomDetail } from "./use-room-detail";
import { InvitePanel } from "./invite-panel";

type Tab = "participants" | "chat";

export function RoomShell({
  slug,
  initialDetail,
  viewerName,
}: {
  slug: string;
  initialDetail: RoomDetail;
  viewerName: string;
}) {
  const router = useRouter();
  const { detail, refresh, stale } = useRoomDetail(slug, initialDetail);
  const [tab, setTab] = useState<Tab>("participants");
  const [busy, setBusy] = useState(false);

  const isOwner = detail.viewerRole === "OWNER";
  const isModerator = detail.viewerRole === "MODERATOR";
  const canManage = isOwner || isModerator;
  const ended = detail.status === "ENDED" || stale;

  async function post(path: string, body?: unknown) {
    setBusy(true);
    try {
      await fetch(`/api/rooms/${slug}${path}`, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      await refresh();
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

  if (ended) {
    return (
      <div className="grid min-h-full flex-1 place-items-center p-6 text-center">
        <div>
          <MonitorPlay className="mx-auto h-10 w-10 text-muted-2" />
          <h1 className="mt-4 text-lg font-medium">A transmissão terminou.</h1>
          <Button asChild variant="outline" className="mt-6">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden text-sm text-muted sm:inline">
            / {detail.name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {detail.status === "LIVE" && (
            <span className="inline-flex items-center gap-1.5 text-live">
              <span className="live-dot h-2 w-2 rounded-full bg-live" />
              Em direto
            </span>
          )}
          <span className="text-muted">{viewerName}</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Stage + controls */}
        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 items-center justify-center bg-surface p-4">
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border">
                <MonitorPlay className="h-7 w-7 text-muted-2" />
              </div>
              <p className="mt-4 text-sm text-foreground">
                {isOwner
                  ? "Ainda não iniciou a partilha"
                  : "O anfitrião ainda não iniciou a partilha."}
              </p>
              <p className="mt-1 text-xs text-muted-2">
                Ligação de vídeo em tempo real — disponível na fase 3.
              </p>
            </div>
          </div>

          {/* Control bar */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
            {isOwner && (
              <Button variant="secondary" size="sm" disabled title="Fase 3">
                <ScreenShare className="h-4 w-4" />
                Partilhar ecrã
              </Button>
            )}
            {detail.allowAudio && isOwner && (
              <Button variant="ghost" size="sm" disabled title="Fase 3">
                Microfone
              </Button>
            )}
            {!isOwner && (
              <>
                <ControlIcon icon={Volume2} label="Volume" />
                <ControlIcon icon={Maximize} label="Tela cheia" />
              </>
            )}

            <div className="ml-auto flex items-center gap-2">
              {canManage && <InvitePanel slug={slug} />}
              <Button
                variant="ghost"
                size="sm"
                onClick={leave}
                disabled={busy}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
              {isOwner && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={endRoom}
                  disabled={busy}
                >
                  Terminar sala
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col border-t border-border lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex border-b border-border">
            <TabButton
              active={tab === "participants"}
              onClick={() => setTab("participants")}
              icon={Users}
              label={`Participantes (${detail.members.length})`}
            />
            <TabButton
              active={tab === "chat"}
              onClick={() => setTab("chat")}
              icon={MessageSquare}
              label="Chat"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {tab === "participants" ? (
              <ul className="space-y-1">
                {detail.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-3 text-xs font-medium">
                        {m.displayName.charAt(0).toUpperCase()}
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
                      <span className="text-xs text-muted-2">Fase 4</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid h-full place-items-center text-center text-sm text-muted">
                <p>
                  {detail.allowChat
                    ? "Chat em tempo real — disponível na fase 5."
                    : "O chat está desativado nesta sala."}
                </p>
              </div>
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
  icon: LucideIcon;
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

function ControlIcon({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted">
      <Icon className="h-4 w-4" />
      {label}
    </span>
  );
}
