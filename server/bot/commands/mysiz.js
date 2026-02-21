const { prisma } = require('../../../prisma/prisma-client');

function getDaysLeft(nextReplacementDate) {
  const now = new Date();
  const diff = new Date(nextReplacementDate) - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDaysLeft(days) {
  if (days <= 0) return `${Math.abs(days)} дн. назад 🔴 ПРОСРОЧЕНО`;
  if (days <= 7) return `${days} дн. 🔴`;
  if (days <= 30) return `${days} дн. ⚠️`;
  if (days < 60) return `~${days} дн. ✅`;
  const months = Math.floor(days / 30);
  return `~${months} мес. ✅`;
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

    const lines = [`👷 *${employee.lastName} ${employee.firstName}* — ваш инвентарь СИЗ:\n`];

    for (const item of inventory) {
      const addons = await prisma.inventoryAddon.findMany({
        where: { inventoryId: item.id },
        orderBy: { nextReplacementDate: 'asc' }
      });

      const dateStr = new Date(item.issueDate).toLocaleDateString('ru-RU');
      lines.push(`📦 *${item.itemName}* (выдано ${dateStr})`);

      if (addons.length === 0) {
        lines.push(`   └ Нет данных о сроках`);
      } else {
        for (const addon of addons) {
          const days = getDaysLeft(addon.nextReplacementDate);
          lines.push(`   └ ${addon.name} — осталось: *${formatDaysLeft(days)}*`);
        }
      }

      lines.push('');
    }

    lines.push(`_Обновлено: ${new Date().toLocaleString('ru-RU')}_`);

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
