# 🚀 Деплой приложения Employees

## 📦 Production Build

Приложение готово к деплою! Все необходимые файлы созданы.

### ✅ Что готово:

1. **Production Build клиента** - `client/build/`
2. **Production сервер** - `start-production.js`
3. **PM2 конфигурация** - `ecosystem.config.js`
4. **Docker файлы** - `Dockerfile`, `docker-compose.yml`
5. **Скрипты деплоя** - `deploy-production.sh`, `deploy-production.bat`

## 🛠️ Способы деплоя

### 1. Локальный деплой с PM2 (Рекомендуется)

```bash
# Установить PM2 глобально
npm install -g pm2

# Запустить деплой
./deploy-production.sh  # Linux/Mac
# или
deploy-production.bat   # Windows
```

### 2. Docker деплой

```bash
# Собрать и запустить
docker-compose up --build -d

# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs -f
```

### 3. Ручной запуск

```bash
# Установить зависимости
npm install
cd client && npm install && cd ..

# Создать build
cd client && npm run build && cd ..

# Запустить сервер
node start-production.js
```

## 📁 Структура проекта

```
employees/
├── client/
│   ├── build/              # Production build React
│   └── src/                # Исходный код React
├── controllers/            # Backend контроллеры
├── routes/                 # API роуты
├── prisma/                 # База данных и миграции
├── logs/                   # Логи приложения
├── start-production.js     # Production сервер
├── ecosystem.config.js     # PM2 конфигурация
├── Dockerfile             # Docker образ
├── docker-compose.yml     # Docker Compose
└── deploy-*.sh/bat        # Скрипты деплоя
```

## 🌐 Доступ к приложению

После успешного деплоя:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

## 📊 Управление

### PM2 команды:
```bash
pm2 start ecosystem.config.js    # Запуск
pm2 stop employees-app          # Остановка
pm2 restart employees-app        # Перезапуск
pm2 logs employees-app           # Логи
pm2 status                       # Статус
```

### Docker команды:
```bash
docker-compose up -d             # Запуск
docker-compose down              # Остановка
docker-compose restart           # Перезапуск
docker-compose logs -f           # Логи
```

## 🔧 Конфигурация

### Переменные окружения:
- `NODE_ENV=production`
- `PORT=5000`

### Порты:
- **5000**: Основное приложение

### Тома (Docker):
- `./prisma/dev.db`: База данных SQLite
- `./logs`: Логи приложения

## 📝 Логи

Логи сохраняются в:
- `./logs/err.log` - ошибки
- `./logs/out.log` - стандартный вывод
- `./logs/combined.log` - все логи

## 🚨 Устранение проблем

### Проблема с портом:
Измените порт в `start-production.js`:
```javascript
const PORT = process.env.PORT || 5001;  // Другой порт
```

### Проблема с правами:
```bash
chmod +x deploy-production.sh
```

### Проблема с PM2:
```bash
pm2 kill
pm2 start ecosystem.config.js
```

## 🔄 Обновление

1. Остановить: `pm2 stop employees-app`
2. Обновить код: `git pull`
3. Пересобрать: `cd client && npm run build && cd ..`
4. Запустить: `pm2 start ecosystem.config.js`

## 📞 Поддержка

При проблемах проверьте:
1. Логи: `pm2 logs employees-app`
2. Статус: `pm2 status`
3. Порты: `netstat -tulpn | grep 5000`

---

## 🎯 Готово к продакшену!

Приложение полностью готово к деплою со всеми необходимыми файлами и конфигурациями.
