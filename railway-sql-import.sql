-- SQL скрипт для импорта данных в Railway PostgreSQL
-- Выполните этот скрипт в Railway Dashboard -> PostgreSQL -> Query

-- Импорт пользователя
INSERT INTO "User" (id, email, password, name, "lastName") 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@example.com', 
    '$2b$10$zHasLgG8aGfnq...', 
    'Admin', 
    'User'
) ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    name = EXCLUDED.name,
    "lastName" = EXCLUDED."lastName";

-- Импорт сотрудника
INSERT INTO "Employee" (
    id, 
    "firstName", 
    "lastName", 
    age, 
    profession, 
    address, 
    "userId"
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'John',
    'Doe',
    30,
    'Engineer',
    '123 Main St',
    '550e8400-e29b-41d4-a716-446655440000'
) ON CONFLICT (id) DO UPDATE SET
    "firstName" = EXCLUDED."firstName",
    "lastName" = EXCLUDED."lastName",
    age = EXCLUDED.age,
    profession = EXCLUDED.profession,
    address = EXCLUDED.address;

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
