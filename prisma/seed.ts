/**
 * Optional dev seed. Run with: npm run db:seed
 * Creates a demo user (demo@screenroom.local / Demo1234).
 */
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hash } from "@node-rs/argon2";

for (const f of [".env.local", ".env"]) {
  if (existsSync(f)) {
    process.loadEnvFile(f);
    break;
  }
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const passwordHash = await hash("Demo1234", {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await db.user.upsert({
    where: { email: "demo@screenroom.local" },
    update: {},
    create: {
      email: "demo@screenroom.local",
      name: "Demo",
      passwordHash,
    },
  });

  console.log(`Seeded user: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
