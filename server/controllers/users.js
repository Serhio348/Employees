require('dotenv').config();
// Устанавливаем JWT_SECRET напрямую, если он не загрузился из .env
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-here-12345';
    console.log('JWT_SECRET set manually');
}
const { prisma } = require("../../prisma/prisma-client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
/**
 * @route POST /api/user/login
 * @desс Логин
 * @access Public
 */

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        ///// Проверка заполнены ли все поля

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Пожалуйста заполните обязательные поля" });
        }
        ///Проверка пользователя есть ли такой логин
        const user = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        ///Сравнение паролей, который пришел к нам с client и хэш пароля текущего пользователя
        console.log('User found:', user ? 'Yes' : 'No');
        console.log('User password hash:', user ? user.password.substring(0, 20) + '...' : 'N/A');
        console.log('Input password:', password);
        
        const isPasswordCorrect =
            user && (await bcrypt.compare(password, user.password));
            
        console.log('Password comparison result:', isPasswordCorrect);

        const secret = process.env.JWT_SECRET;
        console.log('JWT Secret exists:', secret ? 'Yes' : 'No');
        console.log('JWT Secret length:', secret ? secret.length : 0);
        console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('JWT')));

        //// Проверяем условие что есть такой пользователь и введенный пароль верный
        if (user && isPasswordCorrect && secret) {
            console.log('All conditions met, generating token...');
            res.status(200).json({
                id: user.id,
                email: user.email,
                name: user.name,
                lastName: user.lastName,
                token: jwt.sign({ id: user.id }, secret, { expiresIn: "1d" }),
            });
        } else {
            console.log('Login failed - conditions not met:');
            console.log('- User exists:', !!user);
            console.log('- Password correct:', isPasswordCorrect);
            console.log('- Secret exists:', !!secret);
            return res
                .status(400)
                .json({ message: "Введен неверный логин или пароль" });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: "Что-то пошло не так", error: error.message });
    }
};

/**
 *
 * @route POST /api/user/register
 * @desc Регистрация
 * @access Public
 */
////Принимаем данные с client
const register = async (req, res) => {
    try {
        const { email, password, name, lastName } = req.body;

        /////Сравниваем все ли поля заполнены
        if (!email || !password || !name || !lastName) {
            return res
                .status(400)
                .json({ message: "Пожалуйста, заполните обязательные поля" });
        }

        //////Создаем переменную и записываем результат и ищем в БД есть ли такой пользователь
        const registeredUser = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        ////Если пользователь зарегистрированный с таким email есть:

        if (registeredUser) {
            return res
                .status(400)
                .json({ message: "Пользователь, с таким email уже существует" });
        }

        ////Строка которая будет добавлятся к хэшу
        const salt = await bcrypt.genSalt(10);

        ////Хэшировавние пароля с помощью сгенерированной соли:
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Original password:', password);
        console.log('Hashed password:', hashedPassword.substring(0, 20) + '...');

        const user = await prisma.user.create({
            data: {
                email,
                name,
                lastName,
                password: hashedPassword,
            },
        });

        /////Секретный ключ создание
        const secret = process.env.JWT_SECRET;

        if (user && secret) {
            res.status(201).json({
                id: user.id,
                email: user.email,
                name,
                lastName,
                token: jwt.sign({ id: user.id }, secret, { expiresIn: "1d" }),
            });
        } else {
            return res
                .status(400)
                .json({ message: "Не удалось создать пользователя" });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Что-то пошло не так", error: error.message });
    }
};

/**
 *
 * @route GET /api/user/current
 * @desc Текущий пользователь
 * @access Private
 */
const current = async (req, res) => {
    return res.status(200).json(req.user);
};

module.exports = {
    login,
    register,
    current,
};
