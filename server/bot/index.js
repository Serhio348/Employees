const { Telegraf } = require('telegraf');
const { registerStart } = require('./commands/start');
const { registerMySiz, handleMySiz } = require('./commands/mysiz');
const { registerExpiring, handleExpiring } = require('./commands/expiring');
const { getMainKeyboard, registerRequestSiz } = require('./commands/requestSiz');
const { startScheduler } = require('./scheduler');

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN не задан — бот не запущен');
    return null;
  }

  if (process.env.TELEGRAM_BOT_DISABLED === 'true') {
    console.warn('[Bot] TELEGRAM_BOT_DISABLED=true — бот не запущен (локальная разработка)');
    return null;
  }

  const bot = new Telegraf(token);

  // Регистрация команд
  registerStart(bot);
  registerMySiz(bot);
  registerExpiring(bot);
  registerRequestSiz(bot);

  // Нажатие кнопок клавиатуры — вызывают те же обработчики что и команды
  bot.hears('📦 Мой инвентарь', handleMySiz);
  bot.hears('⚠️ Что скоро истекает', handleExpiring);

  // Обработка неизвестного текста
  bot.on('text', (ctx) => {
    ctx.reply(
      'Используйте кнопки ниже 👇\n\n' +
      'Или команды:\n' +
      '/start — привязать аккаунт\n' +
      '/mysiz — мой инвентарь\n' +
      '/expiring — что скоро истекает\n' +
      '/addsiz — заявить получение СИЗ\n' +
      '/myid — показать ваш Telegram chat id',
      getMainKeyboard()
    );
  });

  // Обработка ошибок бота
  bot.catch((err, ctx) => {
    console.error(`[Bot] Ошибка для ${ctx.updateType}:`, err);
  });

  // Запуск
  bot.launch();
  console.log('[Bot] Telegram-бот запущен');

  // Планировщик уведомлений
  startScheduler(bot);

  // Graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}

module.exports = { startBot };
