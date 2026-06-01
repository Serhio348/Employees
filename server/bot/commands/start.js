const { prisma } = require('../../../prisma/prisma-client');

// Храним состояние ожидания ввода (в памяти, достаточно для MVP)
// При перезапуске бота сбрасывается — сотрудник повторит /start
const pendingLinks = new Map();

function getFullName(employee) {
  return [employee.lastName, employee.firstName, employee.surName].filter(Boolean).join(' ');
}

async function linkEmployee(ctx, employee) {
  const chatId = String(ctx.chat.id);

  await prisma.$transaction([
    prisma.employee.updateMany({
      where: {
        telegramChatId: chatId,
        NOT: { id: employee.id }
      },
      data: { telegramChatId: null }
    }),
    prisma.employee.update({
      where: { id: employee.id },
      data: { telegramChatId: chatId }
    })
  ]);

  return ctx.reply(
    `✅ Готово! Вы привязаны как *${getFullName(employee)}*.\n\n` +
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
}

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

    pendingLinks.set(chatId, { step: 'name' });
    ctx.reply(
      '👋 Добро пожаловать в систему учёта спецодежды и СИЗ!\n\n' +
      'Введите ваше *ФИО* (например: Петров Иван Сергеевич):',
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('text', async (ctx, next) => {
    const chatId = ctx.chat.id;
    const state = pendingLinks.get(chatId);

    if (!state) return next();

    const input = ctx.message.text.trim();

    if (state.step === 'employeeNumber') {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: state.employeeId }
        });

        if (!employee) {
          pendingLinks.set(chatId, { step: 'name' });
          return ctx.reply('❌ Сотрудник не найден. Введите ФИО ещё раз.');
        }

        if (String(employee.employeeNumber || '').trim().toLowerCase() !== input.toLowerCase()) {
          pendingLinks.set(chatId, state);
          return ctx.reply(
            '❌ Табельный номер не совпадает. Проверьте номер и попробуйте ещё раз.\n\n' +
            'Если возникли проблемы — обратитесь к ответственному за СИЗ.'
          );
        }

        pendingLinks.delete(chatId);
        return linkEmployee(ctx, employee);
      } catch (err) {
        console.error('[Bot/start] Ошибка подтверждения табельного номера:', err);
        pendingLinks.set(chatId, state);
        return ctx.reply('⚠️ Ошибка сервера. Попробуйте ещё раз позже.');
      }
    }

    // Валидация: не пустое, только буквы и пробелы, минимум 2 символа
    if (input.length < 2 || !/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(input)) {
      return ctx.reply(
        '❌ Некорректный ввод. Введите ФИО русскими буквами.\n_Пример: Петров Иван Сергеевич_',
        { parse_mode: 'Markdown' }
      );
    }

    pendingLinks.delete(chatId);

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
        pendingLinks.set(chatId, { step: 'name' });
        return ctx.reply(
          '⚠️ Найдено несколько сотрудников с такой фамилией.\n' +
          'Введите полностью *Фамилию Имя Отчество*:',
          { parse_mode: 'Markdown' }
        );
      }

      // Не найден
      if (employees.length === 0) {
        pendingLinks.set(chatId, { step: 'name' });
        return ctx.reply(
          '❌ Сотрудник не найден. Проверьте правильность написания и попробуйте ещё раз.\n\n' +
          '_Пример: Петров Иван Сергеевич_\n\n' +
          'Если возникли проблемы — обратитесь к ответственному за СИЗ.',
          { parse_mode: 'Markdown' }
        );
      }

      const employee = employees[0];

      if (employee.employeeNumber) {
        pendingLinks.set(chatId, { step: 'employeeNumber', employeeId: employee.id });
        return ctx.reply(
          'Для подтверждения личности введите ваш *табельный номер*:',
          { parse_mode: 'Markdown' }
        );
      }

      return linkEmployee(ctx, employee);

    } catch (err) {
      console.error('[Bot/start] Ошибка поиска сотрудника:', err);
      pendingLinks.set(chatId, { step: 'name' });
      ctx.reply('⚠️ Ошибка сервера. Попробуйте ещё раз позже.');
    }
  });
}

module.exports = { registerStart };
