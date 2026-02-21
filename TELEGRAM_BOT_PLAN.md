  План внедрения Telegram-бота для учёта СИЗ

## Что умеет бот

### Для сотрудника
- `/start` — привязать аккаунт Telegram к своей карточке в системе
- Кнопка **📦 Мой инвентарь** — посмотреть весь свой инвентарь и сроки носки
- Кнопка **⚠️ Что скоро истекает** — только то, что истекает в ближайшие 30 дней

> Команды `/mysiz` и `/expiring` тоже работают, но интерфейс — кнопки.
> После `/start` внизу экрана появляется постоянная клавиатура с двумя кнопками.
> Сотруднику не нужно ничего вводить — просто нажал кнопку.

### Автоматически (без команды)
- **1-го числа каждого месяца** — дайджест: что истекает в этом месяце
- **За 1 день до истечения** — финальное напоминание

### Пример диалога
```
Сотрудник: /mysiz

Бот: 👷 Иван Петров — ваш инвентарь СИЗ:

📦 Каска защитная (выдана 01.03.2024)
   └ Аддон: Подшлемник — срок носки 6 мес.
   └ Осталось: 14 дней ⚠️

📦 Спецовка (выдана 15.01.2024)
   └ Аддон: Куртка утеплённая — срок носки 24 мес.
   └ Осталось: 11 месяцев ✅

📦 Перчатки нитриловые (выдана 10.02.2025)
   └ Аддон: Перчатки — срок носки 1 мес.
   └ Осталось: 3 дня 🔴
```

---

## Структура проекта после внедрения

```
employees/
├── prisma/
│   └── schema.prisma           ← добавить поле telegramChatId в Employee
├── server/
│   ├── bot/
│   │   ├── index.js            ← НОВЫЙ: запуск и настройка бота
│   │   ├── commands/
│   │   │   ├── start.js        ← НОВЫЙ: /start — регистрация
│   │   │   ├── mysiz.js        ← НОВЫЙ: /mysiz — мой инвентарь
│   │   │   └── expiring.js     ← НОВЫЙ: /expiring — скоро истекает
│   │   └── scheduler.js        ← НОВЫЙ: cron ежедневных уведомлений
│   ├── app.js                  ← изменить: запустить бота вместе с сервером
│   └── bin/www                 ← без изменений
├── package.json                ← добавить telegraf, node-cron
└── railway.json                ← без изменений (бот стартует внутри сервера)
```

---

## Шаг 1 — Создать бота в Telegram (делаешь ты, 5 минут)

1. Открыть Telegram, найти [@BotFather](https://t.me/BotFather)
2. Написать `/newbot`
3. Ввести название: `Учёт СИЗ — Белалко`
4. Ввести username: `belalkosiz_bot` (или любой свободный)
5. BotFather выдаст токен вида: `7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. Этот токен добавить в Railway как переменную окружения `TELEGRAM_BOT_TOKEN`
7. Также можно настроить команды через `/setcommands`:
   ```
   start - Привязать мой аккаунт к системе
   mysiz - Мой инвентарь СИЗ и сроки
   expiring - Что скоро истекает
   ```

---

## Шаг 2 — Изменить схему базы данных

**Файл:** `prisma/schema.prisma`

Добавить поле `telegramChatId` в модель `Employee`:

```prisma
model Employee {
  id             String    @id @default(uuid())
  firstName      String
  lastName       String
  surName        String?
  age            Int
  birthDate      DateTime?
  profession     String
  address        String
  employeeNumber String?
  height         Int?
  clothingSize   String?
  shoeSize       String?
  telegramChatId String?   // ← НОВОЕ ПОЛЕ

  user   User   @relation(fields: [userId], references: [id])
  userId String
}
```

Создать и применить миграцию:
```bash
npx prisma migrate dev --name add_telegram_chat_id
```

На Railway миграция применяется автоматически при деплое через:
```
npx prisma migrate deploy
```
(уже есть в `railway.json`)

---

## Шаг 3 — Установить зависимости

В корневом `package.json` добавить:

```json
"telegraf": "^4.16.3",
"node-cron": "^3.0.3"
```

Установить:
```bash
npm install telegraf node-cron
```

**Почему `telegraf`?**
- Самая популярная библиотека для Telegram-ботов на Node.js
- Поддерживает middleware, сессии, кнопки
- Хорошо работает с async/await

---

## Шаг 4 — Создать обработчик команды `/start`

**Файл:** `server/bot/commands/start.js`

Логика:
1. Сотрудник пишет `/start`
2. Бот спрашивает ФИО
3. Система ищет по фамилии + имени (регистронезависимо)
4. Если найден — сохраняет `telegramChatId`, сотрудник привязан
5. Если не найден — просит уточнить

```javascript
const { prisma } = require('../../../prisma/prisma-client');

// Храним состояние ожидания ввода (в памяти, достаточно для MVP)
const waitingForName = new Set();

function registerStart(bot) {
  // Команда /start
  bot.command('start', async (ctx) => {
    const chatId = ctx.chat.id;

    // Проверяем: может уже привязан?
    const existing = await prisma.employee.findFirst({
      where: { telegramChatId: String(chatId) }
    });

    if (existing) {
      return ctx.reply(
        `✅ Вы уже привязаны как ${existing.lastName} ${existing.firstName}.\n` +
        `Используйте /mysiz для просмотра инвентаря.`
      );
    }

    waitingForName.add(chatId);
    ctx.reply(
      '👋 Добро пожаловать в систему учёта СИЗ!\n\n' +
      'Введите ваше *ФИО* (например: Петров Иван Сергеевич):',
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка текстового ввода после /start
  bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;

    if (!waitingForName.has(chatId)) return; // не ждём ввода от этого пользователя

    const input = ctx.message.text.trim();
    waitingForName.delete(chatId);

    // Ищем по ФИО: минимум фамилия, имя опционально
    const parts = input.split(/\s+/);
    const lastName = parts[0];
    const firstName = parts[1] || '';

    const employee = await prisma.employee.findFirst({
      where: {
        lastName: { contains: lastName, mode: 'insensitive' },
        ...(firstName ? { firstName: { contains: firstName, mode: 'insensitive' } } : {})
      }
    });

    if (!employee) {
      waitingForName.add(chatId); // даём ещё попытку
      return ctx.reply(
        '❌ Сотрудник не найден. Проверьте правильность написания ФИО и попробуйте ещё раз.\n\n' +
        '_Пример: Петров Иван_\n\n' +
        'Если возникли проблемы — обратитесь к ответственному за СИЗ.',
        { parse_mode: 'Markdown' }
      );
    }

    // Привязываем
    await prisma.employee.update({
      where: { id: employee.id },
      data: { telegramChatId: String(chatId) }
    });

    // Показываем постоянную клавиатуру с кнопками
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
          resize_keyboard: true,  // компактный размер кнопок
          persistent: true        // кнопки всегда видны
        }
      }
    );
  });
}

