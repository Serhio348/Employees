const { prisma } = require('../../../prisma/prisma-client');

const ADD_SIZ_BUTTON = '➕ Добавить полученное СИЗ';
const CANCEL_BUTTON = '↩️ Отмена';
const PAGE_SIZE = 8;
const pendingRequests = new Map();

function getAdminChatIds() {
  return (process.env.ADMIN_TELEGRAM_CHAT_IDS || process.env.ADMIN_TELEGRAM_CHAT_ID || '')
    .split(',')
    .map(chatId => chatId.trim())
    .filter(Boolean);
}

function getMainKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '📦 Мой инвентарь' }],
        [{ text: '⚠️ Что скоро истекает' }],
        [{ text: ADD_SIZ_BUTTON }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  };
}

function getCancelKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: CANCEL_BUTTON }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
}

function getFullName(employee) {
  return [employee.lastName, employee.firstName, employee.surName].filter(Boolean).join(' ');
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU');
}

function normalizeSearch(value = '') {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRuDate(input) {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'сегодня') return new Date();

  const match = normalized.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

async function getLinkedEmployee(ctx) {
  return prisma.employee.findFirst({
    where: { telegramChatId: String(ctx.chat.id) }
  });
}

function buildSizNormWhere(searchQuery) {
  if (!searchQuery) return {};

  const variants = Array.from(new Set([
    searchQuery,
    searchQuery.replace(/е/g, 'ё')
  ])).filter(Boolean);

  return {
    OR: variants.flatMap(query => ([
      { name: { contains: query, mode: 'insensitive' } },
      { classification: { contains: query, mode: 'insensitive' } }
    ]))
  };
}

function buildSizNormKeyboard(sizNorms, page, totalPages) {
  const buttons = sizNorms.map(norm => ([{
    text: norm.name,
    callback_data: `sizreq_pick_${norm.id}`
  }]));

  buttons.push([
    { text: '🔎 Искать заново', callback_data: 'sizreq_search' },
    { text: '📋 Все СИЗ', callback_data: 'sizreq_all' }
  ]);
  buttons.push([{ text: '↩️ Отмена', callback_data: 'sizreq_cancel' }]);

  const navigation = [];
  if (page > 0) {
    navigation.push({ text: '◀️ Назад', callback_data: `sizreq_page_${page - 1}` });
  }
  if (page < totalPages - 1) {
    navigation.push({ text: 'Вперёд ▶️', callback_data: `sizreq_page_${page + 1}` });
  }
  if (navigation.length > 0) buttons.push(navigation);

  return { inline_keyboard: buttons };
}

async function askSearch(ctx, editMessage = false) {
  const text =
    'Введите часть названия СИЗ для поиска.\n\n' +
    'Например: ботинки, каска, перчатки.\n' +
    'Или нажмите "Показать все СИЗ".';

  const options = {
    reply_markup: {
      inline_keyboard: [[
        { text: '📋 Показать все СИЗ', callback_data: 'sizreq_all' }
      ], [
        { text: '↩️ Отмена', callback_data: 'sizreq_cancel' }
      ]]
    }
  };

  if (editMessage) {
    return ctx.editMessageText(text, options);
  }

  return ctx.reply(text, options);
}

async function showSizNorms(ctx, page = 0, editMessage = false, searchQuery = '') {
  const where = buildSizNormWhere(searchQuery);
  const total = await prisma.sizNorm.count({ where });
  if (total === 0) {
    if (searchQuery) {
      const chatId = String(ctx.chat.id);
      const state = pendingRequests.get(chatId);
      if (state) {
        pendingRequests.set(chatId, { ...state, step: 'search', searchQuery: '' });
      }
    }

    const message = searchQuery
      ? `По запросу "${searchQuery}" ничего не найдено. Попробуйте другое слово.`
      : 'В базе пока нет норм СИЗ. Обратитесь к ответственному.';

    if (editMessage) {
      return ctx.editMessageText(message, {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔎 Искать заново', callback_data: 'sizreq_search' },
            { text: '📋 Все СИЗ', callback_data: 'sizreq_all' }
          ], [
            { text: '↩️ Отмена', callback_data: 'sizreq_cancel' }
          ]]
        }
      });
    }

    return ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🔎 Искать заново', callback_data: 'sizreq_search' },
          { text: '📋 Все СИЗ', callback_data: 'sizreq_all' }
        ], [
          { text: '↩️ Отмена', callback_data: 'sizreq_cancel' }
        ]]
      }
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const sizNorms = await prisma.sizNorm.findMany({
    where,
    orderBy: { name: 'asc' },
    skip: safePage * PAGE_SIZE,
    take: PAGE_SIZE
  });

  const searchLabel = searchQuery ? `\nПоиск: "${searchQuery}"` : '';
  const text = `Выберите СИЗ из базы (${safePage + 1}/${totalPages}):${searchLabel}`;
  const options = {
    reply_markup: buildSizNormKeyboard(sizNorms, safePage, totalPages)
  };

  if (editMessage) {
    return ctx.editMessageText(text, options);
  }

  return ctx.reply(text, options);
}

