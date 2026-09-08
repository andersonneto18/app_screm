import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { generateGuestId } from "@/lib/security/ids";
import { isAdminEmail } from "@/lib/auth/admin";

const GUEST_COOKIE = "sr_guest";
const GUEST_MAX_AGE = 60 * 60 * 24 * 7;

export interface Identity {
  kind: "user" | "guest";
  id: string;
  name?: string | null;
  /** Platform admin — only ever true for `kind: "user"`. */
  isAdmin?: boolean;
}

/** Current authenticated user id, or null. */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Read the guest id from its cookie (does not create one). */
export async function getGuestId(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_COOKIE)?.value ?? null;
}

/** Ensure a guest id exists, minting + persisting one on first use. */
export async function ensureGuestId(): Promise<string> {
  const existing = await getGuestId();
  if (existing) return existing;

  const id = generateGuestId();
  const store = await cookies();
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GUEST_MAX_AGE,
  });
  return id;
}

/** Resolve the caller: prefers an authenticated user, falls back to guest cookie. */
export async function getIdentity(): Promise<Identity | null> {
  const session = await auth();
  if (session?.user?.id) {
    return {
      kind: "user",
      id: session.user.id,
      name: session.user.name,
      isAdmin: isAdminEmail(session.user.email),
    };
  }

  const guestId = await getGuestId();
  if (guestId) return { kind: "guest", id: guestId };

  return null;
}
