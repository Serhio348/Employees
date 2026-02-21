const cron = require('node-cron');
const { prisma } = require('../../prisma/prisma-client');
const { getDaysLeft } = require('./utils');

const PAUSE_MS = 50; // пауза между сообщениями (лимит Telegram: 30 сообщений/сек)

// Отправка сообщения с обработкой блокировки бота
async function sendMessage(bot, employee, text) {
  try {
    await bot.telegram.sendMessage(employee.telegramChatId, text, { parse_mode: 'Markdown' });
    console.log(`[Scheduler] Отправлено: ${employee.lastName} ${employee.firstName}`);
  } catch (err) {
    if (err.code === 403) {
      // Сотрудник заблокировал бота — очищаем chatId
      await prisma.employee.update({
        where: { id: employee.id },
        data: { telegramChatId: null }
      });
      console.log(`[Scheduler] Бот заблокирован: ${employee.lastName} ${employee.firstName}`);
    } else {
      console.error(`[Scheduler] Ошибка отправки ${employee.lastName}:`, err.message);
    }
  }
}

// Получить ID выданного инвентаря сотрудника
async function getInventoryIds(employeeId) {
  const inventory = await prisma.inventory.findMany({
    where: { employeeId, status: 'выдан' }
  });
  return inventory.map(i => i.id);
}

// Общий цикл: пройти по всем сотрудникам с Telegram,
// получить их аддоны по фильтру и отправить сообщение через buildMessage
async function notifyEmployees(bot, addonFilter, buildMessage) {
  const employees = await prisma.employee.findMany({
    where: { telegramChatId: { not: null } }
  });

  for (const employee of employees) {
    const inventoryIds = await getInventoryIds(employee.id);
    if (inventoryIds.length === 0) continue;

    const addons = await prisma.inventoryAddon.findMany({
      where: { inventoryId: { in: inventoryIds }, ...addonFilter },
      orderBy: { nextReplacementDate: 'asc' }
    });

    if (addons.length === 0) continue;

    const text = buildMessage(employee, addons);
    if (!text) continue;

    await sendMessage(bot, employee, text);
    await new Promise(r => setTimeout(r, PAUSE_MS));
  }
}

function startScheduler(bot) {

  // ─── 1. Ежемесячный дайджест — 1-го числа в 9:00 Минск (06:00 UTC) ───
  cron.schedule('0 6 1 * *', async () => {
    console.log('[Scheduler] Запуск ежемесячного дайджеста...');
    try {
      const now        = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const monthName  = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

      await notifyEmployees(
        bot,
        { nextReplacementDate: { gte: monthStart, lte: monthEnd } },
        (employee, addons) => {
          const lines = [
            `📅 *${employee.lastName} ${employee.firstName}* — дайджест СИЗ на ${monthName}:\n`
          ];
          for (const addon of addons) {
            const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
            const days    = getDaysLeft(addon.nextReplacementDate);
            const emoji   = days <= 7 ? '🔴' : '⚠️';
            lines.push(`${emoji} *${addon.name}* — истекает ${dateStr}`);
          }
          lines.push(`\nПодробнее: нажмите кнопку 📦 Мой инвентарь`);
          return lines.join('\n');
        }
      );

      console.log('[Scheduler] Ежемесячный дайджест завершён.');
    } catch (err) {
      console.error('[Scheduler] Ошибка дайджеста:', err);
    }
  });

  // ─── 2. Напоминание за 1 день — каждый день в 9:00 Минск (06:00 UTC) ───
  cron.schedule('0 6 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
      const dayEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

      await notifyEmployees(
        bot,
        { nextReplacementDate: { gte: dayStart, lte: dayEnd } },
        (employee, addons) => {
          const lines = [
            `🔴 *${employee.lastName} ${employee.firstName}*, завтра истекает срок:\n`
          ];
          for (const addon of addons) {
            const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
            lines.push(`❗ *${addon.name}* — ${dateStr}`);
          }
          lines.push(`\nОбратитесь к ответственному за выдачу СИЗ.`);
          return lines.join('\n');
        }
      );
    } catch (err) {
      console.error('[Scheduler] Ошибка напоминания за 1 день:', err);
    }
  });

  console.log('[Bot] Планировщик запущен (дайджест 1-го числа + напоминание за 1 день до истечения)');
}

module.exports = { startScheduler };