async function startRequest(ctx) {
  const employee = await getLinkedEmployee(ctx);
  if (!employee) {
    return ctx.reply('⚠️ Вы не привязаны к системе. Используйте /start для регистрации.');
  }

  pendingRequests.set(String(ctx.chat.id), { step: 'search', employeeId: employee.id, searchQuery: '' });
  await ctx.reply('Начинаем заявку на получение СИЗ.', getCancelKeyboard());
  return askSearch(ctx);
}

async function askQuantity(ctx, sizNormId) {
  const chatId = String(ctx.chat.id);
  const state = pendingRequests.get(chatId);
  if (!state) {
    await ctx.answerCbQuery();
    return ctx.reply(`Нажмите "${ADD_SIZ_BUTTON}", чтобы начать заявку.`);
  }

  const sizNorm = await prisma.sizNorm.findUnique({ where: { id: sizNormId } });
  if (!sizNorm) {
    await ctx.answerCbQuery('СИЗ не найден');
    return showSizNorms(ctx, 0, false, state.searchQuery || '');
  }

  pendingRequests.set(chatId, {
    ...state,
    step: 'quantity',
    sizNormId: sizNorm.id,
    sizNormName: sizNorm.name
  });

  await ctx.answerCbQuery();
  return ctx.reply(`Вы выбрали: ${sizNorm.name}\nВведите количество:`);
}

function askIssueDate(ctx, state, quantity) {
  pendingRequests.set(String(ctx.chat.id), {
    ...state,
    step: 'issueDate',
    quantity
  });

  return ctx.reply(
    'Введите дату получения в формате ДД.ММ.ГГГГ или нажмите "Сегодня".',
    {
      reply_markup: {
        keyboard: [[{ text: 'Сегодня' }], [{ text: CANCEL_BUTTON }]],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    }
  );
}

async function notifyAdmins(telegram, request, employee) {
  const adminChatIds = getAdminChatIds();
  if (adminChatIds.length === 0) return false;

  const text = [
    'Новая заявка на получение СИЗ',
    '',
    `Сотрудник: ${getFullName(employee)}`,
    `СИЗ: ${request.sizNormName}`,
    `Количество: ${request.quantity}`,
    `Дата получения: ${formatDate(request.issueDate)}`
  ].join('\n');

  let sent = 0;
  for (const adminChatId of adminChatIds) {
    try {
      await telegram.sendMessage(adminChatId, text, {
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Подтвердить', callback_data: `sizreq_approve_${request.id}` },
            { text: '❌ Отклонить', callback_data: `sizreq_reject_${request.id}` }
          ]]
        }
      });
      sent += 1;
    } catch (err) {
      console.error(`[Bot/requestSiz] Не удалось отправить заявку админу ${adminChatId}:`, err.message);
    }
  }

  return sent > 0;
}

