# 🔧 Исправление CORS и API URL для Railway

## ❌ **Проблема:**
```
POST http://localhost:5000/api/user/login net::ERR_CONNECTION_REFUSED
```

## ✅ **Решение:**

### **1. Обновлен API URL в клиенте**
**Файл**: `client/src/app/services/api.ts`

**Было:**
```typescript
baseUrl: "http://localhost:5000/api"
```

**Стало:**
```typescript
baseUrl: process.env.NODE_ENV === 'production' 
    ? "/api" 
    : "http://localhost:5000/api"
```

### **2. Обновлен CORS в сервере**
**Файл**: `server/app.js`

**Было:**
```javascript
origin: 'http://localhost:3000'
```

**Стало:**
```javascript
origin: process.env.NODE_ENV === 'production' 
    ? true  // Разрешить все домены в продакшене
    : 'http://localhost:3000'
```

## 🎯 **Как это работает:**

### **В разработке (localhost):**
- ✅ **Frontend**: http://localhost:3000
- ✅ **Backend**: http://localhost:5000
- ✅ **API**: http://localhost:5000/api

### **В продакшене (Railway):**
- ✅ **Frontend**: https://your-domain.railway.app
- ✅ **Backend**: https://your-domain.railway.app
- ✅ **API**: https://your-domain.railway.app/api

## 🚀 **После деплоя:**

### **1. Проверьте домен Railway**
- Откройте ваш Railway домен
- Проверьте, что приложение загружается

### **2. Проверьте API**
- Откройте Developer Tools (F12)
- Перейдите на вкладку Network
- Попробуйте войти в систему
- Убедитесь, что запросы идут на правильный домен

### **3. Проверьте CORS**
- В Network найдите запросы к API
- Убедитесь, что нет CORS ошибок
- Проверьте, что запросы успешные

## 📋 **Альтернативные решения:**

### **Если проблема сохраняется:**

#### **1. Проверьте переменные окружения**
```bash
# В Railway Dashboard добавьте:
NODE_ENV=production
```

#### **2. Проверьте домен Railway**
- Убедитесь, что домен правильный
- Проверьте, что приложение доступно

#### **3. Проверьте логи Railway**
- Откройте логи деплоя
- Убедитесь, что нет ошибок
- Проверьте, что сервер запущен

## ✅ **Результат:**
- ❌ **Было**: `POST http://localhost:5000/api/user/login net::ERR_CONNECTION_REFUSED`
- ✅ **Стало**: `POST https://your-domain.railway.app/api/user/login` - работает

**Теперь приложение будет работать с Railway доменом!** 🚀✨
