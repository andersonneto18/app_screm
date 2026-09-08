import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { listPublicRooms } from "@/server/services/room-queries";
import { RoomCard } from "@/features/rooms/room-card";

export const metadata: Metadata = {
  title: "Salas abertas",
  description: "Transmissões de ecrã públicas a decorrer agora.",
};

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const rooms = await listPublicRooms();
  const live = rooms.filter((r) => r.status === "LIVE");
  const waiting = rooms.filter((r) => r.status !== "LIVE");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Salas abertas</h1>
        <p className="mt-1 text-muted">
          Salas públicas que aceitam novos espectadores.
        </p>

        {rooms.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
            Nenhuma sala pública neste momento.
          </p>
        ) : (
          <>
            {live.length > 0 && (
              <Group title="Em direto agora" rooms={live} />
            )}
            {waiting.length > 0 && (
              <Group title="A começar em breve" rooms={waiting} />
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Group({
  title,
  rooms,
}: {
  title: string;
  rooms: Awaited<ReturnType<typeof listPublicRooms>>;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
      </div>
    </section>
  );
}
