import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await requireSession("/dashboard");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {session.user.name ?? "de volta"}
        </h1>
        <p className="mt-1 text-muted">
          Crie uma sala e partilhe o seu ecrã em segundos.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardTitle>Criar sala</CardTitle>
            <CardDescription>
              Disponível na próxima fase (gestão de salas).
            </CardDescription>
          </Card>
          <Card>
            <CardTitle>Salas ativas</CardTitle>
            <CardDescription>Ainda sem salas.</CardDescription>
          </Card>
          <Card>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Ainda sem histórico.</CardDescription>
          </Card>
        </div>
      </main>
    </>
  );
}
