# Управление сотрудниками и инвентарем СИЗ

## Технологический стек

- **Frontend:** React 18, TypeScript, Redux Toolkit (RTK Query), Ant Design 5, React Router 6
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL
- **Deployment:** Railway
- **Архитектура:** Monorepo (client + server)

---

## Локальная разработка

### Настройка окружения

**1. Создать локальную базу данных PostgreSQL:**

```sql
psql -U postgres
CREATE DATABASE employees_dev;
\q
```

**2. Создать файл `.env` в корне проекта:**

```env
NODE_ENV=development
DATABASE_URL="postgresql://postgres:ваш_пароль@localhost:5432/employees_dev"
JWT_SECRET=your-super-secret-jwt-key-here-12345
PORT=5000
```

> `.env` не коммитится в Git — он в `.gitignore`

**3. Применить миграции и запустить:**

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev:local
```

Приложение доступно по адресам:
- Клиент: http://localhost:3000
- Сервер: http://localhost:5000

### Запуск по частям

```bash
npm run server   # только сервер
npm run client   # только клиент
```

---

## Рабочий процесс (workflow)

### Ветки

| Ветка | Назначение |
|-------|------------|
| `main` | Продакшн — Railway деплоит автоматически при пуше |
| `development` | Разработка — всегда работать здесь |

### Разработка новой функции

```bash
# 1. Убедиться что находишься в development
git checkout development

# 2. Внести изменения и протестировать локально
npm run dev:local

# 3. Если изменилась схема Prisma — создать миграцию
npx prisma migrate dev --name название_миграции

# 4. Закоммитить
git add .
git commit -m "feat: описание изменений"
git push origin development
```

### Деплой в продакшн

```bash
git checkout main
git merge development
git push origin main
```

Railway автоматически пересоберёт приложение, применит миграции и перезапустит сервис.

---

## Миграции базы данных

| Команда | Когда использовать |
|---------|-------------------|
| `npx prisma migrate dev --name name` | При изменении schema.prisma локально |
| `npx prisma migrate deploy` | Применить существующие миграции к локальной БД |
| `npx prisma generate` | Перегенерировать Prisma Client |

На Railway миграции применяются **автоматически** при деплое через команду в `railway.json`:

```
npx prisma generate && npx prisma migrate deploy && node ./server/bin/www
```

---

## Правила безопасности

- Всегда работать в ветке `development`, не в `main`
- Не коммитить `.env` файл
- Не использовать продакшн `DATABASE_URL` локально
- Тестировать миграции локально перед пушем
- Не пушить в `main` без проверки

---

## Структура окружений

```
Локально:   .env → localhost:5432/employees_dev  (ветка: development)
                        ↓ push to main
Продакшн:   Railway Variables → Railway PostgreSQL (ветка: main)
```

Локальные изменения БД **не влияют** на продакшн — Railway использует свою отдельную базу данных.
