/*
  Warnings:

  - You are about to drop the column `error` on the `WhatsappLog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WhatsappLog_workspaceId_status_createdAt_idx";

-- DropIndex
DROP INDEX "WhatsappLog_workspaceId_toPhoneE164_idx";

-- AlterTable
ALTER TABLE "WhatsappLog" DROP COLUMN "error",
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WhatsappLog_workspaceId_status_idx" ON "WhatsappLog"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WhatsappLog_userId_idx" ON "WhatsappLog"("userId");

-- CreateIndex
CREATE INDEX "WhatsappLog_projectId_idx" ON "WhatsappLog"("projectId");

-- CreateIndex
CREATE INDEX "WhatsappLog_taskId_idx" ON "WhatsappLog"("taskId");
