import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/admin-emails";

export { isAdminEmail };

/** Is the current session a platform admin? */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  return isAdminEmail(session?.user?.email);
}
