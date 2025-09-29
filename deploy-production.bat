@echo off
echo 🚀 Начинаем деплой приложения Employees...

REM Проверяем наличие Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен. Пожалуйста, установите Node.js 18+.
    pause
    exit /b 1
)

REM Проверяем наличие npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm не установлен.
    pause
    exit /b 1
)

REM Проверяем наличие PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Устанавливаем PM2...
    npm install -g pm2
)

REM Создаем директорию для логов
if not exist logs mkdir logs

REM Устанавливаем зависимости
echo 📦 Устанавливаем зависимости...
npm install

REM Устанавливаем зависимости клиента
echo 📦 Устанавливаем зависимости клиента...
cd client
npm install
cd ..

REM Создаем production build
echo 🔨 Создаем production build...
cd client
npm run build
cd ..

REM Останавливаем существующий процесс
echo 🛑 Останавливаем существующий процесс...
pm2 stop employees-app 2>nul
pm2 delete employees-app 2>nul

REM Запускаем приложение
echo 🚀 Запускаем приложение...
pm2 start ecosystem.config.js

REM Ждем запуска
echo ⏳ Ждем запуска приложения...
timeout /t 5 /nobreak >nul

REM Проверяем статус
echo 📊 Проверяем статус приложения...
pm2 status

REM Проверяем логи
echo 📝 Последние логи:
pm2 logs employees-app --lines 10

echo ✅ Деплой завершен!
echo 🌐 Приложение доступно по адресу: http://localhost:8000
echo 📊 Для просмотра логов: pm2 logs employees-app
echo 🛑 Для остановки: pm2 stop employees-app
echo 🔄 Для перезапуска: pm2 restart employees-app
pause
