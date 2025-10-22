const { PrismaClient } = require('@prisma/client');

console.log('🔍 Тестирование подключения к Railway PostgreSQL...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('📡 Создание Prisma клиента...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    console.log('📡 Попытка подключения...');
    
    // Простой запрос для проверки подключения
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Результат запроса:', result);
    
    // Проверяем существующие таблицы
    console.log('📋 Проверка таблиц...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📋 Найденные таблицы:', tables);
    
    // Проверяем данные в таблицах
    console.log('📊 Проверка данных...');
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    console.log(`👥 Пользователи: ${userCount}`);
    console.log(`👷 Сотрудники: ${employeeCount}`);
    
    console.log('✅ Подключение к Railway PostgreSQL успешно!');
    console.log('🗄️ База данных готова для работы');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Ошибка подключения к Railway PostgreSQL:');
    console.error('Тип ошибки:', error.constructor.name);
    console.error('Сообщение:', error.message);
    console.error('Код ошибки:', error.code);
    
    console.log('\n💡 Возможные решения:');
    console.log('1. Проверьте, что Railway PostgreSQL сервис запущен');
    console.log('2. Убедитесь, что DATABASE_URL правильный');
    console.log('3. Проверьте интернет-соединение');
    console.log('4. Попробуйте позже - Railway может быть в процессе настройки');
    
    console.log('\n🔧 Проверьте в Railway Dashboard:');
    console.log('- PostgreSQL сервис должен быть "Running"');
    console.log('- В логах не должно быть ошибок');
    console.log('- DATABASE_URL должен быть актуальным');
  }
}

testConnection();
