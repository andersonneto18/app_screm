/**
 * Lightweight fixed-window rate limiter.
 *
 * Backed by an in-process Map (fine for a single instance / dev). For a
 * multi-instance production deploy, set REDIS_URL and swap in a Redis-backed
 * store implementing the same `RateLimitStore` interface — call sites do not
 * change.
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface RateLimitStore {
  hit(
    key: string,
    windowMs: number,
  ): Promise<{ count: number; resetAt: number }>;
  peek(key: string): Promise<{ count: number; resetAt: number }>;
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

  async peek(key: string) {
    const now = Date.now();
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      return { count: 0, resetAt: now };
    }
    return existing;
  }
}

interface RedisLike {
  incr(k: string): Promise<number>;
  pexpire(k: string, ms: number): Promise<unknown>;
  pttl(k: string): Promise<number>;
  get(k: string): Promise<string | null>;
}

/**
 * Redis fixed-window: INCR + first-hit EXPIRE. Shared across instances, so it
 * is the correct choice for a multi-instance / serverless deploy.
 */
class RedisStore implements RateLimitStore {
  constructor(private readonly redis: RedisLike) {}

  async hit(key: string, windowMs: number) {
    const k = `rl:${key}`;
    const count = await this.redis.incr(k);
    if (count === 1) await this.redis.pexpire(k, windowMs);
    const ttl = await this.redis.pttl(k);
    return { count, resetAt: Date.now() + Math.max(ttl, 0) };
  }

  async peek(key: string) {
    const k = `rl:${key}`;
    const raw = await this.redis.get(k);
    const ttl = await this.redis.pttl(k);
    return {
      count: raw ? Number(raw) : 0,
      resetAt: Date.now() + Math.max(ttl, 0),
    };
  }
}

// Survive dev HMR / module re-evaluation — otherwise the window resets per edit.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: RateLimitStore;
};

if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = new MemoryStore();
}
const store = (): RateLimitStore => globalForRateLimit.__rateLimitStore!;

/**
 * Opt into the shared Redis store. Call once at server start (see
 * instrumentation). No-op when REDIS_URL is unset.
 */
export async function initRateLimitStore(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url || globalForRateLimit.__rateLimitStore instanceof RedisStore) return;
  try {
    const { default: Redis } = await import("ioredis");
    globalForRateLimit.__rateLimitStore = new RedisStore(
      new Redis(url) as unknown as RedisLike,
    );
  } catch {
    /* keep the in-memory store */
  }
}

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

const keyFor = (rule: RateLimitRule, id: string) =>
  `${rule.limit}:${rule.windowMs}:${id}`;

export async function rateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const { count, resetAt } = await store().hit(
    keyFor(rule, identifier),
    rule.windowMs,
  );
  return {
    success: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
  };
}

/** Read the current count for a rule/identifier without consuming a slot. */
export async function peekRateLimit(
  identifier: string,
  rule: RateLimitRule,
): Promise<RateLimitResult> {
  const { count, resetAt } = await store().peek(keyFor(rule, identifier));
  return {
    success: count < rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
  };
}
