#!/bin/bash

# Скрипт для деплоя приложения Employees

echo "🚀 Начинаем деплой приложения Employees..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Пожалуйста, установите Docker."
    exit 1
fi

# Проверяем наличие docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Пожалуйста, установите Docker Compose."
    exit 1
fi

# Создаем директорию для логов
mkdir -p logs

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose down

# Собираем образ
echo "🔨 Собираем Docker образ..."
docker-compose build --no-cache

# Запускаем приложение
echo "🚀 Запускаем приложение..."
docker-compose up -d

# Ждем запуска
echo "⏳ Ждем запуска приложения..."
sleep 10

# Проверяем статус
echo "📊 Проверяем статус контейнеров..."
docker-compose ps

# Проверяем логи
echo "📝 Последние логи:"
docker-compose logs --tail=20

echo "✅ Деплой завершен!"
echo "🌐 Приложение доступно по адресу: http://localhost:8000"
echo "📊 Для просмотра логов: docker-compose logs -f"
echo "🛑 Для остановки: docker-compose down"
