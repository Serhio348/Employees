-- Keep the first employee for each Telegram chat and clear duplicate links before adding the unique index.
WITH ranked_links AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY "telegramChatId" ORDER BY id) AS row_number
    FROM "Employee"
    WHERE "telegramChatId" IS NOT NULL
)
UPDATE "Employee"
SET "telegramChatId" = NULL
WHERE id IN (
    SELECT id
    FROM ranked_links
    WHERE row_number > 1
);

CREATE UNIQUE INDEX "Employee_telegramChatId_key" ON "Employee"("telegramChatId");
