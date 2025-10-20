# 🐙 Создание GitHub репозитория

## 📋 **Пошаговая инструкция:**

### **1. Создайте репозиторий на GitHub:**

1. **Перейдите на [github.com](https://github.com)**
2. **Войдите в свой аккаунт** (или создайте новый)
3. **Нажмите зеленую кнопку "New"** или "+" → "New repository"
4. **Заполните форму:**
   - **Repository name**: `employees-app`
   - **Description**: `Employee Management System with React, Node.js, and Prisma`
   - **Visibility**: Public (или Private, если хотите)
   - **НЕ добавляйте** README, .gitignore, license (у нас уже есть)

### **2. Подключите локальный репозиторий:**

После создания репозитория GitHub покажет команды. Выполните их:

```bash
# Подключите удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/employees-app.git

# Переименуйте ветку в main
git branch -M main

# Загрузите код
git push -u origin main
```

### **3. Замените YOUR_USERNAME:**

В команде выше замените `YOUR_USERNAME` на ваш реальный GitHub username.

## 🎯 **Пример команд:**

Если ваш username `john-doe`, то команды будут:

```bash
git remote add origin https://github.com/john-doe/employees-app.git
git branch -M main
git push -u origin main
```

## ✅ **После успешной загрузки:**

- Ваш код будет доступен по адресу: `https://github.com/YOUR_USERNAME/employees-app`
- Репозиторий готов для деплоя на Railway
- Следуйте инструкции в `README-RAILWAY-DEPLOY.md`

## 🚨 **Если возникли проблемы:**

### **Проблема с аутентификацией:**
```bash
# Настройте Git (если еще не сделано)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### **Проблема с push:**
```bash
# Попробуйте с токеном доступа
git push -u origin main
# Введите username и Personal Access Token вместо пароля
```

---

## 🎉 **Готово!**

После выполнения этих шагов ваш проект будет загружен на GitHub и готов к деплою на Railway!
