const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config({ path: '../.env' });

const app = express();

// Middleware
app.use(logger('dev'));

// CORS настройки для продакшена
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, 'https://*.railway.app'] 
        : 'http://localhost:3000',
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Обслуживание статических файлов React в продакшене
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

// Обработка ошибок JSON парсинга
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ message: 'Неверный формат JSON данных' });
  }
  next();
});

// Healthcheck эндпоинт для Railway
app.get('/health', (req, res) => {
  console.log('Healthcheck requested at:', new Date().toISOString());
  console.log('Server uptime:', process.uptime());
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// API роуты
app.use('/api/user', require("./routes/users"));
app.use('/api/employees', require("./routes/Employees"));
app.use('/api/inventory', require("./routes/Inventory"));
app.use('/api/inventory-addon', require("./routes/InventoryAddon"));
app.use('/api/siz-norms', require("./routes/SizNorms"));

// Обработка React роутинга в продакшене
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    });
}

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;
