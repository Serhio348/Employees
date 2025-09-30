const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config({ path: '../.env' });

const app = express();

// Middleware
app.use(logger('dev'));
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Обработка ошибок JSON парсинга
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err.message);
    return res.status(400).json({ message: 'Неверный формат JSON данных' });
  }
  next();
});

// API роуты
app.use('/api/user', require("./routes/users"));
app.use('/api/employees', require("./routes/Employees"));
app.use('/api/inventory', require("./routes/Inventory"));
app.use('/api/inventory-addon', require("./routes/InventoryAddon"));
app.use('/api/siz-norms', require("./routes/SizNorms"));


// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;
