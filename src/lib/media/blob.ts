import { put, del } from "@vercel/blob";

/**
 * Room cover storage on Vercel Blob. Enabled automatically once a Blob store
 * is created for the project (BLOB_READ_WRITE_TOKEN is injected by Vercel).
 * Without it, covers can still be set by pasting an image URL.
 */
export const blobEnabled = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function assertUploadable(file: { size: number; type: string }): void {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Imagem tem de ser JPEG, PNG, WebP ou AVIF");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Imagem demasiado grande (máx. 4 MB)");
  }
}

/**
 * Fetch an image from an arbitrary URL so it can be re-hosted on Blob.
 * Rejects non-images (e.g. someone pasting a web-page link) and oversized files.
 */
export async function fetchRemoteImage(
  url: string,
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL inválido");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("URL inválido");
  }

  const res = await fetch(parsed, { redirect: "follow" }).catch(() => null);
  if (!res || !res.ok) {
    throw new Error("Não foi possível abrir esse URL");
  }

  const contentType = (res.headers.get("content-type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED.has(contentType)) {
    throw new Error(
      "Esse link não é uma imagem. Abra a imagem diretamente e copie o endereço dela (.jpg, .png, .webp).",
    );
  }

  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Imagem demasiado grande (máx. 4 MB)");
  }
  return { bytes, contentType };
}

export async function uploadRoomCover(
  bytes: ArrayBuffer,
  contentType: string,
  roomId: string,
): Promise<string> {
  const { url } = await put(
    `covers/${roomId}.${EXT[contentType] ?? "jpg"}`,
    bytes,
    { access: "public", contentType, addRandomSuffix: true },
  );
  return url;
}

export async function deleteRoomCover(url: string | null): Promise<void> {
  if (!blobEnabled || !url || !url.includes(".blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch {
    /* best-effort */
  }
}