async function createRequest(ctx, state, issueDate) {
  const chatId = String(ctx.chat.id);
  if (getAdminChatIds().length === 0) {
    pendingRequests.delete(chatId);
    return ctx.reply(
      'Администраторы Telegram не настроены. Сообщите ответственному за СИЗ.',
      getMainKeyboard()
    );
  }

  const employee = await prisma.employee.findUnique({ where: { id: state.employeeId } });
  if (!employee) {
    pendingRequests.delete(chatId);
    return ctx.reply('Сотрудник не найден. Начните заново через /start.', getMainKeyboard());
  }

  const existingPending = await prisma.telegramSizRequest.findFirst({
    where: {
      employeeId: employee.id,
      sizNormId: state.sizNormId,
      status: 'pending'
    }
  });

  if (existingPending) {
    pendingRequests.delete(chatId);
    return ctx.reply(
      'У вас уже есть такая заявка на подтверждении. Дождитесь решения ответственного.',
      getMainKeyboard()
    );
  }

  const request = await prisma.telegramSizRequest.create({
    data: {
      employeeId: employee.id,
      telegramChatId: chatId,
      sizNormId: state.sizNormId,
      sizNormName: state.sizNormName,
      quantity: state.quantity,
      issueDate
    }
  });

  pendingRequests.delete(chatId);
  const adminsNotified = await notifyAdmins(ctx.telegram, request, employee);
  if (!adminsNotified) {
    return ctx.reply(
      'Заявка создана, но уведомление ответственному не отправилось. Сообщите ответственному за СИЗ.',
      getMainKeyboard()
    );
  }

  return ctx.reply('Заявка отправлена ответственному на подтверждение.', getMainKeyboard());
}

async function handleRequestText(ctx, next) {
  const chatId = String(ctx.chat.id);
  const state = pendingRequests.get(chatId);
  if (!state || state.step === 'selectNorm') return next();

  const input = ctx.message.text.trim();
  if (input === CANCEL_BUTTON || input === '/cancel') {
    pendingRequests.delete(chatId);
    return ctx.reply('Добавление СИЗ отменено.', getMainKeyboard());
  }

  if (state.step === 'search') {
    const searchQuery = normalizeSearch(input);
    if (searchQuery.length < 2) {
      return ctx.reply('Введите минимум 2 символа для поиска.');
    }

    pendingRequests.set(chatId, {
      ...state,
      step: 'selectNorm',
      searchQuery
    });

    return showSizNorms(ctx, 0, false, searchQuery);
  }

  if (state.step === 'quantity') {
    const quantity = Number(input.replace(',', '.'));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return ctx.reply('Введите количество целым числом от 1 до 100.');
    }

    return askIssueDate(ctx, state, quantity);
  }

  if (state.step === 'issueDate') {
    const issueDate = parseRuDate(input);
    if (!issueDate) {
      return ctx.reply('Не понял дату. Введите в формате ДД.ММ.ГГГГ или нажмите "Сегодня".');
    }

    return createRequest(ctx, state, issueDate);
  }

  return next();
}

async function approveRequest(ctx, requestId) {
  const adminChatId = String(ctx.chat.id);
  if (!getAdminChatIds().includes(adminChatId)) {
    await ctx.answerCbQuery('Недостаточно прав');
    return;
  }

  const request = await prisma.telegramSizRequest.findUnique({ where: { id: requestId } });

  if (!request || request.status !== 'pending') {
    await ctx.answerCbQuery('Заявка уже обработана или не найдена');
    return;
  }

  const [employee, sizNorm] = await Promise.all([
    prisma.employee.findUnique({ where: { id: request.employeeId } }),
    prisma.sizNorm.findUnique({ where: { id: request.sizNormId } })
  ]);

  if (!employee || !sizNorm) {
    await ctx.answerCbQuery('Сотрудник или СИЗ не найден');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.telegramSizRequest.updateMany({
      where: { id: request.id, status: 'pending' },
      data: {
        status: 'approved',
        adminChatId,
        decidedAt: new Date()
      }
    });

    if (claimed.count === 0) {
      throw new Error('Request was already processed');
    }

    const inventory = await tx.inventory.create({
      data: {
        itemName: sizNorm.name,
        itemType: 'сиз',
        issueDate: request.issueDate,
        quantity: request.quantity,
        status: 'выдан',
        employeeId: employee.id,
        sizNormId: sizNorm.id
      }
    });

    const months = sizNorm.periodType === 'months' ? parseInt(sizNorm.period) : null;
    if (months) {
      const nextReplacementDate = new Date(request.issueDate);
      nextReplacementDate.setMonth(nextReplacementDate.getMonth() + months);

      await tx.inventoryAddon.create({
        data: {
          name: sizNorm.name,
          issueDate: request.issueDate,
          wearPeriodMonths: months,
          nextReplacementDate,
          inventoryId: inventory.id
        }
      });
    }

    return tx.telegramSizRequest.findUnique({ where: { id: request.id } });
  });

  await ctx.answerCbQuery('Подтверждено');
  await ctx.editMessageText(
    `✅ Заявка подтверждена\n\nСотрудник: ${getFullName(employee)}\nСИЗ: ${result.sizNormName}\nКоличество: ${result.quantity}\nДата: ${formatDate(result.issueDate)}`
  );

  await ctx.telegram.sendMessage(
    request.telegramChatId,
    `✅ Ответственный подтвердил получение СИЗ: ${result.sizNormName}, ${result.quantity} шт.`
  );
}

