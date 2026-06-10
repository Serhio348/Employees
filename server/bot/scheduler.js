const cron = require('node-cron');
const { prisma } = require('../../prisma/prisma-client');
const { getDaysLeft } = require('./utils');
const {
  getReplacementItems,
  matchesOverdue,
  matchesTomorrow,
  matchesThisMonth,
} = require('./replacementItems');

const PAUSE_MS = 50; // пауза между сообщениями (лимит Telegram: 30 сообщений/сек)
const SIZ_ITEM_TYPES = ['сиз'];

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

async function sendMessage(bot, employee, text) {
  try {
    await bot.telegram.sendMessage(employee.telegramChatId, text, { parse_mode: 'Markdown' });
    console.log(`[Scheduler] Отправлено: ${employee.lastName} ${employee.firstName}`);
  } catch (err) {
    if (err.code === 403) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { telegramChatId: null },
      });
      console.log(`[Scheduler] Бот заблокирован: ${employee.lastName} ${employee.firstName}`);
    } else {
      console.error(`[Scheduler] Ошибка отправки ${employee.lastName}:`, err.message);
    }
  }
}

async function notifyEmployees(bot, options, buildMessage) {
  const [employees, sizNorms] = await Promise.all([
    prisma.employee.findMany({
      where: { telegramChatId: { not: null } },
    }),
    prisma.sizNorm.findMany(),
  ]);

  for (const employee of employees) {
    const items = await getReplacementItems(employee.id, sizNorms, options);
    if (items.length === 0) continue;

    const text = buildMessage(employee, items);
    if (!text) continue;

    console.log(
      `[Scheduler] ${employee.lastName} ${employee.firstName}: ${items.length} поз.`,
      items.map((i) => `${i.name} (${i.source}, days=${getDaysLeft(i.nextReplacementDate)})`).join('; ')
    );

    await sendMessage(bot, employee, text);
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }
}

async function sendDueAndOverdueNotifications(bot) {
  console.log('[Scheduler] Запуск уведомлений по просроченным СИЗ...');

  await notifyEmployees(
    bot,
    {
      matches: matchesOverdue,
      itemTypes: SIZ_ITEM_TYPES,
    },
    (employee, items) => {
      const lines = [
        `🔴 *${employee.lastName} ${employee.firstName}*, есть СИЗ с истёкшим сроком:\n`,
      ];
      for (const item of items) {
        lines.push(formatReplacementLine(item, { mode: 'due' }));
      }
      lines.push('\nОбратитесь к ответственному за выдачу СИЗ.');
      return lines.join('\n');
    }
  );
}

function startScheduler(bot) {
  cron.schedule('0 6 1 * *', async () => {
    console.log('[Scheduler] Запуск ежемесячного дайджеста...');
    try {
      const now = new Date();
      const monthName = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

      await notifyEmployees(
        bot,
        {
          matches: matchesThisMonth,
          itemTypes: SIZ_ITEM_TYPES,
        },
        (employee, items) => {
          const lines = [
            `📅 *${employee.lastName} ${employee.firstName}* — дайджест СИЗ на ${monthName}:\n`,
          ];
          for (const item of items) {
            const dateStr = new Date(item.nextReplacementDate).toLocaleDateString('ru-RU');
            const days = getDaysLeft(item.nextReplacementDate);
            const emoji = days <= 7 ? '🔴' : '⚠️';
            const normSuffix = item.source === 'norm' ? ' _(по нормативу)_' : '';
            lines.push(`${emoji} *${item.name}* — истекает ${dateStr}${normSuffix}`);
          }
          lines.push('\nПодробнее: нажмите кнопку 📦 Мой инвентарь');
          return lines.join('\n');
        }
      );

      console.log('[Scheduler] Ежемесячный дайджест завершён.');
    } catch (err) {
      console.error('[Scheduler] Ошибка дайджеста:', err);
    }
  });

  cron.schedule('0 6 * * *', async () => {
    try {
      await sendDueAndOverdueNotifications(bot);
    } catch (err) {
      console.error('[Scheduler] Ошибка уведомлений по просроченным СИЗ:', err);
    }
  });

  cron.schedule('0 6 * * *', async () => {
    try {
      await notifyEmployees(
        bot,
        {
          matches: matchesTomorrow,
          itemTypes: SIZ_ITEM_TYPES,
        },
        (employee, items) => {
          const lines = [
            `🔴 *${employee.lastName} ${employee.firstName}*, завтра истекает срок:\n`,
          ];
          for (const item of items) {
            lines.push(formatReplacementLine(item));
          }
          lines.push('\nОбратитесь к ответственному за выдачу СИЗ.');
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
