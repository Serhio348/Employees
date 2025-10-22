-- SQL скрипт для импорта данных в Railway PostgreSQL
-- Выполните этот скрипт в Railway Dashboard -> PostgreSQL -> Query

-- Импорт пользователей
INSERT INTO "User" (id, email, password, name, "lastName") 
VALUES ('f592af1d-4d9f-4e7e-aaeb-f244b50bdaf2', 'serhiosidorovich@gmail.com', '$2b$10$zHasLgG8aGfnqjWYyZWOvO477XE1bbN5oaYUqkhgObzE0uGertFH6', 'Сергей', 'Сидорович')
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    "lastName" = EXCLUDED."lastName";

-- Импорт сотрудников
INSERT INTO "Employee" (id, "firstName", "lastName", "surName", age, "birthDate", profession, address, "employeeNumber", height, "clothingSize", "shoeSize", "userId") 
VALUES ('229dfd0d-d05b-4a45-9a09-20c63ded6789', 'Сергей', 'Сидорович', 'Юрьевич', 38, '1987-05-13T00:00:00.000Z', 'главный энергетик', '65 Смирнова', '9439', 180, '52', '43', 'f592af1d-4d9f-4e7e-aaeb-f244b50bdaf2')
ON CONFLICT (id) DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    "surName" = EXCLUDED."surName",
    age = EXCLUDED.age,
    "birthDate" = EXCLUDED."birthDate",
    profession = EXCLUDED.profession,
    address = EXCLUDED.address,
    "employeeNumber" = EXCLUDED."employeeNumber",
    height = EXCLUDED.height,
    "clothingSize" = EXCLUDED."clothingSize",
    "shoeSize" = EXCLUDED."shoeSize";

-- Проверка импорта
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Employees' as table_name, COUNT(*) as count FROM "Employee"
UNION ALL
SELECT 'Inventory' as table_name, COUNT(*) as count FROM "Inventory"
UNION ALL
SELECT 'InventoryAddon' as table_name, COUNT(*) as count FROM "InventoryAddon"
UNION ALL
SELECT 'SizNorm' as table_name, COUNT(*) as count FROM "SizNorm";
