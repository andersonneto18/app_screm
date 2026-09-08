import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

/**
 * Structured logger. Never pass secrets (passwords, JWTs, cookies, LiveKit or
 * invite tokens) — the redact list below is a safety net, not a license.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "tokenHash",
      "accessToken",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.authorization",
    ],
    censor: "[redacted]",
  },
  transport: isProd
    ? undefined
    : { target: "pino-pretty", options: { colorize: true } },
});
