-- CreateTable
CREATE TABLE "SizNorm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "classification" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
