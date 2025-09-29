-- CreateTable
CREATE TABLE "InventoryAddon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wearPeriodMonths" INTEGER NOT NULL,
    "nextReplacementDate" DATETIME NOT NULL,
    "inventoryId" TEXT NOT NULL,
    CONSTRAINT "InventoryAddon_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
