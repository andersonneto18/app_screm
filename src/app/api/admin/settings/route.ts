import { z } from "zod";
import { handleRoute, parseBody, json, Errors } from "@/lib/api/http";
import { isCurrentUserAdmin } from "@/lib/auth/admin";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/server/services/settings-service";

const bodySchema = z.object({
  allowUserBroadcast: z.boolean().optional(),
});

export const GET = handleRoute(async () => {
  if (!(await isCurrentUserAdmin())) throw Errors.notFound();
  return json(await getPlatformSettings());
});

export const PATCH = handleRoute(async (req) => {
  if (!(await isCurrentUserAdmin())) throw Errors.notFound();
  const patch = await parseBody(req, bodySchema);
  return json(await updatePlatformSettings(patch));
});
