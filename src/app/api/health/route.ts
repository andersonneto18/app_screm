import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    server: "ok",
    database: "ok",
    livekit: "ok",
  };

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
  }

  if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY) {
    checks.livekit = "error";
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks },
    { status: healthy ? 200 : 503 },
  );
}
