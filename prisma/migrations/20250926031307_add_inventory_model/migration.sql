/*
  Warnings:

  - You are about to drop the column `tableNumber` on the `Employee` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "issuedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'выдан',
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "Inventory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "surName" TEXT,
    "age" INTEGER NOT NULL,
    "profession" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "employeeNumber" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("address", "age", "firstName", "id", "lastName", "profession", "surName", "userId") SELECT "address", "age", "firstName", "id", "lastName", "profession", "surName", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
