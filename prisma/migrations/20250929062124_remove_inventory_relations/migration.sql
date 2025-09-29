/*
  Warnings:

  - Added the required column `updatedAt` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `InventoryAddon` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'выдан',
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Inventory" ("description", "employeeId", "id", "itemName", "itemType", "quantity", "status") SELECT "description", "employeeId", "id", "itemName", "itemType", "quantity", "status" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
CREATE TABLE "new_InventoryAddon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wearPeriodMonths" INTEGER NOT NULL,
    "nextReplacementDate" DATETIME NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InventoryAddon" ("id", "inventoryId", "issueDate", "name", "nextReplacementDate", "wearPeriodMonths") SELECT "id", "inventoryId", "issueDate", "name", "nextReplacementDate", "wearPeriodMonths" FROM "InventoryAddon";
DROP TABLE "InventoryAddon";
ALTER TABLE "new_InventoryAddon" RENAME TO "InventoryAddon";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
