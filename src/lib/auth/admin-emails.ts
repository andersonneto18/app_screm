/** Platform admins, from ADMIN_EMAILS (comma-separated, case-insensitive). */
function parse(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && parse().has(email.toLowerCase());
}
