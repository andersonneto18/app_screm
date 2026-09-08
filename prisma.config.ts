import { existsSync } from "node:fs";
import { defineConfig } from "@prisma/config";

// Prisma 7 no longer auto-loads .env — do it here (CLI/migrations only).
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

/**
 * Prisma 7 config. Connection URLs live here (not in schema.prisma).
 * Runtime queries use the driver adapter wired up in src/lib/db.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
