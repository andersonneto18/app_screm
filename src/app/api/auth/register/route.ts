import { handleRoute, parseBody, json, Errors, clientIp } from "@/lib/api/http";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { registerSchema } from "@/schemas/auth";
import { registerUser } from "@/server/services/user-service";
import { recordAudit } from "@/server/services/audit-service";

export const POST = handleRoute(async (req) => {
  const ip = clientIp(req);
  const limit = await rateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!limit.success) throw Errors.tooMany();

  const input = await parseBody(req, registerSchema);
  const user = await registerUser(input);

  await recordAudit({ actorId: user.id, event: "user.registered" });
  return json({ id: user.id, email: user.email }, { status: 201 });
});
