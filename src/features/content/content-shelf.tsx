import Link from "next/link";
import { Clapperboard, MonitorPlay, Play, Radio } from "lucide-react";
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
  const soon = rooms.filter((r) => r.status !== "LIVE");

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24">
      {live.length > 0 && (
        <>
          <ShelfHeading icon={Radio} accent>
            A transmitir agora
          </ShelfHeading>
          <Grid>
            {live.map((room) => (
              <Link
                key={room.slug}
                href={`/room/${room.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
              >
                <Cover url={room.coverImage}>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-live/20 px-2 py-0.5 text-xs font-medium text-live backdrop-blur">
                    <span className="live-dot h-1.5 w-1.5 rounded-full bg-live" />
                    Em direto
                  </span>
                  <Play className="absolute right-3 top-3 h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </Cover>
                <div className="p-4">
                  <p className="truncate font-medium text-foreground">
                    {room.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {room.description ?? `${room.participantCount} a assistir`}
                  </p>
                </div>
              </Link>
            ))}
          </Grid>
        </>
      )}

      {soon.length > 0 && (
        <>
          <ShelfHeading icon={MonitorPlay}>Salas abertas</ShelfHeading>
          <Grid>
            {soon.map((room) => (
              <Link
                key={room.slug}
                href={`/room/${room.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-border-strong"
              >
                <Cover url={room.coverImage} />
                <div className="p-4">
                  <p className="truncate font-medium text-foreground">
                    {room.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                    {room.description ?? "À espera do anfitrião"}
                  </p>
                </div>
              </Link>
            ))}
          </Grid>
        </>
      )}

      <ShelfHeading icon={Clapperboard}>Conteúdos a chegar</ShelfHeading>
      <Grid>
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
      </Grid>
    </section>
  );
}

function ShelfHeading({
  icon: Icon,
  accent,
  children,
}: {
  icon: typeof Radio;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 mt-12 flex items-center gap-2 first:mt-0">
      <Icon className={`h-4 w-4 ${accent ? "text-live" : "text-primary"}`} />
      <h2 className="text-lg font-semibold tracking-tight">{children}</h2>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function Cover({
  url,
  children,
}: {
  url: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-video w-full bg-surface-2">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-muted-2">
          <MonitorPlay className="h-8 w-8" />
        </div>
      )}
      {children}
    </div>
  );
}
