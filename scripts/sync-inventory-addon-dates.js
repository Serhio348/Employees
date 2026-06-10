/**
 * Пересчитывает nextReplacementDate у InventoryAddon по актуальным issueDate и нормативам.
 * Запуск: node scripts/sync-inventory-addon-dates.js
 */
require('dotenv').config();

const { prisma } = require('../prisma/prisma-client');
const { syncInventoryAddonDates } = require('../server/utils/inventoryAddons');

async function main() {
  const [inventory, sizNorms] = await Promise.all([
    prisma.inventory.findMany({ where: { status: 'выдан' } }),
    prisma.sizNorm.findMany(),
  ]);

  let updatedAddons = 0;
  let processed = 0;

  for (const item of inventory) {
    const count = await syncInventoryAddonDates(prisma, item, sizNorms);
    if (count > 0) {
      updatedAddons += count;
      processed += 1;
      console.log(`[sync] ${item.itemName}: обновлено дополнений — ${count}`);
    }
  }

  console.log(`[sync] Готово. Позиций с обновлением: ${processed}, дополнений: ${updatedAddons}`);
}

main()
  .catch((err) => {
    console.error('[sync] Ошибка:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
