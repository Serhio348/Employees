# 🔧 Получение правильного DATABASE_URL из Railway

## ❌ **Проблема:**
`postgres.railway.internal:5432` - это внутренний адрес Railway, недоступный с локального компьютера.

## ✅ **Решение:**

### **1. Получите публичный DATABASE_URL**

#### **В Railway Dashboard:**
1. Откройте ваш проект в Railway
2. Найдите PostgreSQL сервис
3. Перейдите на вкладку **"Connect"**
4. Скопируйте **"Public Networking"** URL

#### **Или через Railway CLI:**
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите в аккаунт
railway login

# Подключитесь к проекту
railway link

# Получите переменные
railway variables
```

### **2. Публичный DATABASE_URL должен выглядеть так:**
```
postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

**НЕ так:**
```
postgresql://postgres:password@postgres.railway.internal:5432/railway
```

### **3. Установите правильный DATABASE_URL:**
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway"

# Windows CMD
set DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### **4. Проверьте подключение:**
```bash
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL)"
```

### **5. Импортируйте данные:**
```bash
node setup-railway-database.js
```

## 🔍 **Как найти правильный URL:**

### **В Railway Dashboard:**
1. PostgreSQL сервис → **"Connect"** вкладка
2. Найдите **"Public Networking"** секцию
3. Скопируйте URL с доменом `.railway.app`

### **Пример правильного URL:**
```
postgresql://postgres:abc123@containers-us-west-123.railway.app:5432/railway
```

## ⚠️ **Важно:**
- Используйте **публичный** URL, не внутренний
- URL должен содержать `.railway.app` домен
- Порт должен быть указан явно

**После получения правильного URL импорт данных пройдет успешно!** 🚀✨
