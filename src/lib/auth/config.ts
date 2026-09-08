import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { loginSchema } from "@/schemas/auth";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security/password";
import { googleOAuthEnabled } from "@/lib/env";
import {
  assertLoginAllowed,
  recordLoginFailure,
  LoginBlockedError,
} from "@/lib/auth/brute-force";
import { logger } from "@/lib/logger";

/**
 * Auth.js configuration. JWT session strategy (required for Credentials).
 * Cookies are HTTP-only + SameSite=Lax; `Secure` is added automatically in
 * production by Auth.js (`__Secure-`/`__Host-` prefixes).
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "0.0.0.0";

        try {
          await assertLoginAllowed(email, ip);
        } catch (err) {
          if (err instanceof LoginBlockedError) {
            // Return null (generic "invalid credentials") rather than leak the
            // throttle state to a caller who may be attacking.
            return null;
          }
          throw err;
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          await recordLoginFailure(email); // don't reveal whether the account exists
          return null;
        }

        const ok = await verifyPassword(user.passwordHash, password);
        if (!ok) {
          await recordLoginFailure(email);
          logger.warn({ email }, "login: bad password");
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
    ...(googleOAuthEnabled ? [Google] : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
