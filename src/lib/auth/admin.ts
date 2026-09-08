import { auth } from "@/lib/auth";

/** Platform admins, from ADMIN_EMAILS (comma-separated, case-insensitive). */
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/** Is the current session a platform admin? */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}
