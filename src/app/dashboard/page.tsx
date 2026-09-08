import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { requireSession } from "@/lib/auth/guards";
import {
  listOwnedRooms,
  listJoinedRooms,
} from "@/server/services/room-queries";
import { CreateRoomDialog } from "@/features/rooms/create-room-dialog";
import { RoomCard } from "@/features/rooms/room-card";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await requireSession("/dashboard");
  const [owned, joined] = await Promise.all([
    listOwnedRooms(session.user.id),
    listJoinedRooms(session.user.id),
  ]);

  const active = owned.filter((r) => r.status !== "ENDED");
  const history = owned.filter((r) => r.status === "ENDED");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Olá, {session.user.name ?? "de volta"}
            </h1>
            <p className="mt-1 text-muted">
              Crie uma sala e partilhe o seu ecrã em segundos.
            </p>
          </div>
          <CreateRoomDialog />
        </div>

        <Section title="As suas salas" empty="Ainda não criou nenhuma sala.">
          {active.map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </Section>

        {joined.length > 0 && (
          <Section title="Salas onde entrou">
            {joined.map((room) => (
              <RoomCard key={room.slug} room={room} />
            ))}
          </Section>
        )}

        {history.length > 0 && (
          <Section title="Histórico">
            {history.map((room) => (
              <RoomCard key={room.slug} room={room} />
            ))}
          </Section>
        )}

        <p className="mt-10 text-sm text-muted">
          Procura transmissões de outras pessoas?{" "}
          <Link href="/rooms" className="text-primary hover:underline">
            Ver salas abertas
          </Link>
        </p>
      </main>
    </>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean) && items.length > 0;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      {hasItems ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-sm text-muted">
          {empty ?? "Nada por aqui ainda."}
        </p>
      )}
    </section>
  );
}
