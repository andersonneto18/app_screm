"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function JoinGate({
  slug,
  roomName,
  hasPassword,
  allowGuests,
  isAuthenticated,
  suggestedName,
  inviteToken,
}: {
  slug: string;
  roomName: string;
  hasPassword: boolean;
  allowGuests: boolean;
  isAuthenticated: boolean;
  suggestedName: string;
  inviteToken?: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(suggestedName);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGuest = allowGuests || Boolean(inviteToken);
  const blocked = !isAuthenticated && !canGuest;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${slug}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          password: password || undefined,
          inviteToken,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? "Não foi possível entrar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-sm flex-1 flex-col justify-center py-12">
      <Card>
        <CardTitle>{roomName}</CardTitle>
        <CardDescription>
          {blocked
            ? "Esta sala não permite convidados."
            : "Está prestes a entrar nesta sala."}
        </CardDescription>

        {blocked ? (
          <div className="mt-6 space-y-3">
            <Button asChild className="w-full">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/room/${slug}`)}`}
              >
                Entrar com uma conta
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {!isAuthenticated && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">
                  Como quer ser chamado?
                </span>
                <Input
                  autoFocus
                  required
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="O seu nome"
                />
              </label>
            )}

            {hasPassword && (
              <label className="block space-y-1.5">
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Lock className="h-3.5 w-3.5" /> Senha da sala
                </span>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "A entrar…" : "Entrar na sala"}
            </Button>

            {!isAuthenticated && (
              <p className="text-center text-xs text-muted">
                Ou{" "}
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/room/${slug}`)}`}
                  className="text-primary hover:underline"
                >
                  entre com uma conta
                </Link>
              </p>
            )}
          </form>
        )}
      </Card>
    </div>
  );
}
