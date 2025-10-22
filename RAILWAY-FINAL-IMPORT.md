# 🚀 Финальный импорт данных в Railway PostgreSQL

## ✅ **SQL скрипт готов!**

### **📊 Данные для импорта:**
- 👥 **Пользователи**: 1 (Сергей Сидорович)
- 👷 **Сотрудники**: 1 (Сергей Сидорович - главный энергетик)
- 📦 **Инвентарь**: 0
- 🔧 **Дополнения**: 0
- 📏 **Нормы размеров**: 0

## 📋 **Пошаговая инструкция:**

### **1. Откройте Railway Dashboard**
- Перейдите на https://railway.app
- Найдите ваш проект
- Откройте PostgreSQL сервис

### **2. Перейдите в Query**
- В PostgreSQL сервисе нажмите **"Query"**
- Откроется SQL редактор

### **3. Скопируйте и выполните SQL**
Скопируйте содержимое файла `railway-import.sql` и вставьте в SQL редактор:

```sql
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
```

### **4. Выполните SQL**
- Нажмите **"Run"** или **"Execute"**
- Дождитесь выполнения

### **5. Проверьте импорт**
Выполните этот SQL для проверки:

```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Employees' as table_name, COUNT(*) as count FROM "Employee"
UNION ALL
SELECT 'Inventory' as table_name, COUNT(*) as count FROM "Inventory"
UNION ALL
SELECT 'InventoryAddon' as table_name, COUNT(*) as count FROM "InventoryAddon"
UNION ALL
SELECT 'SizNorm' as table_name, COUNT(*) as count FROM "SizNorm";
```

### **6. Результат должен быть:**
```
table_name     | count
---------------|------
Users          | 1
Employees      | 1
Inventory      | 0
InventoryAddon | 0
SizNorm        | 0
```

## 🚀 **После импорта данных:**

### **1. Деплой приложения**
Railway автоматически:
- ✅ Применит миграции
- ✅ Создаст таблицы
- ✅ Запустит приложение

### **2. Проверка работы**
- Откройте домен Railway
- Войдите в систему:
  - **Email**: serhiosidorovich@gmail.com
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
- ✅ Обходит проблемы с сетью
- ✅ Использует реальные данные из локальной базы

## 📋 **Альтернативные методы (если не работает):**

### **Метод 1: Railway CLI**
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите в Railway (интерактивно)
railway login

# Подключитесь к проекту
railway link

# Импортируйте данные
node setup-railway-database.js
```

### **Метод 2: Прямое подключение через psql**
```bash
# Установите PostgreSQL
# Подключитесь к Railway
psql "postgresql://postgres:password@turntable.proxy.rlwy.net:27091/railway"

# Выполните SQL команды из railway-import.sql
```

## ✅ **Рекомендация:**
**Используйте Railway Dashboard -> Query** - это самый простой и надежный способ импорта данных.

**Готово! Теперь можете деплоить приложение с реальными данными!** 🚀✨
