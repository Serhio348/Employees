const { prisma } = require('../../../prisma/prisma-client');
const { getDaysLeft, formatExpiringLine, EXPIRING_SOON_DAYS } = require('../utils');

// Поиск нормы по названию предмета (регистронезависимо, по вхождению)
function matchNorm(itemName, sizNorms) {
  const name = itemName.toLowerCase();
  return sizNorms.find(n => {
    const norm = n.name.toLowerCase();
    return name.includes(norm) || norm.includes(name);
  }) || null;
}

// Общая логика — вызывается и командой /expiring, и кнопкой
async function handleExpiring(ctx) {
  const chatId = String(ctx.chat.id);

  try {
    const employee = await prisma.employee.findFirst({
      where: { telegramChatId: chatId }
    });

    if (!employee) {
      return ctx.reply('⚠️ Вы не привязаны к системе. Используйте /start.');
    }

    // Двухэтапный запрос (inventoryId без Prisma-relation)
    const inventory = await prisma.inventory.findMany({
      where: { employeeId: employee.id, status: 'выдан' }
    });

    if (inventory.length === 0) {
      return ctx.reply('✅ У вас нет выданных СИЗ.');
    }

    const inventoryIds = inventory.map(i => i.id);

    // Граница — начало дня через 30 дней
    const now    = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() + EXPIRING_SOON_DAYS, 23, 59, 59);

    const [addonExpiring, sizNorms] = await Promise.all([
      prisma.inventoryAddon.findMany({
        where: { inventoryId: { in: inventoryIds }, nextReplacementDate: { lte: cutoff } },
        orderBy: { nextReplacementDate: 'asc' }
      }),
      prisma.sizNorm.findMany()
    ]);

    const lines = [];

    // Реальные данные из InventoryAddon
    for (const addon of addonExpiring) {
      const days = getDaysLeft(addon.nextReplacementDate);
      lines.push(formatExpiringLine(addon, days));
    }

    // Если нет аддонов — проверяем по нормативам
    if (addonExpiring.length === 0) {
      for (const item of inventory) {
        const norm = matchNorm(item.itemName, sizNorms);
        if (!norm || norm.periodType === 'until_worn') continue;

        const months = parseInt(norm.period);
        if (!months) continue;

        const issueDate = new Date(item.issueDate);
        const nextDate = new Date(issueDate.getFullYear(), issueDate.getMonth() + months, issueDate.getDate());
        if (nextDate > cutoff) continue;

        const days = getDaysLeft(nextDate);
        const dateStr = nextDate.toLocaleDateString('ru-RU');
        const emoji = days <= 0 ? '🔴' : days <= 7 ? '🔴' : '⚠️';
        lines.push(`${emoji} *${item.itemName}* — ${days <= 0 ? 'ПРОСРОЧЕНО' : `через ${days} дн.`} (${dateStr}) _(по нормативу)_`);
      }
    }

    if (lines.length === 0) {
      return ctx.reply(`✅ Отлично! В ближайшие ${EXPIRING_SOON_DAYS} дней у вас ничего не истекает.`);
    }

    const header = `⚠️ *${employee.lastName} ${employee.firstName}* — скоро истекает:\n`;
    ctx.reply([header, ...lines].join('\n'), { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[Bot/expiring] Ошибка:', err);
    ctx.reply('⚠️ Ошибка сервера. Попробуйте позже.');
  }
}

function registerExpiring(bot) {
  bot.command('expiring', handleExpiring);
}

module.exports = { registerExpiring, handleExpiring };
