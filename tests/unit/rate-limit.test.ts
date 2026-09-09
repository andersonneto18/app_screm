import { describe, it, expect } from "vitest";
import { rateLimit, peekRateLimit } from "@/lib/rate-limit";

const rule = { limit: 3, windowMs: 60_000 };
const key = () => `test-${Math.random().toString(36).slice(2)}`;

describe("rate limiter (in-memory window)", () => {
  it("allows up to the limit, then blocks", async () => {
    const k = key();
    expect((await rateLimit(k, rule)).success).toBe(true); // 1
    expect((await rateLimit(k, rule)).success).toBe(true); // 2
    const third = await rateLimit(k, rule); // 3
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
    expect((await rateLimit(k, rule)).success).toBe(false); // 4 — blocked
  });

  it("counts each identifier independently", async () => {
    const a = key();
    const b = key();
    await rateLimit(a, rule);
    await rateLimit(a, rule);
    await rateLimit(a, rule);
    expect((await rateLimit(a, rule)).success).toBe(false);
    expect((await rateLimit(b, rule)).success).toBe(true);
  });

  it("peek does not consume a slot", async () => {
    const k = key();
    await rateLimit(k, rule); // 1 consumed
    const p1 = await peekRateLimit(k, rule);
    const p2 = await peekRateLimit(k, rule);
    expect(p1.remaining).toBe(2);
    expect(p2.remaining).toBe(2); // unchanged
    expect((await rateLimit(k, rule)).remaining).toBe(1); // now 2 consumed
  });
});
