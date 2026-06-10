const { prisma } = require('../../../prisma/prisma-client');
const { getDaysLeft, formatExpiringLine, EXPIRING_SOON_DAYS } = require('../utils');
const { getReplacementItems, matchesWithinDays } = require('../replacementItems');

async function handleExpiring(ctx) {
  const chatId = String(ctx.chat.id);

  try {
    const employee = await prisma.employee.findFirst({
      where: { telegramChatId: chatId },
    });

    if (!employee) {
      return ctx.reply('⚠️ Вы не привязаны к системе. Используйте /start.');
    }

    const sizNorms = await prisma.sizNorm.findMany();
    const items = await getReplacementItems(employee.id, sizNorms, {
      matches: matchesWithinDays(EXPIRING_SOON_DAYS),
      itemTypes: ['сиз'],
    });

    if (items.length === 0) {
      return ctx.reply(`✅ Отлично! В ближайшие ${EXPIRING_SOON_DAYS} дней у вас ничего не истекает.`);
    }

    const lines = items.map((item) => {
      const days = getDaysLeft(item.nextReplacementDate);
      if (item.source === 'addon') {
        return formatExpiringLine(item, days);
      }

      const dateStr = new Date(item.nextReplacementDate).toLocaleDateString('ru-RU');
      const emoji = days <= 0 ? '🔴' : days <= 7 ? '🔴' : '⚠️';
      const status = days < 0 ? 'ПРОСРОЧЕНО' : days === 0 ? 'истекает сегодня' : `через ${days} дн.`;
      return `${emoji} *${item.name}* — ${status} (${dateStr}) _(по нормативу)_`;
    });

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
