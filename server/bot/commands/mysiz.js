const { prisma } = require('../../../prisma/prisma-client');
const { getDaysLeft, formatDaysLeft } = require('../utils');

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
    console.log(`[Bot/mysiz] employeeId=${employee.id}, inventoryIds=${JSON.stringify(inventoryIds)}`);
    const allAddons = await prisma.inventoryAddon.findMany({
      where: { inventoryId: { in: inventoryIds } },
      orderBy: { nextReplacementDate: 'asc' }
    });
    console.log(`[Bot/mysiz] addons found: ${allAddons.length}`, allAddons.map(a => ({ id: a.id, inventoryId: a.inventoryId, name: a.name })));

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
