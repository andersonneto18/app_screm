import Link from "next/link";
import { Clapperboard, Play, Radio } from "lucide-react";
import { listPublicRooms } from "@/server/services/room-queries";

// Placeholder catalogue — real "shows" the host will broadcast. Swap for a
// CMS-backed list later; for now these are the planned formats.
const UPCOMING = [
  { title: "Sessão de código ao vivo", tag: "Programação" },
  { title: "Watch party", tag: "Comunidade" },
  { title: "Apresentação de projeto", tag: "Demo" },
  { title: "Perguntas & Respostas", tag: "Ao vivo" },
  { title: "Bastidores", tag: "Making-of" },
  { title: "Tutorial passo-a-passo", tag: "Aprender" },
];

export async function ContentShelf() {
  const rooms = await listPublicRooms(12);
  const live = rooms.filter((r) => r.status === "LIVE");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      {live.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-live" />
            <h2 className="text-lg font-semibold tracking-tight">
              A transmitir agora
            </h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {live.map((room) => (
              <Link
                key={room.slug}
                href={`/room/${room.slug}`}
                className="group relative flex aspect-video flex-col justify-end overflow-hidden rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-border-strong"
              >
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-live/15 px-2 py-0.5 text-xs font-medium text-live">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
                  Em direto
                </span>
                <Play className="absolute right-3 top-3 h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="font-medium text-foreground">{room.name}</p>
                <p className="text-xs text-muted">
                  {room.participantCount} a assistir
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-12 flex items-center gap-2">
        <Clapperboard className="h-4 w-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Conteúdos a chegar
        </h2>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UPCOMING.map((item) => (
          <div
            key={item.title}
            className="flex aspect-video flex-col justify-end overflow-hidden rounded-xl border border-dashed border-border bg-surface p-4"
          >
            <span className="w-fit rounded-full bg-surface-3 px-2 py-0.5 text-[11px] text-muted">
              {item.tag}
            </span>
            <p className="mt-2 font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-2">Em breve</p>
          </div>
        ))}
      </div>
    </section>
  );
}
