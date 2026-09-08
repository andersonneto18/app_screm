/**
 * Lightweight fixed-window rate limiter.
 *
 * Backed by an in-process Map (fine for a single instance / dev). Swap the
 * store for Redis in production by implementing the same `RateLimitStore`
 * interface — call sites do not change.
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  async hit(key: string, windowMs: number) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }
}

const store: RateLimitStore = new MemoryStore();

export interface RateLimitRule {
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** Named rules referenced by API routes (values from documentatio.md). */
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 60_000 },
  register: { limit: 5, windowMs: 60_000 },
  createRoom: { limit: 10, windowMs: 60 * 60_000 },
  joinRoom: { limit: 30, windowMs: 60_000 },
  roomPassword: { limit: 5, windowMs: 60_000 },
  createInvite: { limit: 20, windowMs: 60 * 60_000 },
  chat: { limit: 20, windowMs: 10_000 },
  livekitToken: { limit: 30, windowMs: 60_000 },
} satisfies Record<string, RateLimitRule>;

export async function rateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const { count, resetAt } = await store.hit(
    `${rule.limit}:${rule.windowMs}:${identifier}`,
    rule.windowMs,
  );
  return {
    success: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
  };
}
