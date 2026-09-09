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
