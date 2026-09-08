import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

interface AuditInput {
  roomId?: string | null;
  actorId?: string | null;
  event: string;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget audit trail. Never throws into the caller's flow. */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        roomId: input.roomId ?? null,
        actorId: input.actorId ?? null,
        event: input.event,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logger.warn({ err, event: input.event }, "Failed to write audit log");
  }
}
