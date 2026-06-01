ALTER TABLE "Inventory" ADD COLUMN "sizNormId" TEXT;

CREATE TABLE "TelegramSizRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "telegramChatId" TEXT NOT NULL,
    "sizNormId" TEXT NOT NULL,
    "sizNormName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminChatId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSizRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TelegramSizRequest_employeeId_status_idx" ON "TelegramSizRequest"("employeeId", "status");
CREATE INDEX "TelegramSizRequest_status_createdAt_idx" ON "TelegramSizRequest"("status", "createdAt");
