/*
  Warnings:

  - You are about to drop the column `issuedDate` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `Inventory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryAddon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wearPeriodMonths" INTEGER NOT NULL,
    "nextReplacementDate" DATETIME NOT NULL,
    "inventoryId" TEXT NOT NULL,
    CONSTRAINT "InventoryAddon_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryAddon" ("id", "inventoryId", "issueDate", "name", "nextReplacementDate", "wearPeriodMonths") SELECT "id", "inventoryId", "issueDate", "name", "nextReplacementDate", "wearPeriodMonths" FROM "InventoryAddon";
DROP TABLE "InventoryAddon";
ALTER TABLE "new_InventoryAddon" RENAME TO "InventoryAddon";
CREATE TABLE "new_Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'выдан',
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "Inventory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Inventory" ("description", "employeeId", "id", "itemName", "itemType", "quantity", "status") SELECT "description", "employeeId", "id", "itemName", "itemType", "quantity", "status" FROM "Inventory";
DROP TABLE "Inventory";
ALTER TABLE "new_Inventory" RENAME TO "Inventory";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
