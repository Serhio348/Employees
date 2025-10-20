# 🗄️ Настройка базы данных на Railway

## 🎯 **Проблема:**
Railway не может найти базу данных, потому что SQLite файлы не сохраняются между деплоями.

## ✅ **Решение: PostgreSQL на Railway**

### **Шаг 1: Добавьте PostgreSQL плагин в Railway**

1. **Перейдите в ваш проект** на Railway
2. **Нажмите "New"** → **"Database"** → **"Add PostgreSQL"**
3. **Railway автоматически** создаст PostgreSQL базу данных
4. **Скопируйте DATABASE_URL** из переменных окружения

### **Шаг 2: Настройте переменные окружения**

В панели Railway добавьте/обновите переменные:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-for-production-12345
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
```

**Важно:** `DATABASE_URL` будет автоматически создан Railway при добавлении PostgreSQL.

### **Шаг 3: Обновите Prisma конфигурацию**

Prisma схема уже обновлена для PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### **Шаг 4: Запустите миграции**

После деплоя Railway автоматически:
1. ✅ Установит зависимости
2. ✅ Сгенерирует Prisma клиент
3. ✅ Запустит миграции (если настроено)

## 🔧 **Дополнительная настройка (опционально):**

### **Автоматические миграции при деплое:**

Обновите `package.json`:
```json
{
  "scripts": {
    "start": "npm run build && npx prisma generate && npx prisma migrate deploy && node ./server/bin/www"
  }
}
```

### **Создание новой миграции для PostgreSQL:**

```bash
# Локально (для разработки)
npx prisma migrate dev --name init_postgresql

# Или сброс и создание новой
npx prisma migrate reset
npx prisma migrate dev --name init
```

## 📊 **Преимущества PostgreSQL на Railway:**

- ✅ **Постоянное хранение** данных
- ✅ **Автоматические бэкапы**
- ✅ **Масштабируемость**
- ✅ **Безопасность**
- ✅ **Бесплатно** в рамках лимитов Railway

## 🚨 **Важные моменты:**

### **1. Миграции:**
- Railway автоматически запустит `prisma migrate deploy`
- Данные из SQLite не переносятся автоматически

### **2. Переменные окружения:**
- `DATABASE_URL` создается автоматически
- Не нужно вводить вручную

### **3. Локальная разработка:**
- Для локальной разработки используйте SQLite
- Для продакшена - PostgreSQL

## 🔄 **Процесс деплоя:**

1. **Добавьте PostgreSQL** в Railway
2. **Railway автоматически** перезапустит деплой
3. **Prisma создаст** таблицы в PostgreSQL
4. **Приложение запустится** с новой базой данных

## 📝 **Проверка после деплоя:**

1. **Проверьте логи** Railway на наличие ошибок
2. **Откройте приложение** и попробуйте зарегистрироваться
3. **Проверьте базу данных** через Railway Dashboard

---

## 🎉 **Готово!**

После добавления PostgreSQL плагина ваше приложение будет использовать надежную базу данных на Railway.
