const { prisma } = require('../../../prisma/prisma-client');
const { getDaysLeft, formatDaysLeft } = require('../utils');

// Поиск подходящей нормы по названию предмета (регистронезависимо, по вхождению)
function matchNorm(itemName, sizNorms) {
  const name = itemName.toLowerCase();
  return sizNorms.find(n => {
    const norm = n.name.toLowerCase();
    return name.includes(norm) || norm.includes(name);
  }) || null;
}

function findNormForItem(item, sizNorms) {
  return item.sizNormId
    ? sizNorms.find(n => n.id === item.sizNormId) || null
    : matchNorm(item.itemName, sizNorms);
}

// Строка для предмета без аддонов — берём из нормативов
function formatFromNorm(item, sizNorms) {
  const norm = findNormForItem(item, sizNorms);
  if (!norm) return `   └ Нет данных о сроках`;

  if (norm.periodType === 'until_worn') {
    return `   └ ${norm.name} — срок: *до износа*`;
  }

  const months = parseInt(norm.period);
  if (!months) return `   └ Нет данных о сроках`;

  const issueDate = new Date(item.issueDate);
  const nextDate = new Date(issueDate.getFullYear(), issueDate.getMonth() + months, issueDate.getDate());
  const days = getDaysLeft(nextDate);
  return `   └ ${norm.name} (${months} мес.) — осталось: *${formatDaysLeft(days)}* _(по нормативу)_`;
}

// Общая логика — вызывается и командой /mysiz, и кнопкой
async function handleMySiz(ctx) {
  const chatId = String(ctx.chat.id);

  try {
    const employee = await prisma.employee.findFirst({
      where: { telegramChatId: chatId }
    });

    if (!employee) {
      return ctx.reply(
        '⚠️ Вы не привязаны к системе.\nИспользуйте /start для регистрации.'
      );
    }

    const inventory = await prisma.inventory.findMany({
      where: { employeeId: employee.id, status: 'выдан' },
      orderBy: { issueDate: 'desc' }
    });

    if (inventory.length === 0) {
      return ctx.reply(
        `👷 ${employee.lastName} ${employee.firstName}\n\n📭 У вас нет выданных СИЗ.`
      );
    }

    // Один запрос на все аддоны сразу — вместо N запросов в цикле
    const inventoryIds = inventory.map(i => i.id);
    const [allAddons, sizNorms] = await Promise.all([
      prisma.inventoryAddon.findMany({
        where: { inventoryId: { in: inventoryIds } },
        orderBy: { nextReplacementDate: 'asc' }
      }),
      prisma.sizNorm.findMany()
    ]);

    // Группируем аддоны по inventoryId
    const addonsByInventory = {};
    for (const addon of allAddons) {
      if (!addonsByInventory[addon.inventoryId]) {
        addonsByInventory[addon.inventoryId] = [];
      }
      addonsByInventory[addon.inventoryId].push(addon);
    }

    const lines = [`👷 *${employee.lastName} ${employee.firstName}* — ваш инвентарь СИЗ:\n`];

    for (const item of inventory) {
      const addons = addonsByInventory[item.id] || [];
      const dateStr = new Date(item.issueDate).toLocaleDateString('ru-RU');
      lines.push(`📦 *${item.itemName}* (выдано ${dateStr})`);

      if (addons.length === 0) {
        // Нет индивидуальных записей — пробуем взять из нормативов
        lines.push(formatFromNorm(item, sizNorms));
      } else {
        for (const addon of addons) {
          const days = getDaysLeft(addon.nextReplacementDate);
          lines.push(`   └ ${addon.name} — осталось: *${formatDaysLeft(days)}*`);
        }
      }

      lines.push('');
    }

    const generatedAt = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Minsk'
    });
    lines.push(`_Сформировано: ${generatedAt} (Минск)_`);

    ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[Bot/mysiz] Ошибка:', err);
    ctx.reply('⚠️ Ошибка сервера. Попробуйте позже.');
  }
}

function registerMySiz(bot) {
  bot.command('mysiz', handleMySiz);
}

module.exports = { registerMySiz, handleMySiz };
