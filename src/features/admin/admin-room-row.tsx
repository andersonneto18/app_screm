"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Square,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AdminRoomRow as Row } from "@/server/services/room-queries";
import { EditRoomDialog } from "@/features/rooms/edit-room-dialog";

export function AdminRoomRow({
  room,
  uploadsEnabled,
}: {
  room: Row;
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "invite" | null>(null);
  const [busy, setBusy] = useState(false);

  const roomLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${room.slug}`
      : `/room/${room.slug}`;

  async function copy(value: string, which: "link" | "invite") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  async function genInvite() {
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${room.slug}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expiresInHours: 24, maxUses: null }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string } | null;
      if (data?.url) {
        setInvite(data.url);
        await copy(data.url, "invite");
      }
    } finally {
      setBusy(false);
    }
  }

  async function endRoom() {
    if (!confirm(`Terminar "${room.name}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/rooms/${room.slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRoom() {
    if (!confirm(`Apagar "${room.name}" definitivamente? Não há como recuperar.`))
      return;
    setBusy(true);
    try {
      await fetch(`/api/admin/rooms/${room.slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden h-12 w-20 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:block">
            {room.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={room.coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {room.status === "LIVE" && (
                <span className="live-dot h-2 w-2 shrink-0 rounded-full bg-live" />
              )}
              <span className="truncate font-medium text-foreground">
                {room.name}
              </span>
              {room.hasPassword && (
                <span className="text-xs text-muted-2">🔒</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              {room.description ??
                `${room.ownerName ?? room.ownerEmail} · ${room.visibility === "PUBLIC" ? "pública" : "privada"}`}{" "}
              · <Users className="inline h-3 w-3" /> {room.participantCount}/
              {room.maxParticipants}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {room.status !== "ENDED" && (
            <EditRoomDialog
              room={{
                slug: room.slug,
                name: room.name,
                description: room.description,
                coverImage: room.coverImage,
                visibility: room.visibility,
                maxParticipants: room.maxParticipants,
                locked: room.locked,
              }}
              uploadsEnabled={uploadsEnabled}
            />
          )}
          <Button size="sm" variant="secondary" onClick={() => copy(roomLink, "link")}>
            {copied === "link" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Link
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={genInvite}
            disabled={busy}
          >
            {copied === "invite" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            Convite
          </Button>
          {room.status !== "ENDED" && (
            <>
              <Button asChild size="sm">
                <Link href={`/room/${room.slug}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Entrar
                </Link>
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={endRoom}
                disabled={busy}
              >
                <Square className="h-3.5 w-3.5" />
                Terminar
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={deleteRoom}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50"
            aria-label={`Apagar ${room.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Apagar
          </button>
        </div>
      </div>

      {invite && (
        <p
          className={cn(
            "mt-2 truncate rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted",
          )}
        >
          {invite}
        </p>
      )}
    </div>
  );
}
