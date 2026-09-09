"use client";

import { useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Fit the image whole onto a 16:9 white canvas (max 1280px wide) before upload.
 * White background matters: logos are usually transparent PNGs and JPEG has no
 * alpha, so without it transparent areas would turn black.
 */
async function normalize(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetW = Math.min(1280, Math.max(bitmap.width, 640));
  const targetH = Math.round((targetW * 9) / 16);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetW, targetH);

  // Contain: scale so the whole image fits, then centre it.
  const scale = Math.min(targetW / bitmap.width, targetH / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  ctx.drawImage(
    bitmap,
    (targetW - drawW) / 2,
    (targetH - drawH) / 2,
    drawW,
    drawH,
  );

  const blob = await new Promise<Blob | null>((res) =>
    canvas.toBlob(res, "image/jpeg", 0.9),
  );
  return blob ? new File([blob], "cover.jpg", { type: "image/jpeg" }) : file;
}

const isHostedCover = (url: string) =>
  url.includes(".blob.vercel-storage.com") || url.startsWith("data:");

/**
 * Room cover editor. Three ways in: upload a file, paste an image URL and
 * import it into the room's own storage, or just keep the pasted URL as-is.
 * Value is always a URL string (or "").
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

  async function send(payload: FormData | { url: string }) {
    if (!slug) {
      setError("Guarde a sala primeiro para poder carregar uma imagem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${slug}/cover`, {
        method: "POST",
        ...(payload instanceof FormData
          ? { body: payload }
          : {
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            }),
      });
      const data = (await res.json().catch(() => null)) as
        | { coverImage?: string; message?: string }
        | null;
      if (!res.ok || !data?.coverImage) {
        throw new Error(data?.message ?? "Falha ao guardar a imagem");
      }
      onChange(data.coverImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao guardar a imagem");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    const resized = await normalize(file).catch(() => file);
    const fd = new FormData();
    fd.append("file", resized, "cover.jpg");
    await send(fd);
  }

  const canImport =
    uploadsEnabled &&
    Boolean(slug) &&
    /^https?:\/\//i.test(value) &&
    !isHostedCover(value);

  return (
    <div className="space-y-2">
      <div
        className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-white"
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
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs text-muted-2">
            <ImagePlus className="h-6 w-6" />
            {uploadsEnabled
              ? "Arraste uma imagem ou use os campos abaixo"
              : "Cole o URL de uma imagem abaixo"}
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
              className="rounded-lg border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-surface-2 disabled:opacity-50"
            >
              Carregar imagem
            </button>
          </>
        )}
        {canImport && (
          <button
            type="button"
            onClick={() => void send({ url: value })}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-3 py-1.5 text-xs text-foreground hover:bg-surface-2 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Importar este URL
          </button>
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
        placeholder="…ou cole o URL de uma imagem (.jpg, .png, .webp)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {canImport && (
        <p className="text-xs text-muted-2">
          Carregue em “Importar este URL” para guardar a imagem na sala — fica
          sempre disponível, mesmo que o link original saia do ar.
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
