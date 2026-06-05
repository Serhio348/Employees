# Учёт СИЗ — сотрудники и инвентарь

Веб-приложение для учёта средств индивидуальной защиты (СИЗ) сотрудников: карточки персонала, инвентарь, нормативы, экспорт, PWA и Telegram-бот для уведомлений и заявок.

**Репозиторий:** https://github.com/Serhio348/Employees

---

## Возможности

### Веб-приложение

- Регистрация и вход (JWT)
- Список сотрудников, добавление и редактирование карточек
- Инвентарь сотрудника: спецодежда, СИЗ, инструмент, оборудование
- Нормативы СИЗ и расчёт сроков замены
- Дополнения к позициям инвентаря (сроки носки)
- Экспорт карточки сотрудника в PDF с фильтром по типам инвентаря
- Тёмная/светлая тема
- Адаптивный интерфейс для мобильных устройств
- **PWA**: установка на главный экран, service worker, офлайн-кэш (Workbox)

### Telegram-бот

- Привязка аккаунта сотрудника по табельному номеру (`/start`)
- Просмотр инвентаря и позиций с истекающим сроком
- Заявка на получение СИЗ из базы нормативов с подтверждением администратором
- Автоматические уведомления (cron, 9:00 Минск / 06:00 UTC):
  - ежемесячный дайджест (1-го числа)
  - просроченные и истекающие сегодня
  - напоминание за 1 день до истечения

---

## Технологический стек

| Слой | Технологии |
|------|------------|
| **Frontend** | React 18, TypeScript, Redux Toolkit, RTK Query, React Router 6, Ant Design 5, Workbox, PWA |
| **Backend** | Node.js, Express, JWT, bcrypt |
| **БД** | PostgreSQL, Prisma ORM |
| **Бот** | Telegraf, node-cron |
| **Деплой** | Railway (Nixpacks), GitHub |
| **Архитектура** | Monorepo (`client/` + `server/`) |

Подробная выборка навыков для CV: [`CV_SKILLS.md`](./CV_SKILLS.md)

---

## Структура проекта

```
Employees/
├── client/                 # React SPA
│   ├── public/             # manifest, иконки PWA
│   └── src/
│       ├── pages/          # employees, employee, inventory, login…
│       ├── components/     # формы, таблицы, layout, PWA
│       └── app/            # Redux store, RTK Query API
├── server/
│   ├── bin/www             # HTTP-сервер
│   ├── app.js              # Express + статика React build
│   ├── controllers/        # REST API
│   ├── routes/
│   ├── middleware/         # JWT auth
│   └── bot/                # Telegram-бот и планировщик
├── prisma/
│   └── schema.prisma       # модели User, Employee, Inventory…
├── scripts/                # ручной запуск уведомлений бота
├── railway.json            # конфиг деплоя Railway
└── package.json            # корневые скрипты (dev, build, start)
```

---

## Переменные окружения

Создайте файл `.env` в **корне проекта** (не коммитится в Git):

