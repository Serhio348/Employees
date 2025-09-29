# Используем Node.js 18 как базовый образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY client/package*.json ./client/

# Устанавливаем зависимости
RUN npm install
RUN cd client && npm install

# Копируем исходный код
COPY . .

# Создаем production build клиента
RUN cd client && npm run build

# Устанавливаем PM2 для управления процессами
RUN npm install -g pm2

# Создаем конфигурацию PM2
COPY ecosystem.config.js ./

# Открываем порт 8000
EXPOSE 8000

# Запускаем приложение через PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
