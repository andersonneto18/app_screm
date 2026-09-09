import { rateLimit, peekRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Login abuse protection, layered:
 *  - per-IP throttle   — blocks credential spraying across accounts
 *  - per-email throttle — blocks hammering one account
 *  - per-email lockout  — temporary block after repeated wrong passwords
 */
// Per-IP is only anti-spray (many friends can share one home connection);
// the real per-account brute-force defence is EMAIL_RULE + LOCKOUT_RULE.
const IP_RULE = { limit: 40, windowMs: 60_000 };
const EMAIL_RULE = { limit: 5, windowMs: 60_000 };
const LOCKOUT_RULE = { limit: 10, windowMs: 15 * 60_000 };

export class LoginBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginBlockedError";
  }
}

export async function assertLoginAllowed(
  email: string,
  ip: string,
): Promise<void> {
  const lock = await peekRateLimit(`lock:${email}`, LOCKOUT_RULE);
  if (!lock.success) {
    logger.warn({ email: mask(email) }, "login locked out");
    throw new LoginBlockedError(
      "Conta temporariamente bloqueada por tentativas falhadas. Tente mais tarde.",
    );
  }

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip}`, IP_RULE),
    rateLimit(`login:email:${email}`, EMAIL_RULE),
  ]);
  if (!byIp.success || !byEmail.success) {
    logger.warn({ ip }, "login throttled");
    throw new LoginBlockedError(
      "Demasiadas tentativas de início de sessão. Aguarde um momento.",
    );
  }
}

/** Call after a failed password check. */
export async function recordLoginFailure(email: string): Promise<void> {
  await rateLimit(`lock:${email}`, LOCKOUT_RULE);
}

function mask(email: string): string {
  const [user, domain] = email.split("@");
  return `${user?.slice(0, 2) ?? ""}***@${domain ?? ""}`;
}
