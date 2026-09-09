import Link from "next/link";
import { Lock, MonitorPlay, Users } from "lucide-react";
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
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors",
        ended ? "pointer-events-none opacity-60" : "hover:border-border-strong",
      )}
    >
      <div className="relative aspect-video w-full bg-surface-2">
        {room.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-2">
            <MonitorPlay className="h-8 w-8" />
          </div>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
            room.status === "LIVE"
              ? "bg-live/15 text-live"
              : "bg-black/50 text-white",
          )}
        >
          {room.status === "LIVE" && (
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
          )}
          {STATUS_LABEL[room.status]}
        </span>
        {room.hasPassword && (
          <Lock className="absolute right-2 top-2 h-3.5 w-3.5 text-white/80" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-medium text-foreground">{room.name}</h3>
        {room.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted">
            {room.description}
          </p>
        )}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-muted">
          <Users className="h-3.5 w-3.5" />
          {room.participantCount}/{room.maxParticipants}
          {room.locked && <span className="ml-2 text-muted-2">· bloqueada</span>}
        </div>
      </div>
    </Link>
  );
}