module.exports = { registerStart };
```

---

## Шаг 5 — Создать команду `/mysiz`

**Файл:** `server/bot/commands/mysiz.js`

Логика: найти сотрудника по `telegramChatId` → получить его инвентарь с аддонами → отформатировать и отправить.

```javascript
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
    return ctx.reply(`👷 ${employee.lastName} ${employee.firstName}\n\n📭 У вас нет выданных СИЗ.`);
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
}

function registerMySiz(bot) {
  bot.command('mysiz', handleMySiz);
}

module.exports = { registerMySiz, handleMySiz };
```

---

## Шаг 6 — Создать команду `/expiring`

**Файл:** `server/bot/commands/expiring.js`

Показывает только то, что истекает в ближайшие 30 дней.

```javascript
const { prisma } = require('../../../prisma/prisma-client');

// Общая логика — вызывается и командой /expiring, и кнопкой
async function handleExpiring(ctx) {
  const chatId = String(ctx.chat.id);

  const employee = await prisma.employee.findFirst({
    where: { telegramChatId: chatId }
  });

  if (!employee) {
    return ctx.reply('⚠️ Вы не привязаны к системе. Используйте /start.');
  }

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  // Двухэтапный запрос (inventoryId без Prisma-relation)
  const inventory = await prisma.inventory.findMany({
    where: { employeeId: employee.id, status: 'выдан' }
  });
  const inventoryIds = inventory.map(i => i.id);

  const expiring = await prisma.inventoryAddon.findMany({
    where: {
      inventoryId: { in: inventoryIds },
      nextReplacementDate: { lte: in30Days }
    },
    orderBy: { nextReplacementDate: 'asc' }
  });

  if (expiring.length === 0) {
    return ctx.reply('✅ Отлично! В ближайшие 30 дней у вас ничего не истекает.');
  }

  const lines = [`⚠️ *${employee.lastName} ${employee.firstName}* — скоро истекает:\n`];

  for (const addon of expiring) {
    const days = Math.ceil((new Date(addon.nextReplacementDate) - new Date()) / 86400000);
    const emoji = days <= 0 ? '🔴' : days <= 7 ? '🔴' : '⚠️';
    const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
    lines.push(`${emoji} *${addon.name}* — ${days <= 0 ? 'ПРОСРОЧЕНО' : `через ${days} дн.`} (${dateStr})`);
  }

  ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' });
}

function registerExpiring(bot) {
  bot.command('expiring', handleExpiring);
}

