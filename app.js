const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const app = express();

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
app.use('/api/siz-norms', require("./routes/SizNorms"));


// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;
