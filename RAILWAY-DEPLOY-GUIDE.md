# 🚀 Railway Deploy Guide - С существующими данными

## 📋 **Пошаговая инструкция**

### **1. Создайте проект в Railway**
1. Откройте https://railway.app
2. Войдите через GitHub
3. Нажмите **"New Project"**
4. Выберите **"Deploy from GitHub repo"**
5. Выберите репозиторий `Serhio348/Employees`

### **2. Добавьте PostgreSQL базу данных**
1. В вашем проекте нажмите **"+ New"**
2. Выберите **"Database"** → **"PostgreSQL"**
3. Railway создаст базу данных и добавит `DATABASE_URL`

### **3. Настройте переменные окружения**
В настройках вашего веб-сервиса добавьте:
```
JWT_SECRET=your-secret-key-here
```

**DATABASE_URL** будет добавлен автоматически.

### **4. Деплой**
Railway автоматически:
- ✅ Установит зависимости
- ✅ Соберет React приложение
- ✅ Сгенерирует Prisma клиент
- ✅ Применит миграции
- ✅ Создаст таблицы
- ✅ Запустит приложение

### **5. Импорт существующих данных**

#### **Вариант A: Через Railway CLI**
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите в аккаунт
railway login

# Подключитесь к проекту
railway link

# Установите DATABASE_URL локально
railway variables

# Импортируйте данные
node import-to-railway.js
```

#### **Вариант B: Через Railway Dashboard**
1. Получите `DATABASE_URL` из Railway
2. Обновите локальный `.env` файл
3. Запустите: `node import-to-railway.js`

### **6. Проверка деплоя**
- ✅ **Healthcheck**: `https://your-domain.railway.app/health`
- ✅ **Главная страница**: `https://your-domain.railway.app/`
- ✅ **API**: `https://your-domain.railway.app/api/employees`

## 📊 **Экспортированные данные:**
- 👥 **Пользователи**: 1
- 👷 **Сотрудники**: 1
- 📦 **Инвентарь**: 0
- 🔧 **Дополнения**: 0
- 📏 **Нормы размеров**: 0

## 🎯 **Результат:**
- ✅ **Приложение** развернуто на Railway
- ✅ **PostgreSQL** база данных создана
- ✅ **Существующие данные** импортированы
- ✅ **Домен** готов к использованию

## 🔧 **Полезные команды:**
```bash
# Просмотр данных
npm run db:studio

# Проверка подключения
node -e "console.log(process.env.DATABASE_URL)"

# Импорт данных
node import-to-railway.js
```

**Готово к деплою!** 🎉✨
