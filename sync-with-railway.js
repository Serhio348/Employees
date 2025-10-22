const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🔄 Синхронизация с Railway PostgreSQL...');

async function syncWithRailway() {
  // Подключаемся к локальной базе данных
  const localPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:bru_348SUU@localhost:5432/employees_db'
      }
    }
  });

  try {
    console.log('📡 Подключение к локальной базе данных...');
    
    // Проверяем локальные данные
    const users = await localPrisma.user.findMany();
    const employees = await localPrisma.employee.findMany();
    const inventory = await localPrisma.inventory.findMany();
    const inventoryAddons = await localPrisma.inventoryAddon.findMany();
    const sizNorms = await localPrisma.sizNorm.findMany();

    console.log('📊 Локальные данные:');
    console.log(`👥 Пользователи: ${users.length}`);
    console.log(`👷 Сотрудники: ${employees.length}`);
    console.log(`📦 Инвентарь: ${inventory.length}`);
    console.log(`🔧 Дополнения: ${inventoryAddons.length}`);
    console.log(`📏 Нормы размеров: ${sizNorms.length}`);

    // Создаем SQL скрипт для Railway
    const sqlScript = generateSQLScript(users, employees, inventory, inventoryAddons, sizNorms);
    
    const outputPath = './railway-import.sql';
    fs.writeFileSync(outputPath, sqlScript);
    
    console.log(`\n✅ SQL скрипт создан: ${outputPath}`);
    console.log('📋 Инструкции для импорта в Railway:');
    console.log('1. Откройте Railway Dashboard');
    console.log('2. Перейдите в PostgreSQL -> Query');
    console.log('3. Скопируйте содержимое файла railway-import.sql');
    console.log('4. Выполните SQL команды');
    console.log('5. Проверьте результат');

  } catch (error) {
    console.error('❌ Ошибка синхронизации:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

function generateSQLScript(users, employees, inventory, inventoryAddons, sizNorms) {
  let sql = '-- SQL скрипт для импорта данных в Railway PostgreSQL\n';
  sql += '-- Выполните этот скрипт в Railway Dashboard -> PostgreSQL -> Query\n\n';

  // Импорт пользователей
  if (users.length > 0) {
    sql += '-- Импорт пользователей\n';
    for (const user of users) {
      sql += `INSERT INTO "User" (id, email, password, name, "lastName") \n`;
      sql += `VALUES ('${user.id}', '${user.email}', '${user.password}', '${user.name}', '${user.lastName}')\n`;
      sql += `ON CONFLICT (email) DO UPDATE SET\n`;
      sql += `    password = EXCLUDED.password,\n`;
      sql += `    name = EXCLUDED.name,\n`;
      sql += `    "lastName" = EXCLUDED."lastName";\n\n`;
    }
  }

  // Импорт сотрудников
  if (employees.length > 0) {
    sql += '-- Импорт сотрудников\n';
    for (const employee of employees) {
      sql += `INSERT INTO "Employee" (id, "firstName", "lastName", "surName", age, "birthDate", profession, address, "employeeNumber", height, "clothingSize", "shoeSize", "userId") \n`;
      sql += `VALUES ('${employee.id}', '${employee.firstName}', '${employee.lastName}', ${employee.surName ? `'${employee.surName}'` : 'NULL'}, ${employee.age}, ${employee.birthDate ? `'${employee.birthDate.toISOString()}'` : 'NULL'}, '${employee.profession}', '${employee.address}', ${employee.employeeNumber ? `'${employee.employeeNumber}'` : 'NULL'}, ${employee.height || 'NULL'}, ${employee.clothingSize ? `'${employee.clothingSize}'` : 'NULL'}, ${employee.shoeSize ? `'${employee.shoeSize}'` : 'NULL'}, '${employee.userId}')\n`;
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    "firstName" = EXCLUDED."firstName",\n`;
      sql += `    "lastName" = EXCLUDED."lastName",\n`;
      sql += `    "surName" = EXCLUDED."surName",\n`;
      sql += `    age = EXCLUDED.age,\n`;
      sql += `    "birthDate" = EXCLUDED."birthDate",\n`;
      sql += `    profession = EXCLUDED.profession,\n`;
      sql += `    address = EXCLUDED.address,\n`;
      sql += `    "employeeNumber" = EXCLUDED."employeeNumber",\n`;
      sql += `    height = EXCLUDED.height,\n`;
      sql += `    "clothingSize" = EXCLUDED."clothingSize",\n`;
      sql += `    "shoeSize" = EXCLUDED."shoeSize";\n\n`;
    }
  }

  // Импорт инвентаря
  if (inventory.length > 0) {
    sql += '-- Импорт инвентаря\n';
    for (const item of inventory) {
      sql += `INSERT INTO "Inventory" (id, "itemName", "itemType", "issueDate", quantity, status, "employeeId", "createdAt", "updatedAt") \n`;
      sql += `VALUES ('${item.id}', '${item.itemName}', '${item.itemType}', '${item.issueDate.toISOString()}', ${item.quantity}, '${item.status}', '${item.employeeId}', '${item.createdAt.toISOString()}', '${item.updatedAt.toISOString()}')\n`;
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    "itemName" = EXCLUDED."itemName",\n`;
      sql += `    "itemType" = EXCLUDED."itemType",\n`;
      sql += `    "issueDate" = EXCLUDED."issueDate",\n`;
      sql += `    quantity = EXCLUDED.quantity,\n`;
      sql += `    status = EXCLUDED.status,\n`;
      sql += `    "employeeId" = EXCLUDED."employeeId";\n\n`;
    }
  }

  // Импорт дополнений
  if (inventoryAddons.length > 0) {
    sql += '-- Импорт дополнений инвентаря\n';
    for (const addon of inventoryAddons) {
      sql += `INSERT INTO "InventoryAddon" (id, name, "issueDate", "wearPeriodMonths", "nextReplacementDate", "inventoryId", "createdAt", "updatedAt") \n`;
      sql += `VALUES ('${addon.id}', '${addon.name}', '${addon.issueDate.toISOString()}', ${addon.wearPeriodMonths}, '${addon.nextReplacementDate.toISOString()}', '${addon.inventoryId}', '${addon.createdAt.toISOString()}', '${addon.updatedAt.toISOString()}')\n`;
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    name = EXCLUDED.name,\n`;
      sql += `    "issueDate" = EXCLUDED."issueDate",\n`;
      sql += `    "wearPeriodMonths" = EXCLUDED."wearPeriodMonths",\n`;
      sql += `    "nextReplacementDate" = EXCLUDED."nextReplacementDate",\n`;
      sql += `    "inventoryId" = EXCLUDED."inventoryId";\n\n`;
    }
  }

  // Импорт норм размеров
  if (sizNorms.length > 0) {
    sql += '-- Импорт норм размеров\n';
    for (const norm of sizNorms) {
      sql += `INSERT INTO "SizNorm" (id, name, classification, quantity, period, "periodType", "createdAt", "updatedAt") \n`;
      sql += `VALUES ('${norm.id}', '${norm.name}', ${norm.classification ? `'${norm.classification}'` : 'NULL'}, ${norm.quantity}, '${norm.period}', '${norm.periodType}', '${norm.createdAt.toISOString()}', '${norm.updatedAt.toISOString()}')\n`;
      sql += `ON CONFLICT (id) DO UPDATE SET\n`;
      sql += `    name = EXCLUDED.name,\n`;
      sql += `    classification = EXCLUDED.classification,\n`;
      sql += `    quantity = EXCLUDED.quantity,\n`;
      sql += `    period = EXCLUDED.period,\n`;
      sql += `    "periodType" = EXCLUDED."periodType";\n\n`;
    }
  }

  // Проверка импорта
  sql += '-- Проверка импорта\n';
  sql += 'SELECT \'Users\' as table_name, COUNT(*) as count FROM "User"\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'Employees\' as table_name, COUNT(*) as count FROM "Employee"\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'Inventory\' as table_name, COUNT(*) as count FROM "Inventory"\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'InventoryAddon\' as table_name, COUNT(*) as count FROM "InventoryAddon"\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'SizNorm\' as table_name, COUNT(*) as count FROM "SizNorm";\n';

  return sql;
}

syncWithRailway();
