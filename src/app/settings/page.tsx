import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Definições",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await requireSession("/settings");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Definições</h1>

        <Card className="mt-6">
          <CardTitle>Perfil</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Nome</dt>
              <dd className="text-foreground">{session.user.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd className="text-foreground">{session.user.email}</dd>
            </div>
          </dl>
        </Card>

        <Card className="mt-4">
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Alterar palavra-passe, sessões ativas e eliminar conta — em breve.
          </CardDescription>
        </Card>

        <Card className="mt-4">
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Avisos quando o anfitrião começa a transmitir — em breve.
          </CardDescription>
        </Card>
      </main>
    </>
  );
}
