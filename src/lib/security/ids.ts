import { randomBytes, createHash } from "node:crypto";
import { customAlphabet } from "nanoid";

/** URL-safe, unambiguous alphabet (no 0/O/1/l/I). */
const SLUG_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Room slug: ~71 bits of entropy at length 12. Not guessable, not sequential. */
export const generateRoomSlug = customAlphabet(SLUG_ALPHABET, 12);

/** Opaque guest identity stored only in a signed cookie. */
export function generateGuestId(): string {
  return `guest_${randomBytes(16).toString("hex")}`;
}

/** Raw invite token handed to the user; only its hash is persisted. */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** One-way hash for IP-based moderation (never store raw IPs). */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${ip}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}
