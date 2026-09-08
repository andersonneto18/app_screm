-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Room_visibility_status_idx" ON "Room"("visibility", "status");
