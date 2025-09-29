#!/bin/bash

# Скрипт для деплоя приложения Employees (без Docker)

echo "🚀 Начинаем деплой приложения Employees..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js 18+."
    exit 1
fi

# Проверяем версию Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Требуется Node.js версии 18 или выше. Текущая версия: $(node -v)"
    exit 1
fi

# Проверяем наличие npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен."
    exit 1
fi

# Проверяем наличие PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Устанавливаем PM2..."
    npm install -g pm2
fi

# Создаем директорию для логов
mkdir -p logs

# Устанавливаем зависимости
echo "📦 Устанавливаем зависимости..."
npm install

# Устанавливаем зависимости клиента
echo "📦 Устанавливаем зависимости клиента..."
cd client
npm install
cd ..

# Создаем production build
echo "🔨 Создаем production build..."
cd client
npm run build
cd ..

# Останавливаем существующий процесс
echo "🛑 Останавливаем существующий процесс..."
pm2 stop employees-app 2>/dev/null || true
pm2 delete employees-app 2>/dev/null || true

# Запускаем приложение
echo "🚀 Запускаем приложение..."
pm2 start ecosystem.config.js

# Ждем запуска
echo "⏳ Ждем запуска приложения..."
sleep 5

# Проверяем статус
echo "📊 Проверяем статус приложения..."
pm2 status

# Проверяем логи
echo "📝 Последние логи:"
pm2 logs employees-app --lines 10

echo "✅ Деплой завершен!"
echo "🌐 Приложение доступно по адресу: http://localhost:8000"
echo "📊 Для просмотра логов: pm2 logs employees-app"
echo "🛑 Для остановки: pm2 stop employees-app"
echo "🔄 Для перезапуска: pm2 restart employees-app"
