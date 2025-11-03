const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const app = express();

// Middleware
app.use(logger('dev'));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? true  // Разрешить все домены в продакшене
        : 'http://localhost:3000',
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

// Healthcheck endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API роуты
app.use('/api/user', require("./routes/users"));
app.use('/api/employees', require("./routes/Employees"));
app.use('/api/inventory', require("./routes/Inventory"));
app.use('/api/inventory-addon', require("./routes/InventoryAddon"));
app.use('/api/siz-norms', require("./routes/SizNorms"));

// Serve static files from React build
const buildPath = path.join(__dirname, '../client/build');

// Middleware для установки правильных заголовков кэширования
app.use((req, res, next) => {
  // Для статических файлов с хешами (JS, CSS) - длительное кэширование
  if (/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(req.path)) {
    // Файлы с хешами можно кэшировать долго (они обновляются по хешу)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Для всех остальных (включая HTML) - не кэшировать
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(buildPath, {
  etag: true,
  lastModified: true
}));

// Catch all handler: send back React's index.html file (only for non-API routes and non-file requests)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Skip requests for files with extensions (they should be handled by express.static)
  const hasFileExtension = /\.[^/.]+$/.test(req.path);
  if (hasFileExtension) {
    return next();
  }
  
  // Убедимся, что HTML не кэшируется
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

module.exports = app;
