"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function InvitePanel({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomLink =
    typeof window !== "undefined" ? `${window.location.origin}/room/${slug}` : "";

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${slug}/invites`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expiresInHours: 24, maxUses: null }),
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; message?: string }
        | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.message ?? "Não foi possível gerar o convite");
      }
      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setPending(false);
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar");
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Link2 className="h-4 w-4" />
        Mostrar convite
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Convidar para a sala"
        description="Partilhe o link da sala ou gere um convite com expiração."
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground">Link da sala</p>
            <div className="mt-1.5 flex gap-2">
              <code className="flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                {roomLink}
              </code>
              <Button size="sm" variant="secondary" onClick={() => copy(roomLink)}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">
              Convite com expiração (24h)
            </p>
            {url ? (
              <div className="mt-1.5 flex gap-2">
                <code className="flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
                  {url}
                </code>
                <Button size="sm" variant="secondary" onClick={() => copy(url)}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="mt-1.5"
                onClick={generate}
                disabled={pending}
              >
                {pending ? "A gerar…" : "Gerar convite"}
              </Button>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
