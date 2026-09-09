import { describe, it, expect } from "vitest";
import {
  generateRoomSlug,
  generateGuestId,
  generateInviteToken,
  hashInviteToken,
  hashIp,
} from "@/lib/security/ids";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { isAdminEmail } from "@/lib/auth/admin-emails";

describe("id / token helpers", () => {
  it("room slug: 12 URL-safe chars, no ambiguous letters, unique-ish", () => {
    const a = generateRoomSlug();
    expect(a).toMatch(/^[0-9A-Za-z]{12}$/);
    expect(a).not.toMatch(/[0O1lI]/);
    const many = new Set(Array.from({ length: 500 }, () => generateRoomSlug()));
    expect(many.size).toBe(500);
  });

  it("guest id is prefixed and random", () => {
    expect(generateGuestId()).toMatch(/^guest_[0-9a-f]{32}$/);
    expect(generateGuestId()).not.toBe(generateGuestId());
  });

  it("invite token hashing is deterministic and one-way", () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).not.toBe(token);
  });

  it("ip hashing is deterministic and not reversible", () => {
    expect(hashIp("1.2.3.4")).toBe(hashIp("1.2.3.4"));
    expect(hashIp("1.2.3.4")).not.toBe(hashIp("1.2.3.5"));
    expect(hashIp("1.2.3.4")).not.toContain("1.2.3.4");
  });
});

describe("password hashing (Argon2id)", () => {
  it("hash differs from plaintext and verifies", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash).not.toBe("correct horse battery");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery")).toBe(true);
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("verify returns false on a malformed digest instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });
});

describe("admin emails", () => {
  it("matches case-insensitively against ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "boss@x.com, Admin@Y.com";
    expect(isAdminEmail("BOSS@X.COM")).toBe(true);
    expect(isAdminEmail("admin@y.com")).toBe(true);
    expect(isAdminEmail("someone@z.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("nobody is admin when the list is empty", () => {
    process.env.ADMIN_EMAILS = "";
    expect(isAdminEmail("boss@x.com")).toBe(false);
  });
});
