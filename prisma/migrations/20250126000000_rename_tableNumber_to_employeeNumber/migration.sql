-- RenameTable: rename tableNumber to employeeNumber
ALTER TABLE "Employee" RENAME COLUMN "tableNumber" TO "employeeNumber";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
