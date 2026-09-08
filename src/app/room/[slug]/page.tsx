import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getIdentity } from "@/lib/auth/session";
import { getRoomDetail } from "@/server/services/room-queries";
import { JoinGate } from "@/features/rooms/join-gate";
import { RoomShell } from "@/features/rooms/room-shell";

export const metadata: Metadata = {
  title: "Sala",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RoomPage(props: PageProps<"/room/[slug]">) {
  const { slug } = await props.params;
  const search = await props.searchParams;
  const inviteToken =
    typeof search.invite === "string" ? search.invite : undefined;

  const identity = await getIdentity();
  const detail = await getRoomDetail(slug, identity);
  if (!detail) notFound();

  if (detail.status === "ENDED") {
    return (
      <div className="grid min-h-full flex-1 place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-medium">A transmissão terminou.</h1>
          <a
            href="/"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  const session = await auth();
  const viewerName =
    session?.user?.name ?? session?.user?.email ?? "Convidado";

  if (!detail.viewerRole) {
    return (
      <JoinGate
        slug={slug}
        roomName={detail.name}
        hasPassword={detail.hasPassword}
        allowGuests={detail.allowGuests}
        isAuthenticated={Boolean(session?.user)}
        suggestedName={session?.user?.name ?? ""}
        inviteToken={inviteToken}
      />
    );
  }

  return (
    <RoomShell slug={slug} initialDetail={detail} viewerName={viewerName} />
  );
}