```env
# Обязательные
NODE_ENV=development
DATABASE_URL="postgresql://postgres:пароль@localhost:5432/employees_dev"
JWT_SECRET=your-super-secret-jwt-key-here

# Сервер
PORT=5000
JWT_EXPIRES_IN=8h

# CORS (продакшн)
CLIENT_URL=https://ваш-домен.railway.app
# или несколько origin через запятую:
# CORS_ORIGINS=https://app1.example.com,https://app2.example.com

# Telegram-бот (опционально локально)
TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_BOT_DISABLED=true
ADMIN_TELEGRAM_CHAT_ID=123456789
# или несколько админов:
# ADMIN_TELEGRAM_CHAT_IDS=123456789,987654321

# Админ веб-приложения (email через запятую)
ADMIN_EMAIL=admin@example.com
```

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Секрет для подписи токенов |
| `JWT_EXPIRES_IN` | Время жизни JWT (по умолчанию `8h`) |
| `TELEGRAM_BOT_TOKEN` | Токен от [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_BOT_DISABLED` | `true` — не запускать бота локально |
| `ADMIN_TELEGRAM_CHAT_ID(S)` | Chat ID админов для заявок СИЗ |
| `ADMIN_EMAIL(S)` | Email администраторов веб-приложения |

---

## Локальная разработка

### 1. PostgreSQL

```sql
psql -U postgres
CREATE DATABASE employees_dev;
\q
```

### 2. Установка зависимостей

```bash
npm ci
cd client && npm ci && cd ..
```

### 3. Миграции и запуск

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev:local
```

| Сервис | URL |
|--------|-----|
| Клиент | http://localhost:3000 |
| API / сервер | http://localhost:5000 |
| Healthcheck | http://localhost:5000/health |

### Запуск по частям

```bash
npm run server          # только backend (nodemon)
npm run client          # только frontend
npm run dev             # оба процесса (concurrently)
```

### Ручная отправка уведомлений бота

```bash
npm run bot:notify-due
```

### PWA локально

Service worker регистрируется только в **production**-сборке. Для проверки установки приложения:

```bash
cd client && npm run build
# затем открыть production-сборку по HTTPS (деплой или serve -s build)
```

---

## Скрипты npm (корень)

| Команда | Назначение |
|---------|------------|
| `npm run dev` / `dev:local` | Сервер + клиент в development |
| `npm run build` | Сборка React (`client/build`) |
| `npm start` | Build + Prisma + запуск сервера (продакшн) |
| `npm run bot:notify-due` | Разовая рассылка просроченных СИЗ |
| `npm run deploy:staging` | `git push origin development` |
| `npm run deploy:production` | `git push origin main` |

---

## Миграции базы данных

| Команда | Когда использовать |
|---------|-------------------|
| `npx prisma migrate dev --name имя` | Изменили `schema.prisma` локально |
| `npx prisma migrate deploy` | Применить миграции к БД |
| `npx prisma generate` | Перегенерировать Prisma Client |
| `npx prisma studio` | GUI для просмотра данных |

На Railway миграции выполняются автоматически при деплое:

```
npx prisma generate && npx prisma migrate deploy && node ./server/bin/www
```

---

## Деплой (Railway)

1. Подключить репозиторий GitHub к Railway
2. Добавить PostgreSQL plugin
3. Задать переменные окружения (`DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN` и др.)
4. Пуш в `main` → автоматическая сборка и деплой

Сборка: `npm ci` → `npm run build` (React + Prisma).  
Старт: см. `railway.json`.

### Ветки

| Ветка | Назначение |
|-------|------------|
| `development` | Основная разработка |
| `main` | Продакшн на Railway |

```bash
# Разработка
git checkout development
# … изменения …
git commit -m "feat: описание"
git push origin development

# Релиз в продакшн
git checkout main
git merge development
git push origin main
```

---

## API (кратко)

| Префикс | Назначение |
|---------|------------|
| `/api/user` | Регистрация, вход |
| `/api/employees` | CRUD сотрудников |
| `/api/inventory` | Инвентарь |
| `/api/inventory-addon` | Дополнения к позициям |
| `/api/siz-norms` | Нормативы СИЗ |
| `/health` | Проверка работы сервера |

Статика React отдаётся с того же домена; SPA routing через `index.html`.

---

## Безопасность

- Не коммитить `.env` и секреты
- Не использовать продакшн `DATABASE_URL` локально
- Тестировать миграции локально перед пушем в `main`
- `JWT_SECRET` и `TELEGRAM_BOT_TOKEN` — только в переменных окружения Railway

---

## Окружения

```
Локально:    .env → localhost PostgreSQL     (ветка development)
                    ↓ merge + push
Продакшн:    Railway Variables → Railway PG  (ветка main)
```

Локальная БД и продакшн **изолированы** — изменения схемы применяются через Prisma migrations в обоих окружениях независимо.