module.exports = { registerExpiring, handleExpiring };
```

> **Примечание по связям:** В схеме `inventoryId` в `InventoryAddon` — простая строка без Prisma-relation.
> Для `expiring` нужно будет сделать двухэтапный запрос:
> сначала получить IDs инвентаря сотрудника, затем найти аддоны.
> Это учтено при реализации.

---

## Шаг 7 — Создать планировщик уведомлений

**Логика уведомлений:**
- **1-го числа каждого месяца в 9:00** — дайджест: что истекает в этом месяце
- **За 1 день до истечения в 9:00** — финальное напоминание

Максимум **2 сообщения в год на каждый предмет**. Если в этом месяце ничего не истекает — тишина.

**Файл:** `server/bot/scheduler.js`

```javascript
const cron = require('node-cron');
const { prisma } = require('../../prisma/prisma-client');

// Вспомогательная функция отправки с обработкой блокировки
async function sendMessage(bot, employee, text) {
  try {
    await bot.telegram.sendMessage(employee.telegramChatId, text, { parse_mode: 'Markdown' });
    console.log(`[Scheduler] Отправлено: ${employee.lastName} ${employee.firstName}`);
  } catch (err) {
    if (err.code === 403) {
      // Пользователь заблокировал бота — очищаем chatId
      await prisma.employee.update({
        where: { id: employee.id },
        data: { telegramChatId: null }
      });
      console.log(`[Scheduler] Бот заблокирован: ${employee.lastName}`);
    }
  }
}

// Получить инвентарь сотрудника (ID-шники)
async function getInventoryIds(employeeId) {
  const inventory = await prisma.inventory.findMany({
    where: { employeeId, status: 'выдан' }
  });
  return inventory.map(i => i.id);
}

function startScheduler(bot) {

  // ─── 1. Ежемесячный дайджест — 1-го числа в 9:00 (06:00 UTC = 09:00 Минск) ───
  cron.schedule('0 6 1 * *', async () => {
    console.log('[Scheduler] Ежемесячный дайджест СИЗ...');

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const monthName  = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

      const employees = await prisma.employee.findMany({
        where: { telegramChatId: { not: null } }
      });

      for (const employee of employees) {
        const inventoryIds = await getInventoryIds(employee.id);
        if (inventoryIds.length === 0) continue;

        // Аддоны, истекающие в этом месяце
        const expiring = await prisma.inventoryAddon.findMany({
          where: {
            inventoryId: { in: inventoryIds },
            nextReplacementDate: { gte: monthStart, lte: monthEnd }
          },
          orderBy: { nextReplacementDate: 'asc' }
        });

        if (expiring.length === 0) continue; // в этом месяце ничего — молчим

        const lines = [
          `📅 *${employee.lastName} ${employee.firstName}* — дайджест СИЗ на ${monthName}:\n`
        ];

        for (const addon of expiring) {
          const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
          const days = Math.ceil((new Date(addon.nextReplacementDate) - now) / 86400000);
          const emoji = days <= 7 ? '🔴' : '⚠️';
          lines.push(`${emoji} *${addon.name}* — истекает ${dateStr}`);
        }

        lines.push(`\nПодробнее: /mysiz`);

        await sendMessage(bot, employee, lines.join('\n'));
        await new Promise(r => setTimeout(r, 50)); // пауза между сообщениями
      }

      console.log('[Scheduler] Ежемесячный дайджест завершён.');
    } catch (err) {
      console.error('[Scheduler] Ошибка дайджеста:', err);
    }
  });

  // ─── 2. Финальное напоминание — за 1 день до истечения ───
  // Запускается каждый день в 9:00, но отправляет только тем у кого завтра истекает
  cron.schedule('0 6 * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0);
      const dayEnd   = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59);

      const employees = await prisma.employee.findMany({
        where: { telegramChatId: { not: null } }
      });

      for (const employee of employees) {
        const inventoryIds = await getInventoryIds(employee.id);
        if (inventoryIds.length === 0) continue;

        const expiring = await prisma.inventoryAddon.findMany({
          where: {
            inventoryId: { in: inventoryIds },
            nextReplacementDate: { gte: dayStart, lte: dayEnd }
          }
        });

        if (expiring.length === 0) continue;

        const lines = [
          `🔴 *${employee.lastName} ${employee.firstName}*, завтра истекает:\n`
        ];

        for (const addon of expiring) {
          const dateStr = new Date(addon.nextReplacementDate).toLocaleDateString('ru-RU');
          lines.push(`❗ *${addon.name}* — ${dateStr}`);
        }

        lines.push(`\nОбратитесь к ответственному за СИЗ.`);

        await sendMessage(bot, employee, lines.join('\n'));
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (err) {
      console.error('[Scheduler] Ошибка финального напоминания:', err);
    }
  });

  console.log('[Bot] Планировщик запущен: дайджест 1-го числа + напоминание за 1 день');
}

