const { prisma } = require('../../../prisma/prisma-client');
const { getDaysLeft, formatExpiringLine, EXPIRING_SOON_DAYS } = require('../utils');

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
    const now     = new Date();
    const cutoff  = new Date(now.getFullYear(), now.getMonth(), now.getDate() + EXPIRING_SOON_DAYS, 23, 59, 59);

    const expiring = await prisma.inventoryAddon.findMany({
      where: {
        inventoryId: { in: inventoryIds },
        nextReplacementDate: { lte: cutoff }
      },
      orderBy: { nextReplacementDate: 'asc' }
    });

    if (expiring.length === 0) {
      return ctx.reply(`✅ Отлично! В ближайшие ${EXPIRING_SOON_DAYS} дней у вас ничего не истекает.`);
    }

    const lines = [`⚠️ *${employee.lastName} ${employee.firstName}* — скоро истекает:\n`];

    for (const addon of expiring) {
      const days = getDaysLeft(addon.nextReplacementDate);
      lines.push(formatExpiringLine(addon, days));
    }

    ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });

  } catch (err) {
    console.error('[Bot/expiring] Ошибка:', err);
    ctx.reply('⚠️ Ошибка сервера. Попробуйте позже.');
  }
}

function registerExpiring(bot) {
  bot.command('expiring', handleExpiring);
}

module.exports = { registerExpiring, handleExpiring };
