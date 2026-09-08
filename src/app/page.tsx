import Link from "next/link";
import {
  Globe,
  Lock,
  MonitorPlay,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Zap,
    title: "Baixa latência",
    body: "Transmissão em tempo real através de uma arquitetura SFU (LiveKit).",
  },
  {
    icon: Lock,
    title: "Salas privadas",
    body: "Link imprevisível, senha opcional e controlo total de quem entra.",
  },
  {
    icon: ShieldCheck,
    title: "Partilha segura",
    body: "Tokens gerados no servidor, expiração curta, sem media no backend.",
  },
  {
    icon: Globe,
    title: "Sem downloads",
    body: "Funciona diretamente no navegador. Nada para instalar.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <MonitorPlay className="h-3.5 w-3.5" />
              Partilha de ecrã em tempo real
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Partilhe o seu ecrã em segundos.
            </h1>
            <p className="mt-4 text-lg text-muted">
              Crie uma sala privada, partilhe o link e transmita o seu ecrã em
              tempo real.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">Criar sala</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/join">Entrar numa sala</Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-16 aspect-video max-w-4xl rounded-xl border border-border bg-surface">
            <div className="grid h-full place-items-center text-muted-2">
              <div className="flex flex-col items-center gap-3">
                <MonitorPlay className="h-10 w-10" />
                <p className="text-sm">Pré-visualização da sala</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="mt-3">{title}</CardTitle>
                <CardDescription>{body}</CardDescription>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