module.exports = { startScheduler };
```

---

## Шаг 8 — Точка входа бота

**Файл:** `server/bot/index.js`

```javascript
const { Telegraf } = require('telegraf');
const { registerStart } = require('./commands/start');
const { registerMySiz, handleMySiz } = require('./commands/mysiz');
const { registerExpiring, handleExpiring } = require('./commands/expiring');
const { startScheduler } = require('./scheduler');

function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN не задан — бот не запущен');
    return null;
  }

  const bot = new Telegraf(token);

  // Регистрация команд
  registerStart(bot);
  registerMySiz(bot);
  registerExpiring(bot);

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
      '/expiring — что скоро истекает',
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
  });

  // Обработка ошибок
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
```

---

## Шаг 9 — Подключить бота к серверу

**Файл:** `server/app.js` — добавить в начало:

```javascript
// Запуск Telegram-бота (не блокирует HTTP-сервер)
const { startBot } = require('./bot');
startBot();
```

Добавить сразу после `require('dotenv').config();` в начале файла.

---

## Шаг 10 — Добавить кнопку привязки Telegram в веб-приложение (опционально)

В карточке сотрудника показывать статус привязки:

- Если `telegramChatId` есть → зелёный значок "Telegram привязан"
- Если нет → подсказка "Сотрудник может привязать Telegram через бот @belalkosiz_bot"

Это делается через новое поле в API ответе — только показываем наличие/отсутствие `telegramChatId` (сам ID не передаём на фронт).

---

## Шаг 11 — Переменные окружения

### Локально (файл `.env` в корне):
```env
TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### На Railway:
1. Открыть проект на railway.app
2. Variables → Add Variable
3. `TELEGRAM_BOT_TOKEN` = ваш токен от BotFather

---

## Шаг 12 — Деплой и проверка

```bash
# 1. Применить миграцию локально
npx prisma migrate dev --name add_telegram_chat_id

# 2. Проверить бота локально
npm run dev  # бот запустится вместе с сервером

# 3. Открыть Telegram, написать боту /start
# 4. Убедиться что привязка работает

# 5. Закоммитить и запушить
git add -A && git commit -m "feat: add Telegram bot for SIZ notifications"
git push origin development
# → сделать PR в main → Railway автоматически задеплоит
```

---

## Порядок реализации (чек-лист)

```
[ ] Шаг 1  — Создать бота через @BotFather, получить токен
[ ] Шаг 2  — Добавить telegramChatId в schema.prisma, запустить миграцию
[ ] Шаг 3  — npm install telegraf node-cron
[ ] Шаг 4  — Создать server/bot/commands/start.js
[ ] Шаг 5  — Создать server/bot/commands/mysiz.js
[ ] Шаг 6  — Создать server/bot/commands/expiring.js
[ ] Шаг 7  — Создать server/bot/scheduler.js
[ ] Шаг 8  — Создать server/bot/index.js
[ ] Шаг 9  — Подключить бота в server/app.js
[ ] Шаг 10 — Добавить TELEGRAM_BOT_TOKEN в .env
[ ] Шаг 11 — Протестировать локально
[ ] Шаг 12 — Добавить токен на Railway, задеплоить
[ ] Шаг 13 — Протестировать на prod: /start → /mysiz → дождаться уведомления
```

---

## Важные нюансы

### Часовой пояс
Railway сервер работает в UTC. 9:00 по Минску (UTC+3) = 06:00 UTC:
```javascript
cron.schedule('0 6 1 * *', ...) // 06:00 UTC = 09:00 Минск — дайджест 1-го числа
cron.schedule('0 6 * * *', ...) // 06:00 UTC = 09:00 Минск — напоминание за 1 день
```

### Частота уведомлений
СИЗ выдаётся раз в год, поэтому уведомлений немного:
- **Дайджест** — 1 раз в месяц, только если в этом месяце что-то истекает
- **Напоминание** — 1 раз, ровно за 1 день до истечения
- Итого: максимум **2 сообщения в год** на каждый предмет

### Ограничения Telegram Bot API
- Нельзя написать пользователю первым, пока он не написал боту `/start`
- Именно поэтому сотрудник должен сам инициировать привязку через `/start`

### Безопасность
- Бот знает только то, что числится за конкретным сотрудником
- Один Telegram-аккаунт = один сотрудник
- Данные других сотрудников недоступны

### Масштабирование
При большом числе сотрудников рассылку нужно делать с паузами:
```javascript
await new Promise(resolve => setTimeout(resolve, 50)); // 50мс между сообщениями
```
Telegram ограничивает: не более 30 сообщений в секунду.
```

---

## Стоимость

| Компонент | Стоимость |
|-----------|-----------|
| Telegram Bot API | Бесплатно |
| telegraf (библиотека) | Бесплатно |
| node-cron | Бесплатно |
| Railway (дополнительный ресурс) | ~0 (бот внутри существующего сервера) |
| **Итого** | **0 руб/мес** |
