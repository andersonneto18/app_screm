"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Crop to 16:9 and cap at 1280px wide before upload — keeps covers light. */
async function downscale(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetW = Math.min(1280, bitmap.width);
  const targetH = Math.round((targetW * 9) / 16);
  const scale = Math.max(targetW / bitmap.width, targetH / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(
    bitmap,
    (targetW - drawW) / 2,
    (targetH - drawH) / 2,
    drawW,
    drawH,
  );

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", 0.85),
  );
  return blob ? new File([blob], "cover.jpg", { type: "image/jpeg" }) : file;
}

/**
 * Room cover editor. Two ways in: upload a file (Cloudinary, when configured)
 * or paste an image URL. Value is always a URL string (or "").
 */
export function CoverPicker({
  slug,
  value,
  onChange,
  uploadsEnabled,
}: {
  /** When set, uploads go straight to the room; otherwise only URL entry. */
  slug?: string;
  value: string;
  onChange: (url: string) => void;
  uploadsEnabled: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    if (!slug) {
      setError("Guarde a sala primeiro para poder carregar uma imagem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const resized = await downscale(file).catch(() => file);
      const fd = new FormData();
      fd.append("file", resized, "cover.jpg");
      const res = await fetch(`/api/rooms/${slug}/cover`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => null)) as
        | { coverImage?: string; message?: string }
        | null;
      if (!res.ok || !data?.coverImage) {
        throw new Error(data?.message ?? "Falha no upload");
      }
      onChange(data.coverImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-2"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Capa da sala"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-2">
            <ImagePlus className="h-6 w-6" />
            {uploadsEnabled ? "Arraste uma imagem ou use os campos abaixo" : "Cole um URL abaixo"}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {uploadsEnabled && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-surface-2"
            >
              Carregar imagem
            </button>
          </>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remover
          </button>
        )}
      </div>

      <Input
        placeholder="…ou cole o URL de uma imagem"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
