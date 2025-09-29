/*
  Warnings:

  - You are about to alter the column `age` on the `Employee` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
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
    "tableNumber" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("address", "age", "firstName", "id", "lastName", "profession", "surName", "tableNumber", "userId") SELECT "address", "age", "firstName", "id", "lastName", "profession", "surName", "tableNumber", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
