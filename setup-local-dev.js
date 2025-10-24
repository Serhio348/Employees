#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Настройка локального окружения для разработки...');

// Создаем .env файл для локальной разработки
const envContent = `# Локальная разработка
NODE_ENV=development
DATABASE_URL=file:./prisma/dev.db
JWT_SECRET=your-super-secret-jwt-key-here-12345
PORT=5000
`;

const envPath = path.join(__dirname, '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ Создан .env файл для локальной разработки');

// Проверяем наличие node_modules
if (!fs.existsSync('node_modules')) {
    console.log('📦 Устанавливаем зависимости...');
    const { execSync } = require('child_process');
    execSync('npm install', { stdio: 'inherit' });
}

if (!fs.existsSync('client/node_modules')) {
    console.log('📦 Устанавливаем зависимости клиента...');
    const { execSync } = require('child_process');
    execSync('cd client && npm install', { stdio: 'inherit' });
}

console.log('🎉 Локальное окружение настроено!');
console.log('');
console.log('Для запуска локальной разработки используйте:');
console.log('  npm run dev:local');
console.log('');
console.log('Для деплоя на staging:');
console.log('  npm run deploy:staging');
console.log('');
console.log('Для деплоя в продакшн:');
console.log('  npm run deploy:production');
