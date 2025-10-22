const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('📥 Импорт данных в Railway PostgreSQL...');

  try {
    // Читаем экспортированные данные
    const dataPath = './local-data-export.json';
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Файл с данными не найден:', dataPath);
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log('\n📊 Данные для импорта:');
    console.log(`👥 Пользователи: ${data.users.length}`);
    console.log(`👷 Сотрудники: ${data.employees.length}`);
    console.log(`📦 Инвентарь: ${data.inventory.length}`);
    console.log(`🔧 Дополнения: ${data.inventoryAddons.length}`);
    console.log(`📏 Нормы размеров: ${data.sizNorms.length}`);

    console.log('\n🔄 Начинаем импорт...');

    // Импорт пользователей
    console.log('👥 Импорт пользователей...');
    for (const user of data.users) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            password: user.password,
            name: user.name,
            lastName: user.lastName,
          },
          create: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            lastName: user.lastName,
          }
        });
      } catch (error) {
        console.log(`⚠️ Пользователь ${user.email} уже существует, пропускаем`);
      }
    }
    console.log(`✅ Обработано ${data.users.length} пользователей`);

    // Импорт сотрудников
    console.log('👷 Импорт сотрудников...');
    for (const employee of data.employees) {
      await prisma.employee.create({
        data: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          surName: employee.surName,
          age: employee.age,
          birthDate: employee.birthDate,
          profession: employee.profession,
          address: employee.address,
          employeeNumber: employee.employeeNumber,
          height: employee.height,
          clothingSize: employee.clothingSize,
          shoeSize: employee.shoeSize,
          userId: employee.userId,
        }
      });
    }
    console.log(`✅ Импортировано ${data.employees.length} сотрудников`);

    // Импорт инвентаря
    console.log('📦 Импорт инвентаря...');
    for (const item of data.inventory) {
      await prisma.inventory.create({
        data: {
          id: item.id,
          itemName: item.itemName,
          itemType: item.itemType,
          issueDate: new Date(item.issueDate),
          quantity: item.quantity,
          status: item.status,
          employeeId: item.employeeId,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }
      });
    }
    console.log(`✅ Импортировано ${data.inventory.length} записей инвентаря`);

    // Импорт дополнений
    console.log('🔧 Импорт дополнений инвентаря...');
    for (const addon of data.inventoryAddons) {
      await prisma.inventoryAddon.create({
        data: {
          id: addon.id,
          name: addon.name,
          issueDate: new Date(addon.issueDate),
          wearPeriodMonths: addon.wearPeriodMonths,
          nextReplacementDate: new Date(addon.nextReplacementDate),
          inventoryId: addon.inventoryId,
          createdAt: new Date(addon.createdAt),
          updatedAt: new Date(addon.updatedAt),
        }
      });
    }
    console.log(`✅ Импортировано ${data.inventoryAddons.length} дополнений`);

    // Импорт норм размеров
    console.log('📏 Импорт норм размеров...');
    for (const norm of data.sizNorms) {
      await prisma.sizNorm.create({
        data: {
          id: norm.id,
          name: norm.name,
          classification: norm.classification,
          quantity: norm.quantity,
          period: norm.period,
          periodType: norm.periodType,
          createdAt: new Date(norm.createdAt),
          updatedAt: new Date(norm.updatedAt),
        }
      });
    }
    console.log(`✅ Импортировано ${data.sizNorms.length} норм размеров`);

    console.log('\n🎉 Импорт завершен успешно!');
    console.log('📊 Итоговая статистика:');
    console.log(`👥 Пользователи: ${data.users.length}`);
    console.log(`👷 Сотрудники: ${data.employees.length}`);
    console.log(`📦 Инвентарь: ${data.inventory.length}`);
    console.log(`🔧 Дополнения: ${data.inventoryAddons.length}`);
    console.log(`📏 Нормы размеров: ${data.sizNorms.length}`);

  } catch (error) {
    console.error('❌ Ошибка импорта данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
