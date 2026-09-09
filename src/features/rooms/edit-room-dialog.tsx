"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { CoverPicker } from "./cover-picker";

export interface EditableRoom {
  slug: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  maxParticipants: number;
  locked: boolean;
}

export function EditRoomDialog({
  room,
  uploadsEnabled,
  variant = "button",
}: {
  room: EditableRoom;
  uploadsEnabled: boolean;
  variant?: "button" | "link";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [cover, setCover] = useState(room.coverImage ?? "");
  const [visibility, setVisibility] = useState(room.visibility);
  const [maxParticipants, setMax] = useState(room.maxParticipants);
  const [locked, setLocked] = useState(room.locked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${room.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          coverImage: cover.trim() || null,
          visibility,
          maxParticipants,
          locked,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(d?.message ?? "Não foi possível guardar");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" /> Editar sala
        </button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      )}

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Editar sala"
        description="Título, capa e definições da sala."
        className="max-w-lg"
      >
        <form onSubmit={save} className="space-y-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">Título</span>
            <Input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">
              Descrição{" "}
              <span className="text-xs font-normal text-muted-2">
                ({description.length}/160)
              </span>
            </span>
            <textarea
              rows={2}
              maxLength={160}
              placeholder="Uma linha sobre o que vais transmitir"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted-2 focus-visible:border-border-strong focus-visible:outline-none"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-foreground">Capa</span>
            <CoverPicker
              slug={room.slug}
              value={cover}
              onChange={setCover}
              uploadsEnabled={uploadsEnabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Visibilidade
              </span>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as "PUBLIC" | "PRIVATE")
                }
                className="h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm"
              >
                <option value="PRIVATE">Privada</option>
                <option value="PUBLIC">Pública</option>
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
                value={maxParticipants}
                onChange={(e) => setMax(Number(e.target.value) || 2)}
              />
            </label>
          </div>

          <Toggle
            label="Bloquear entrada"
            hint="Ninguém novo pode entrar"
            checked={locked}
            onChange={setLocked}
          />

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
              {pending ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
