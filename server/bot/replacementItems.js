const { prisma } = require('../../prisma/prisma-client');
const { getDaysLeft } = require('./utils');

function matchNorm(itemName, sizNorms) {
  const name = itemName.toLowerCase();
  return sizNorms.find((n) => {
    const norm = n.name.toLowerCase();
    return name.includes(norm) || norm.includes(name);
  }) || null;
}

function findNormForItem(item, sizNorms) {
  return item.sizNormId
    ? sizNorms.find((n) => n.id === item.sizNormId) || null
    : matchNorm(item.itemName, sizNorms);
}

function calcNormReplacementDate(item, norm) {
  if (!norm || norm.periodType !== 'months') return null;

  const months = parseInt(norm.period, 10);
  if (!months) return null;

  const issueDate = new Date(item.issueDate);
  return new Date(
    issueDate.getFullYear(),
    issueDate.getMonth() + months,
    issueDate.getDate()
  );
}

function getNormReplacement(item, sizNorms) {
  const norm = findNormForItem(item, sizNorms);
  const nextReplacementDate = calcNormReplacementDate(item, norm);
  if (!nextReplacementDate) return null;

  return {
    name: item.itemName,
    nextReplacementDate,
    source: 'norm',
    itemType: item.itemType,
  };
}

/**
 * Позиции на замену для сотрудника.
 * @param {string} employeeId
 * @param {object[]} sizNorms
 * @param {object} options
 * @param {(daysLeft: number, nextReplacementDate: Date) => boolean} options.matches - фильтр по оставшимся дням
 * @param {string[]} [options.itemTypes] - например ['сиз']
 */
async function getReplacementItems(employeeId, sizNorms, { matches, itemTypes } = {}) {
  if (typeof matches !== 'function') {
    throw new Error('getReplacementItems: matches filter is required');
  }

  const inventoryWhere = { employeeId, status: 'выдан' };
  if (itemTypes?.length) {
    inventoryWhere.itemType = { in: itemTypes };
  }

  const inventory = await prisma.inventory.findMany({ where: inventoryWhere });
  if (inventory.length === 0) return [];

  const inventoryIds = inventory.map((i) => i.id);
  const addons = await prisma.inventoryAddon.findMany({
    where: { inventoryId: { in: inventoryIds } },
    orderBy: { nextReplacementDate: 'asc' },
  });

  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
  const items = [];
  const seenKeys = new Set();

  const pushItem = (item) => {
    const daysLeft = getDaysLeft(item.nextReplacementDate);
    if (!matches(daysLeft, item.nextReplacementDate)) return;

    const key = `${item.name}|${new Date(item.nextReplacementDate).toISOString()}|${item.source}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    items.push(item);
  };

  // Сначала дополнения — но только если дата не противоречит актуальному issueDate позиции
  for (const addon of addons) {
    const parent = inventoryById.get(addon.inventoryId);
    if (!parent) continue;

    const normReplacement = getNormReplacement(parent, sizNorms);
    const addonDate = new Date(addon.nextReplacementDate);
    const addonDays = getDaysLeft(addonDate);

    // Устаревший addon: дата просрочена, а по нормативу от текущей даты выдачи — нет
    if (normReplacement) {
      const normDays = getDaysLeft(normReplacement.nextReplacementDate);
      if (addonDays <= 0 && normDays > 0) {
        continue;
      }
    }

    pushItem({
      name: addon.name,
      nextReplacementDate: addon.nextReplacementDate,
      source: 'addon',
      itemType: parent.itemType,
    });
  }

  const inventoryIdsWithAddons = new Set(addons.map((addon) => addon.inventoryId));
  for (const item of inventory) {
    if (inventoryIdsWithAddons.has(item.id)) continue;

    const replacement = getNormReplacement(item, sizNorms);
    if (replacement) {
      pushItem(replacement);
    }
  }

  return items.sort(
    (a, b) => new Date(a.nextReplacementDate) - new Date(b.nextReplacementDate)
  );
}

const matchesOverdue = (daysLeft) => daysLeft <= 0;
const matchesTomorrow = (daysLeft) => daysLeft === 1;
const matchesThisMonth = (daysLeft, nextReplacementDate) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const date = new Date(nextReplacementDate);
  return date >= monthStart && date <= monthEnd;
};
const matchesWithinDays = (maxDays) => (daysLeft) => daysLeft <= maxDays;

module.exports = {
  matchNorm,
  findNormForItem,
  calcNormReplacementDate,
  getNormReplacement,
  getReplacementItems,
  matchesOverdue,
  matchesTomorrow,
  matchesThisMonth,
  matchesWithinDays,
};
