# 🚀 Деплой приложения Employees

## 📋 Требования

- Docker
- Docker Compose
- Git

## 🛠️ Локальный деплой

### 1. Клонирование репозитория
```bash
git clone https://github.com/Serhio348/Employees.git
cd Employees
```

### 2. Запуск через Docker Compose
```bash
# Сделать скрипт исполняемым (Linux/Mac)
chmod +x deploy.sh

# Запустить деплой
./deploy.sh
```

### 3. Ручной запуск
```bash
# Создать директорию для логов
mkdir -p logs

# Собрать и запустить
docker-compose up --build -d

# Проверить статус
docker-compose ps

# Посмотреть логи
docker-compose logs -f
```

## 🌐 Доступ к приложению

После успешного деплоя приложение будет доступно по адресу:
- **Frontend**: http://localhost:8000
- **API**: http://localhost:8000/api

## 📊 Управление

### Просмотр логов
```bash
docker-compose logs -f
```

### Остановка приложения
```bash
docker-compose down
```

### Перезапуск
```bash
docker-compose restart
```

### Обновление
```bash
git pull
docker-compose down
docker-compose up --build -d
```

## 🔧 Конфигурация

### Переменные окружения
- `NODE_ENV=production`
- `PORT=8000`

### Порты
- **8000**: Основное приложение

### Тома
- `./prisma/dev.db`: База данных SQLite
- `./logs`: Логи приложения

## 🐳 Docker образ

### Сборка образа
```bash
docker build -t employees-app .
```

### Запуск контейнера
```bash
docker run -p 8000:8000 -v $(pwd)/prisma/dev.db:/app/prisma/dev.db employees-app
```

## 📝 Логи и мониторинг

Логи сохраняются в директории `./logs/`:
- `err.log` - ошибки
- `out.log` - стандартный вывод
- `combined.log` - все логи

## 🚨 Устранение проблем

### Проблема с портом
Если порт 8000 занят, измените в `docker-compose.yml`:
```yaml
ports:
  - "8001:8000"  # Используйте другой порт
```

### Проблема с базой данных
Убедитесь, что файл `prisma/dev.db` существует и доступен для записи.

### Проблема с правами доступа
```bash
sudo chown -R $USER:$USER .
```

## 🔄 Обновление

1. Остановите приложение: `docker-compose down`
2. Обновите код: `git pull`
3. Пересоберите и запустите: `docker-compose up --build -d`

## 📞 Поддержка

При возникновении проблем проверьте:
1. Логи: `docker-compose logs`
2. Статус контейнеров: `docker-compose ps`
3. Доступность портов: `netstat -tulpn | grep 8000`
