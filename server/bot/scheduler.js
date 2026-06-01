const cron = require('node-cron');
const { prisma } = require('../../prisma/prisma-client');
const { getDaysLeft } = require('./utils');

const PAUSE_MS = 50; // пауза между сообщениями (лимит Telegram: 30 сообщений/сек)

function matchNorm(itemName, sizNorms) {
  const name = itemName.toLowerCase();
  return sizNorms.find(n => {
    const norm = n.name.toLowerCase();
    return name.includes(norm) || norm.includes(name);
  }) || null;
}

function getNormReplacement(item, sizNorms) {
  const norm = item.sizNormId
    ? sizNorms.find(n => n.id === item.sizNormId) || null
    : matchNorm(item.itemName, sizNorms);
  if (!norm || norm.periodType === 'until_worn') return null;

  const months = parseInt(norm.period);
  if (!months) return null;

  const issueDate = new Date(item.issueDate);
  const nextReplacementDate = new Date(
    issueDate.getFullYear(),
    issueDate.getMonth() + months,
    issueDate.getDate()
  );

  return {
    name: item.itemName,
    nextReplacementDate,
    source: 'norm'
  };
}

async function getReplacementItems(employeeId, sizNorms, dateMatches) {
  const inventory = await prisma.inventory.findMany({
    where: { employeeId, status: 'выдан' }
  });

  if (inventory.length === 0) return [];

  const inventoryIds = inventory.map(i => i.id);
  const addons = await prisma.inventoryAddon.findMany({
    where: { inventoryId: { in: inventoryIds } },
    orderBy: { nextReplacementDate: 'asc' }
  });

  const items = addons
    .filter(addon => dateMatches(new Date(addon.nextReplacementDate)))
    .map(addon => ({
      name: addon.name,
      nextReplacementDate: addon.nextReplacementDate,
      source: 'addon'
    }));

  const inventoryIdsWithAddons = new Set(addons.map(addon => addon.inventoryId));
  for (const item of inventory) {
    if (inventoryIdsWithAddons.has(item.id)) continue;

    const replacement = getNormReplacement(item, sizNorms);
    if (replacement && dateMatches(replacement.nextReplacementDate)) {
      items.push(replacement);
    }
  }

  return items.sort((a, b) => new Date(a.nextReplacementDate) - new Date(b.nextReplacementDate));
}

function formatReplacementLine(item, options = {}) {
  const dateStr = new Date(item.nextReplacementDate).toLocaleDateString('ru-RU');
  const days = getDaysLeft(item.nextReplacementDate);
  const normSuffix = item.source === 'norm' ? ' _(по нормативу)_' : '';

  if (options.mode === 'due') {
    const status = days < 0
      ? `ПРОСРОЧЕНО на ${Math.abs(days)} дн.`
      : 'истекает сегодня';
    return `🔴 *${item.name}* — ${status} (${dateStr})${normSuffix}`;
  }

  return `❗ *${item.name}* — ${dateStr}${normSuffix}`;
}

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

// Общий цикл: пройти по всем сотрудникам с Telegram,
// получить позиции на замену и отправить сообщение через buildMessage
async function notifyEmployees(bot, dateMatches, buildMessage) {
  const [employees, sizNorms] = await Promise.all([
    prisma.employee.findMany({
      where: { telegramChatId: { not: null } }
    }),
    prisma.sizNorm.findMany()
  ]);

  for (const employee of employees) {
    const items = await getReplacementItems(employee.id, sizNorms, dateMatches);
    if (items.length === 0) continue;

    const text = buildMessage(employee, items);
    if (!text) continue;

    await sendMessage(bot, employee, text);
    await new Promise(r => setTimeout(r, PAUSE_MS));
  }
}

async function sendDueAndOverdueNotifications(bot) {
  console.log('[Scheduler] Запуск уведомлений по просроченным СИЗ...');
  const today = new Date();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  await notifyEmployees(
    bot,
    date => date <= todayEnd,
    (employee, items) => {
      const lines = [
        `🔴 *${employee.lastName} ${employee.firstName}*, есть СИЗ с истёкшим сроком:\n`
      ];
      for (const item of items) {
        lines.push(formatReplacementLine(item, { mode: 'due' }));
      }
      lines.push(`\nОбратитесь к ответственному за выдачу СИЗ.`);
      return lines.join('\n');
    }
  );
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
        date => date >= monthStart && date <= monthEnd,
        (employee, items) => {
          const lines = [
            `📅 *${employee.lastName} ${employee.firstName}* — дайджест СИЗ на ${monthName}:\n`
          ];
          for (const item of items) {
            const dateStr = new Date(item.nextReplacementDate).toLocaleDateString('ru-RU');
            const days    = getDaysLeft(item.nextReplacementDate);
            const emoji   = days <= 7 ? '🔴' : '⚠️';
            const normSuffix = item.source === 'norm' ? ' _(по нормативу)_' : '';
            lines.push(`${emoji} *${item.name}* — истекает ${dateStr}${normSuffix}`);
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

  // ─── 2. Просрочено или истекает сегодня — каждый день в 9:00 Минск (06:00 UTC) ───
  cron.schedule('0 6 * * *', async () => {
    try {
      await sendDueAndOverdueNotifications(bot);
    } catch (err) {
      console.error('[Scheduler] Ошибка уведомлений по просроченным СИЗ:', err);
    }
  });

  // ─── 3. Напоминание за 1 день — каждый день в 9:00 Минск (06:00 UTC) ───
  cron.schedule('0 6 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
      const dayEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

      await notifyEmployees(
        bot,
        date => date >= dayStart && date <= dayEnd,
        (employee, items) => {
          const lines = [
            `🔴 *${employee.lastName} ${employee.firstName}*, завтра истекает срок:\n`
          ];
          for (const item of items) {
            lines.push(formatReplacementLine(item));
          }
          lines.push(`\nОбратитесь к ответственному за выдачу СИЗ.`);
          return lines.join('\n');
        }
      );
    } catch (err) {
      console.error('[Scheduler] Ошибка напоминания за 1 день:', err);
    }
  });

  console.log('[Bot] Планировщик запущен (дайджест + просроченные/сегодня + напоминание за 1 день)');
}

module.exports = { sendDueAndOverdueNotifications, startScheduler };
