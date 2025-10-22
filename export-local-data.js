const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  console.log('📤 Экспорт данных из локальной PostgreSQL...');

  try {
    // Читаем все данные
    const users = await prisma.user.findMany();
    const employees = await prisma.employee.findMany();
    const inventory = await prisma.inventory.findMany();
    const inventoryAddons = await prisma.inventoryAddon.findMany();
    const sizNorms = await prisma.sizNorm.findMany();

    const data = {
      users,
      employees,
      inventory,
      inventoryAddons,
      sizNorms,
    };

    const outputPath = './local-data-export.json';
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log('✅ Данные экспортированы:');
    console.log(`👥 Пользователи: ${users.length}`);
    console.log(`👷 Сотрудники: ${employees.length}`);
    console.log(`📦 Инвентарь: ${inventory.length}`);
    console.log(`🔧 Дополнения: ${inventoryAddons.length}`);
    console.log(`📏 Нормы размеров: ${sizNorms.length}`);
    console.log(`\n💾 Файл сохранен: ${outputPath}`);

  } catch (error) {
    console.error('❌ Ошибка экспорта данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
