import { z } from "zod";

/**
 * Central, validated environment access. Import `env` instead of reading
 * `process.env` directly so a missing/invalid var fails fast at boot.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional().or(z.literal("")),
  AUTH_SECRET: z.string().min(1),
  LIVEKIT_URL: z.string().min(1),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(16),
  AUTH_GOOGLE_ID: z.string().optional().or(z.literal("")),
  AUTH_GOOGLE_SECRET: z.string().optional().or(z.literal("")),
  REDIS_URL: z.string().optional().or(z.literal("")),
  // Comma-separated list of platform-admin emails.
  ADMIN_EMAILS: z.string().optional().or(z.literal("")),
  // Vercel Blob — room cover uploads. Injected automatically once a Blob
  // store is created for the project. Optional (covers also accept URLs).
  BLOB_READ_WRITE_TOKEN: z.string().optional().or(z.literal("")),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_LIVEKIT_URL: z.string().min(1),
});

const isServer = typeof window === "undefined";

const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
});

const serverEnv = isServer
  ? serverSchema.parse(process.env)
  : (null as unknown as z.infer<typeof serverSchema>);

export const env = { ...clientEnv, ...(serverEnv ?? {}) } as z.infer<
  typeof clientSchema
> &
  z.infer<typeof serverSchema>;

export const isProd = process.env.NODE_ENV === "production";
export const googleOAuthEnabled = Boolean(
  serverEnv?.AUTH_GOOGLE_ID && serverEnv?.AUTH_GOOGLE_SECRET,
);
