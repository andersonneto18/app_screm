"use client";

import { useState } from "react";
import {
  MoreVertical,
  ShieldPlus,
  ShieldMinus,
  UserX,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoomMemberView } from "@/server/services/room-queries";

export function ParticipantMenu({
  slug,
  member,
  actorRole,
  onDone,
}: {
  slug: string;
  member: RoomMemberView;
  actorRole: "OWNER" | "MODERATOR";
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function call(path: string, body?: unknown) {
    setPending(true);
    try {
      await fetch(`/api/rooms/${slug}/participants/${member.id}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      onDone();
    } finally {
      setPending(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={pending}
        className="rounded-md p-1 text-muted hover:bg-surface-3 hover:text-foreground"
        aria-label={`Gerir ${member.displayName}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      <div
        role="menu"
        className={cn(
          "absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg",
          open ? "block" : "hidden",
        )}
      >
        {actorRole === "OWNER" && member.role === "VIEWER" && (
          <Item icon={<ShieldPlus className="h-4 w-4" />} onClick={() => call("/role", { role: "MODERATOR" })}>
            Promover a moderador
          </Item>
        )}
        {actorRole === "OWNER" && member.role === "MODERATOR" && (
          <Item icon={<ShieldMinus className="h-4 w-4" />} onClick={() => call("/role", { role: "VIEWER" })}>
            Despromover
          </Item>
        )}
        <Item icon={<UserX className="h-4 w-4" />} onClick={() => call("/kick")}>
          Remover da sala
        </Item>
        <Item
          icon={<Ban className="h-4 w-4" />}
          danger
          onClick={() => call("/ban")}
        >
          Banir
        </Item>
      </div>
    </div>
  );
}

function Item({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm",
        danger
          ? "text-danger hover:bg-danger/10"
          : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
