import { handleRoute, json, Errors } from "@/lib/api/http";
import { loadRoomContext } from "@/lib/api/room-context";
import {
  blobEnabled,
  assertUploadable,
  uploadRoomCover,
  deleteRoomCover,
} from "@/lib/media/blob";
import { updateRoom } from "@/server/services/room-service";

type Ctx = RouteContext<"/api/rooms/[slug]/cover">;

export const POST = handleRoute<Ctx>(async (req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "UPDATE_ROOM_SETTINGS");

  if (!blobEnabled) {
    throw Errors.badRequest(
      "Upload de imagens não está configurado. Cole um URL de imagem em alternativa.",
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("Ficheiro em falta");

  try {
    assertUploadable(file);
  } catch (err) {
    throw Errors.badRequest(
      err instanceof Error ? err.message : "Imagem inválida",
    );
  }

  const previous = room.coverImage;
  const url = await uploadRoomCover(await file.arrayBuffer(), file.type, room.id);
  await updateRoom(room.id, member.userId ?? member.id, { coverImage: url });
  await deleteRoomCover(previous);

  return json({ coverImage: url });
});

export const DELETE = handleRoute<Ctx>(async (_req, ctx) => {
  const { slug } = await ctx.params;
  const { room, member } = await loadRoomContext(slug, "UPDATE_ROOM_SETTINGS");
  await deleteRoomCover(room.coverImage);
  await updateRoom(room.id, member.userId ?? member.id, { coverImage: null });
  return json({ ok: true });
});
