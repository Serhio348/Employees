require('dotenv').config();

const { Telegraf } = require('telegraf');
const { sendDueAndOverdueNotifications } = require('../server/bot/scheduler');
const { prisma } = require('../prisma/prisma-client');

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN не задан');
  }

  const bot = new Telegraf(token);
  await sendDueAndOverdueNotifications(bot);
}

main()
  .catch((err) => {
    console.error('[Bot/manual-due] Ошибка отправки уведомлений:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
