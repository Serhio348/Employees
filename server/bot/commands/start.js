const { prisma } = require('../../../prisma/prisma-client');

// Храним состояние ожидания ввода (в памяти, достаточно для MVP)
// При перезапуске бота сбрасывается — сотрудник повторит /start
const waitingForName = new Set();

function registerStart(bot) {

  bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;

    try {
      const existing = await prisma.employee.findFirst({
        where: { telegramChatId: String(chatId) }
      });

      if (existing) {
        return ctx.reply(
          `✅ Вы уже привязаны как ${existing.lastName} ${existing.firstName}.\n` +
          `Используйте кнопки ниже для просмотра инвентаря.`,
          {
            reply_markup: {
              keyboard: [
                [{ text: '📦 Мой инвентарь' }],
                [{ text: '⚠️ Что скоро истекает' }]
              ],
              resize_keyboard: true,
              persistent: true
            }
          }
        );
      }
    } catch (err) {
      console.error('[Bot/start] Ошибка проверки привязки:', err);
      return ctx.reply('⚠️ Ошибка сервера. Попробуйте позже.');
    }

    waitingForName.add(chatId);
    ctx.reply(
      '👋 Добро пожаловать в систему учёта спецодежды и СИЗ!\n\n' +
      'Введите ваше *ФИО* (например: Петров Иван Сергеевич):',
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;

    if (!waitingForName.has(chatId)) return;

    const input = ctx.message.text.trim();

    // Валидация: не пустое, только буквы и пробелы, минимум 2 символа
    if (input.length < 2 || !/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(input)) {
      return ctx.reply(
        '❌ Некорректный ввод. Введите ФИО русскими буквами.\n_Пример: Петров Иван Сергеевич_',
        { parse_mode: 'Markdown' }
      );
    }

    waitingForName.delete(chatId);

    const parts = input.split(/\s+/);
    const lastName  = parts[0];
    const firstName = parts[1] || null;
    const surName   = parts[2] || null;

    try {
      // Ищем с точным совпадением (equals + insensitive) — не contains
      const employees = await prisma.employee.findMany({
        where: {
          lastName:  { equals: lastName,  mode: 'insensitive' },
          ...(firstName ? { firstName: { equals: firstName, mode: 'insensitive' } } : {}),
          ...(surName   ? { surName:    { equals: surName,   mode: 'insensitive' } } : {})
        }
      });

      // Несколько совпадений — просим уточнить
      if (employees.length > 1) {
        waitingForName.add(chatId);
        return ctx.reply(
          '⚠️ Найдено несколько сотрудников с такой фамилией.\n' +
          'Введите полностью *Фамилию Имя Отчество*:',
          { parse_mode: 'Markdown' }
        );
      }

      // Не найден
      if (employees.length === 0) {
        waitingForName.add(chatId);
        return ctx.reply(
          '❌ Сотрудник не найден. Проверьте правильность написания и попробуйте ещё раз.\n\n' +
          '_Пример: Петров Иван Сергеевич_\n\n' +
          'Если возникли проблемы — обратитесь к ответственному за СИЗ.',
          { parse_mode: 'Markdown' }
        );
      }

      const employee = employees[0];

      // Привязываем
      await prisma.employee.update({
        where: { id: employee.id },
        data: { telegramChatId: String(chatId) }
      });

      ctx.reply(
        `✅ Готово! Вы привязаны как *${employee.lastName} ${employee.firstName}*.\n\n` +
        `Теперь вы будете получать уведомления о сроках СИЗ.\n` +
        `Используйте кнопки ниже 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            keyboard: [
              [{ text: '📦 Мой инвентарь' }],
              [{ text: '⚠️ Что скоро истекает' }]
            ],
            resize_keyboard: true,
            persistent: true
          }
        }
      );

    } catch (err) {
      console.error('[Bot/start] Ошибка поиска сотрудника:', err);
      waitingForName.add(chatId);
      ctx.reply('⚠️ Ошибка сервера. Попробуйте ещё раз позже.');
    }
  });
}

module.exports = { registerStart };
