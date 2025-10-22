const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🔧 Настройка Railway PostgreSQL базы данных...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function setupDatabase() {
  const prisma = new PrismaClient();

  try {
    // Проверяем подключение
    console.log('📡 Проверка подключения к Railway PostgreSQL...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Подключение успешно:', result);

    // Проверяем существующие данные
    console.log('\n🔍 Проверка существующих данных...');
    const userCount = await prisma.user.count();
    const employeeCount = await prisma.employee.count();
    const inventoryCount = await prisma.inventory.count();
    const addonCount = await prisma.inventoryAddon.count();
    const sizNormCount = await prisma.sizNorm.count();

    console.log('📊 Текущие данные в Railway:');
    console.log(`👥 Пользователи: ${userCount}`);
    console.log(`👷 Сотрудники: ${employeeCount}`);
    console.log(`📦 Инвентарь: ${inventoryCount}`);
    console.log(`🔧 Дополнения: ${addonCount}`);
    console.log(`📏 Нормы размеров: ${sizNormCount}`);

    // Если данных нет, импортируем
    if (userCount === 0) {
      console.log('\n📥 Импорт данных из локального экспорта...');
      
      const dataPath = './local-data-export.json';
      if (!fs.existsSync(dataPath)) {
        console.error('❌ Файл с данными не найден:', dataPath);
        return;
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      
      console.log('📊 Данные для импорта:');
      console.log(`👥 Пользователи: ${data.users.length}`);
      console.log(`👷 Сотрудники: ${data.employees.length}`);
      console.log(`📦 Инвентарь: ${data.inventory.length}`);
      console.log(`🔧 Дополнения: ${data.inventoryAddons.length}`);
      console.log(`📏 Нормы размеров: ${data.sizNorms.length}`);

      // Импорт пользователей
      if (data.users.length > 0) {
        console.log('\n👥 Импорт пользователей...');
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
            console.log(`✅ Пользователь ${user.email} импортирован`);
          } catch (error) {
            console.log(`⚠️ Пользователь ${user.email} уже существует`);
          }
        }
      }

      // Импорт сотрудников
      if (data.employees.length > 0) {
        console.log('\n👷 Импорт сотрудников...');
        for (const employee of data.employees) {
          try {
            await prisma.employee.create({
              data: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                surName: employee.surName,
                age: employee.age,
                birthDate: employee.birthDate ? new Date(employee.birthDate) : null,
                profession: employee.profession,
                address: employee.address,
                employeeNumber: employee.employeeNumber,
                height: employee.height,
                clothingSize: employee.clothingSize,
                shoeSize: employee.shoeSize,
                userId: employee.userId,
              }
            });
            console.log(`✅ Сотрудник ${employee.firstName} ${employee.lastName} импортирован`);
          } catch (error) {
            console.log(`⚠️ Сотрудник ${employee.firstName} ${employee.lastName} уже существует`);
          }
        }
      }

      // Импорт инвентаря
      if (data.inventory.length > 0) {
        console.log('\n📦 Импорт инвентаря...');
        for (const item of data.inventory) {
          try {
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
            console.log(`✅ Инвентарь ${item.itemName} импортирован`);
          } catch (error) {
            console.log(`⚠️ Инвентарь ${item.itemName} уже существует`);
          }
        }
      }

      // Импорт дополнений
      if (data.inventoryAddons.length > 0) {
        console.log('\n🔧 Импорт дополнений...');
        for (const addon of data.inventoryAddons) {
          try {
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
            console.log(`✅ Дополнение ${addon.name} импортировано`);
          } catch (error) {
            console.log(`⚠️ Дополнение ${addon.name} уже существует`);
          }
        }
      }

      // Импорт норм размеров
      if (data.sizNorms.length > 0) {
        console.log('\n📏 Импорт норм размеров...');
        for (const norm of data.sizNorms) {
          try {
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
            console.log(`✅ Норма ${norm.name} импортирована`);
          } catch (error) {
            console.log(`⚠️ Норма ${norm.name} уже существует`);
          }
        }
      }

      console.log('\n🎉 Импорт завершен успешно!');
    } else {
      console.log('\n✅ Данные уже существуют в Railway базе данных');
    }

    // Финальная статистика
    const finalUserCount = await prisma.user.count();
    const finalEmployeeCount = await prisma.employee.count();
    const finalInventoryCount = await prisma.inventory.count();
    const finalAddonCount = await prisma.inventoryAddon.count();
    const finalSizNormCount = await prisma.sizNorm.count();

    console.log('\n📊 Финальная статистика Railway базы данных:');
    console.log(`👥 Пользователи: ${finalUserCount}`);
    console.log(`👷 Сотрудники: ${finalEmployeeCount}`);
    console.log(`📦 Инвентарь: ${finalInventoryCount}`);
    console.log(`🔧 Дополнения: ${finalAddonCount}`);
    console.log(`📏 Нормы размеров: ${finalSizNormCount}`);

  } catch (error) {
    console.error('❌ Ошибка настройки базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
