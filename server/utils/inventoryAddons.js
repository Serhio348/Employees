const { calcNormReplacementDate, findNormForItem } = require('../bot/replacementItems');

async function syncInventoryAddonDates(prisma, inventoryItem, sizNorms) {
  if (!inventoryItem || inventoryItem.status !== 'выдан') {
    return 0;
  }

  const norm = inventoryItem.sizNormId
    ? sizNorms.find((n) => n.id === inventoryItem.sizNormId) || null
  : findNormForItem(inventoryItem, sizNorms);

  const nextReplacementDate = calcNormReplacementDate(inventoryItem, norm);
  if (!nextReplacementDate) {
    return 0;
  }

  const months = parseInt(norm.period, 10);
  const issueDate = new Date(inventoryItem.issueDate);

  const result = await prisma.inventoryAddon.updateMany({
    where: { inventoryId: inventoryItem.id },
    data: {
      issueDate,
      wearPeriodMonths: months,
      nextReplacementDate,
    },
  });

  return result.count;
}

module.exports = { syncInventoryAddonDates };
