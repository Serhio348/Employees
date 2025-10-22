const https = require('https');
const http = require('http');

console.log('🔍 Проверка статуса Railway PostgreSQL...');

// Функция для проверки доступности хоста
function checkHost(hostname, port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: port,
      timeout: 5000,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      console.log(`✅ ${hostname}:${port} - доступен (статус: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ ${hostname}:${port} - недоступен (${err.message})`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${hostname}:${port} - таймаут`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function checkRailwayStatus() {
  console.log('📡 Проверка доступности Railway PostgreSQL...');
  
  const hostname = 'turntable.proxy.rlwy.net';
  const port = 27091;
  
  console.log(`🔍 Проверяем ${hostname}:${port}...`);
  
  const isAvailable = await checkHost(hostname, port);
  
  if (isAvailable) {
    console.log('✅ Railway PostgreSQL доступен!');
    console.log('💡 Попробуйте снова: node setup-railway-database.js');
  } else {
    console.log('❌ Railway PostgreSQL недоступен');
    console.log('\n🔧 Возможные решения:');
    console.log('1. Проверьте статус в Railway Dashboard');
    console.log('2. Убедитесь, что PostgreSQL сервис запущен');
    console.log('3. Проверьте настройки сети');
    console.log('4. Попробуйте позже - Railway может быть в процессе настройки');
    
    console.log('\n📋 Альтернативные способы:');
    console.log('1. Импорт через Railway Dashboard -> Query');
    console.log('2. Использование Railway CLI');
    console.log('3. Прямое подключение через psql');
  }
}

checkRailwayStatus();
