import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Server-component guard: returns the session or redirects to /login. */
export async function requireSession(callbackUrl = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}
