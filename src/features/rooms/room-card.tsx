import Link from "next/link";
import { Lock, Users } from "lucide-react";
import type { RoomSummary } from "@/server/services/room-queries";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<RoomSummary["status"], string> = {
  WAITING: "À espera",
  LIVE: "Em direto",
  ENDED: "Terminada",
};

export function RoomCard({ room }: { room: RoomSummary }) {
  const ended = room.status === "ENDED";
  return (
    <Link
      href={ended ? "#" : `/room/${room.slug}`}
      aria-disabled={ended}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors",
        ended
          ? "pointer-events-none opacity-60"
          : "hover:border-border-strong",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium",
            room.status === "LIVE" ? "text-live" : "text-muted",
          )}
        >
          {room.status === "LIVE" && (
            <span className="live-dot h-2 w-2 rounded-full bg-live" />
          )}
          {STATUS_LABEL[room.status]}
        </span>
        {room.hasPassword && <Lock className="h-3.5 w-3.5 text-muted-2" />}
      </div>

      <h3 className="mt-2 truncate font-medium text-foreground">{room.name}</h3>

      <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted">
        <Users className="h-3.5 w-3.5" />
        {room.participantCount}/{room.maxParticipants}
        {room.locked && <span className="ml-2 text-muted-2">· bloqueada</span>}
      </div>
    </Link>
  );
}
