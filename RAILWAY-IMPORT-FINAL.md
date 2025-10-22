# 🚀 Финальный импорт данных в Railway PostgreSQL

## ✅ **Railway CLI подключен успешно!**

### **📊 Данные для импорта:**
- 👥 **Пользователи**: 1 (Сергей Сидорович)
- 👷 **Сотрудники**: 1 (Сергей Сидорович - главный энергетик)
- 📦 **Инвентарь**: 0
- 🔧 **Дополнения**: 0
- 📏 **Нормы размеров**: 0

## 📋 **Метод 1: Railway Dashboard (рекомендуется)**

### **1. Откройте Railway Dashboard**
- Перейдите на https://railway.app
- Найдите проект `my_employees`
- Откройте PostgreSQL сервис

### **2. Перейдите в Query**
- В PostgreSQL сервисе нажмите **"Query"**
- Откроется SQL редактор

### **3. Скопируйте и выполните SQL**
Скопируйте содержимое файла `railway-import.sql`:

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
```sql
SELECT 'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Employees' as table_name, COUNT(*) as count FROM "Employee";
```

## 📋 **Метод 2: Railway CLI (если установлен psql)**

### **1. Установите psql**
```bash
# Windows - через Chocolatey
choco install postgresql

# Или скачайте с https://www.postgresql.org/download/windows/
```

### **2. Подключитесь к Railway**
```bash
railway connect postgres
```

### **3. Выполните SQL команды**
Скопируйте и выполните команды из `railway-import.sql`

## 📋 **Метод 3: Прямое подключение через psql**

### **1. Установите psql**
```bash
# Windows - через Chocolatey
choco install postgresql
```

### **2. Подключитесь к Railway**
```bash
psql "postgresql://postgres:yjXmbRdrOVckLhcvldQpzKDwjNrTYZjI@turntable.proxy.rlwy.net:27091/railway"
```

### **3. Выполните SQL команды**
Скопируйте и выполните команды из `railway-import.sql`

## 🚀 **После импорта данных:**

### **1. Деплой приложения**
Railway автоматически:
- ✅ Применит миграции
- ✅ Создаст таблицы
- ✅ Запустит приложение

### **2. Проверка работы**
- Откройте домен Railway: `employees-production-c5df.up.railway.app`
- Войдите в систему:
  - **Email**: serhiosidorovich@gmail.com
  - **Password**: 123456

### **3. Данные будут доступны**
- ✅ Пользователь импортирован
- ✅ Сотрудник импортирован
- ✅ Приложение работает с данными

## 🎯 **Рекомендация:**
**Используйте Метод 1 (Railway Dashboard -> Query)** - это самый простой и надежный способ импорта данных.

## ✅ **Готово!**
- ✅ Railway CLI подключен
- ✅ SQL скрипт готов
- ✅ Данные подготовлены
- ✅ Инструкции созданы

**Теперь можете импортировать данные и деплоить приложение!** 🚀✨
