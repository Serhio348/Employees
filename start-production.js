const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const app = express();

// Настройка для production
const PORT = process.env.PORT || 5000;

// Middleware
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API роуты
app.use('/api/user', require("./routes/Users"));
app.use('/api/employees', require("./routes/Employees"));
app.use('/api/inventory', require("./routes/Inventory"));
app.use('/api/inventory-addon', require("./routes/InventoryAddon"));

// Обслуживание статических файлов React
app.use(express.static(path.join(__dirname, 'client/build')));

// Обработка React роутинга, возврат всех запросов к React приложению
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🌐 Приложение доступно по адресу: http://localhost:${PORT}`);
  console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`);
});
