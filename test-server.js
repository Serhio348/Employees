const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Обслуживание статических файлов React
app.use(express.static(path.join(__dirname, 'client/build')));

// Простой API endpoint для тестирования
app.get('/api/test', (req, res) => {
  res.json({ message: 'API работает!', timestamp: new Date().toISOString() });
});

// Обработка React роутинга
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Тестовый сервер запущен на порту ${PORT}`);
  console.log(`🌐 Приложение доступно по адресу: http://localhost:${PORT}`);
});
