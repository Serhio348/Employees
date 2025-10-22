# 🗄️ Настройка Railway PostgreSQL базы данных

## 📋 **Получение DATABASE_URL из Railway**

### **1. Войдите в Railway Dashboard**
- Откройте https://railway.app
- Найдите ваш проект
- Откройте PostgreSQL сервис

### **2. Скопируйте DATABASE_URL**
- В PostgreSQL сервисе найдите вкладку **"Variables"**
- Скопируйте значение `DATABASE_URL`
- Пример: `postgresql://postgres:password@postgres.railway.internal:5432/railway`

### **3. Установите DATABASE_URL локально**

#### **Вариант A: Через .env файл**
Создайте или обновите `.env` файл:
```bash
DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"
JWT_SECRET="your-secret-key-here"
```

#### **Вариант B: Через переменную окружения**
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"

# Windows CMD
set DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
```

### **4. Импортируйте данные**
```bash
node setup-railway-database.js
```

## ✅ **Что произойдет:**

1. **Проверка подключения** к Railway PostgreSQL
2. **Проверка существующих данных** в базе
3. **Импорт данных** из локального экспорта (если база пустая)
4. **Финальная статистика** импортированных данных

## 📊 **Ожидаемый результат:**
- 👥 **Пользователи**: 1
- 👷 **Сотрудники**: 1
- 📦 **Инвентарь**: 0
- 🔧 **Дополнения**: 0
- 📏 **Нормы размеров**: 0

## 🔧 **Полезные команды:**

```bash
# Проверка подключения
node -e "console.log(process.env.DATABASE_URL)"

# Просмотр данных через Prisma Studio
npm run db:studio

# Проверка таблиц
npx prisma db pull
```

## 🚨 **Если возникли проблемы:**

1. **Проверьте DATABASE_URL** - должен быть полным
2. **Проверьте подключение** - Railway должен быть доступен
3. **Проверьте миграции** - `npx prisma migrate deploy`
4. **Проверьте Prisma клиент** - `npx prisma generate`

**После успешного импорта данные будут доступны в Railway!** 🎉✨
