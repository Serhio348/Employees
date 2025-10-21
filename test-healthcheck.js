const http = require('http');

console.log('🧪 Тестирование healthcheck...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`📊 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ Healthcheck работает!');
    } else {
      console.log('❌ Healthcheck не работает!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка:', error.message);
  console.log('💡 Убедитесь, что сервер запущен на порту 5000');
});

req.end();