async function rejectRequest(ctx, requestId) {
  const adminChatId = String(ctx.chat.id);
  if (!getAdminChatIds().includes(adminChatId)) {
    await ctx.answerCbQuery('Недостаточно прав');
    return;
  }

  const request = await prisma.telegramSizRequest.findUnique({ where: { id: requestId } });

  if (!request || request.status !== 'pending') {
    await ctx.answerCbQuery('Заявка уже обработана или не найдена');
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const claimed = await tx.telegramSizRequest.updateMany({
      where: { id: request.id, status: 'pending' },
      data: {
        status: 'rejected',
        adminChatId,
        decidedAt: new Date()
      }
    });

    if (claimed.count === 0) {
      throw new Error('Request was already processed');
    }

    return tx.telegramSizRequest.findUnique({ where: { id: request.id } });
  });

  await ctx.answerCbQuery('Отклонено');
  await ctx.editMessageText(
    `❌ Заявка отклонена\n\nСИЗ: ${updated.sizNormName}\nКоличество: ${updated.quantity}\nДата: ${formatDate(updated.issueDate)}`
  );

  await ctx.telegram.sendMessage(
    request.telegramChatId,
    `❌ Ответственный отклонил заявку на СИЗ: ${updated.sizNormName}.`
  );
}

function registerRequestSiz(bot) {
  bot.command('myid', (ctx) => ctx.reply(`Ваш Telegram chat id: ${ctx.chat.id}`));
  bot.command('cancel', (ctx) => {
    pendingRequests.delete(String(ctx.chat.id));
    return ctx.reply('Действие отменено.', getMainKeyboard());
  });
  bot.command('addsiz', startRequest);
  bot.hears(ADD_SIZ_BUTTON, startRequest);
  bot.hears(CANCEL_BUTTON, (ctx) => {
    pendingRequests.delete(String(ctx.chat.id));
    return ctx.reply('Действие отменено.', getMainKeyboard());
  });

  bot.action('sizreq_cancel', async (ctx) => {
    pendingRequests.delete(String(ctx.chat.id));
    await ctx.answerCbQuery('Отменено');
    await ctx.editMessageText('Добавление СИЗ отменено.');
    return ctx.reply('Вы вернулись в главное меню.', getMainKeyboard());
  });

  bot.action('sizreq_search', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const state = pendingRequests.get(chatId);
    if (state) {
      pendingRequests.set(chatId, { ...state, step: 'search', searchQuery: '' });
    }

    await ctx.answerCbQuery();
    return askSearch(ctx, true);
  });

  bot.action('sizreq_all', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const state = pendingRequests.get(chatId);
    if (state) {
      pendingRequests.set(chatId, { ...state, step: 'selectNorm', searchQuery: '' });
    }

    await ctx.answerCbQuery();
    return showSizNorms(ctx, 0, true);
  });

  bot.action(/^sizreq_page_(\d+)$/, async (ctx) => {
    const page = Number(ctx.match[1]);
    const state = pendingRequests.get(String(ctx.chat.id));
    await ctx.answerCbQuery();
    return showSizNorms(ctx, page, true, state?.searchQuery || '');
  });

  bot.action(/^sizreq_pick_(.+)$/, (ctx) => askQuantity(ctx, ctx.match[1]));
  bot.action(/^sizreq_approve_(.+)$/, (ctx) => approveRequest(ctx, ctx.match[1]));
  bot.action(/^sizreq_reject_(.+)$/, (ctx) => rejectRequest(ctx, ctx.match[1]));
  bot.on('text', handleRequestText);
}

module.exports = {
  ADD_SIZ_BUTTON,
  getMainKeyboard,
  registerRequestSiz
};
