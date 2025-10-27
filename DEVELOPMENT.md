# 🚀 Руководство по разработке

## Безопасная разработка для продакшн

### 🌟 Workflow разработки

#### 1. **Локальная разработка**
```bash
# Запуск локального сервера разработки
npm run dev:local

# Или отдельно:
npm run server  # Только сервер
npm run client  # Только клиент
```

#### 2. **Тестирование на staging**
```bash
# Деплой на staging (безопасно)
npm run deploy:staging
```

#### 3. **Деплой в продакшн**
```bash
# Сначала протестируйте на staging!
# Затем мерж в main и деплой
git checkout main
git merge development
npm run deploy:production
```

### 📁 Структура веток

- **`main`** - продакшн (стабильная версия)
- **`development`** - разработка (тестирование)

### 🔧 Настройка окружения

#### Локальная разработка:
```bash
# Автоматическая настройка
node setup-local-dev.js

# Или вручную создайте .env файл:
NODE_ENV=development
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-super-secret-jwt-key-here-12345
PORT=5000
```

#### Railway настройки:
- **Production**: ветка `main`
- **Staging**: ветка `development`

### 🛡️ Правила безопасности

1. **ВСЕГДА работайте в ветке `development`**
2. **Тестируйте локально перед коммитом**
3. **Деплойте на staging для финального тестирования**
4. **Только после успешного тестирования мержите в `main`**

### 🚨 Важно!

- **НЕ коммитьте в `main` напрямую**
- **НЕ деплойте в продакшн без тестирования на staging**
- **Всегда проверяйте работоспособность на staging**

### 📝 Полезные команды

```bash
# Создание новой ветки для фичи
git checkout -b feature/new-feature

# Возврат к development
git checkout development

# Просмотр статуса
git status
git branch

# Синхронизация с удаленным репозиторием
git pull origin development
```

### 🔍 Отладка

```bash
# Логи сервера
npm run server

# Логи клиента
npm run client

# Полные логи
npm run dev:local
```

### 📊 Мониторинг

- **Production**: https://your-app.railway.app
- **Staging**: https://your-staging-app.railway.app
- **Локально**: http://localhost:3000 (клиент), http://localhost:5000 (сервер)
