import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";
import { isAdminEmail } from "@/lib/auth/admin";
import { listAllRooms } from "@/server/services/room-queries";
import { getPlatformSettings } from "@/server/services/settings-service";
import { blobEnabled } from "@/lib/media/blob";
import { CreateRoomDialog } from "@/features/rooms/create-room-dialog";
import { AdminRoomRow } from "@/features/admin/admin-room-row";
import { AdminSettings } from "@/features/admin/admin-settings";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireSession("/admin");
  if (!isAdminEmail(session.user.email)) notFound();

  const [rooms, settings] = await Promise.all([
    listAllRooms(),
    getPlatformSettings(),
  ]);
  const live = rooms.filter((r) => r.status === "LIVE");
  const waiting = rooms.filter((r) => r.status === "WAITING");
  const ended = rooms.filter((r) => r.status === "ENDED");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Painel de administração
            </h1>
            <p className="mt-1 text-muted">
              Cria salas, gera links de convite e controla qualquer transmissão.
            </p>
          </div>
          <CreateRoomDialog triggerLabel="Criar sala e transmitir" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="Ao vivo" value={live.length} accent />
          <Stat label="À espera" value={waiting.length} />
          <Stat label="Terminadas" value={ended.length} />
        </div>

        <AdminSettings
          initialAllowUserBroadcast={settings.allowUserBroadcast}
        />

        <Group
          title="Ao vivo agora"
          rooms={live}
          uploadsEnabled={blobEnabled}
        />
        <Group
          title="À espera"
          rooms={waiting}
          uploadsEnabled={blobEnabled}
        />
        {ended.length > 0 && (
          <Group
            title="Histórico"
            rooms={ended.slice(0, 20)}
            uploadsEnabled={blobEnabled}
            muted
          />
        )}

        <p className="mt-10 text-sm text-muted">
          Como admin, entras em qualquer sala com o botão{" "}
          <span className="text-foreground">Partilhar ecrã</span> disponível —
          mesmo em salas criadas por outros.{" "}
          <Link href="/rooms" className="text-primary hover:underline">
            Ver salas abertas
          </Link>
        </p>
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <CardDescription>{label}</CardDescription>
      <p
        className={`mt-1 text-2xl font-semibold ${accent ? "text-live" : "text-foreground"}`}
      >
        {value}
      </p>
    </Card>
  );
}

function Group({
  title,
  rooms,
  uploadsEnabled,
  muted,
}: {
  title: string;
  rooms: Awaited<ReturnType<typeof listAllRooms>>;
  uploadsEnabled: boolean;
  muted?: boolean;
}) {
  if (rooms.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>
      <div className={`mt-3 space-y-2 ${muted ? "opacity-70" : ""}`}>
        {rooms.map((room) => (
          <AdminRoomRow
            key={room.slug}
            room={room}
            uploadsEnabled={uploadsEnabled}
          />
        ))}
      </div>
    </section>
  );
}
