"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";

interface State {
  name: string;
  visibility: "PUBLIC" | "PRIVATE";
  password: string;
  allowGuests: boolean;
  allowChat: boolean;
  allowAudio: boolean;
  maxParticipants: number;
}

const initial: State = {
  name: "",
  visibility: "PRIVATE",
  password: "",
  allowGuests: true,
  allowChat: true,
  allowAudio: true,
  maxParticipants: 10,
};

export function CreateRoomDialog({
  triggerLabel = "Criar sala",
  triggerClassName,
}: {
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof State>(key: K, value: State[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...state,
          password: state.password || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { slug?: string; message?: string }
        | null;
      if (!res.ok || !data?.slug) {
        throw new Error(data?.message ?? "Não foi possível criar a sala");
      }
      router.push(`/room/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
      setPending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className={triggerClassName}>
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Criar sala"
        description="Configure a sala. Pode alterar tudo isto mais tarde."
      >
        <form onSubmit={submit} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Nome da sala
            </span>
            <Input
              autoFocus
              required
              maxLength={80}
              placeholder="Sessão de programação"
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Visibilidade
              </span>
              <select
                value={state.visibility}
                onChange={(e) =>
                  set("visibility", e.target.value as State["visibility"])
                }
                className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm"
              >
                <option value="PRIVATE">Privada</option>
                <option value="PUBLIC">Pública (aparece em Salas abertas)</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Máx. participantes
              </span>
              <Input
                type="number"
                min={2}
                max={50}
                value={state.maxParticipants}
                onChange={(e) =>
                  set("maxParticipants", Number(e.target.value) || 2)
                }
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Senha (opcional)
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Sem senha"
              value={state.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </label>

          <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-3">
            <Toggle
              label="Permitir convidados"
              hint="Entram sem conta, apenas com um nome"
              checked={state.allowGuests}
              onChange={(v) => set("allowGuests", v)}
            />
            <Toggle
              label="Permitir chat"
              checked={state.allowChat}
              onChange={(v) => set("allowChat", v)}
            />
            <Toggle
              label="Permitir áudio"
              checked={state.allowAudio}
              onChange={(v) => set("allowAudio", v)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "A criar…" : "Criar e abrir"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
