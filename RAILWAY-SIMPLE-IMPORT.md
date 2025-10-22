# 🚀 Простой импорт данных в Railway PostgreSQL

## 📋 **Пошаговая инструкция**

### **1. Откройте Railway Dashboard**
- Перейдите на https://railway.app
- Найдите ваш проект
- Откройте PostgreSQL сервис

### **2. Перейдите в Query**
- В PostgreSQL сервисе нажмите **"Query"**
- Откроется SQL редактор

### **3. Скопируйте и выполните SQL**
Скопируйте содержимое файла `railway-sql-import.sql` и вставьте в SQL редактор:

```sql
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
```

### **4. Выполните SQL**
- Нажмите **"Run"** или **"Execute"**
- Дождитесь выполнения

### **5. Проверьте импорт**
Выполните этот SQL для проверки:

```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Employees' as table_name, COUNT(*) as count FROM "Employee";
```

### **6. Результат должен быть:**
```
table_name | count
-----------|------
Users      | 1
Employees  | 1
```

## ✅ **После импорта данных:**

### **1. Деплой приложения**
- Railway автоматически применит миграции
- Создаст таблицы
- Запустит приложение

### **2. Проверка работы**
- Откройте домен Railway
- Войдите в систему с данными:
  - **Email**: admin@example.com
  - **Password**: 123456

### **3. Данные будут доступны**
- ✅ Пользователь импортирован
- ✅ Сотрудник импортирован
- ✅ Приложение работает с данными

## 🎯 **Преимущества этого метода:**
- ✅ Не требует CLI
- ✅ Работает через веб-интерфейс
- ✅ Надежный и простой
- ✅ Прямой доступ к базе данных

**Готово! Теперь можете деплоить приложение с данными!** 🚀✨
