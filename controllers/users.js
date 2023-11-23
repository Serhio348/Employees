const { prisma } = require("../prisma/prisma-client");
const brypt = require("bcrypt");
const jwt = require("jsonwebtoken");
/**
 * @route POST /api/user/login
 * @desс Логин
 * @access Public
 */

const login = async (req, res) => {
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
    const isPasswordCorrect =
        user && (await brypt.compare(password, user.password));

    const secret = process.env.JWT_SECRET;

    //// Проверяем условие что есть такой пользователь и введенный пароль верный
    if (user && isPasswordCorrect && secret) {
        res.status(200).json({
            id: user.id,
            email: user.email,
            name: user.name,
            token: jwt.sign({ id: user.id }, secret, { expiresIn: '30d' })
        });
    } else {
        return res
            .status(400)
            .json({ message: "Введен неверный логин или пароль" });
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
    const { email, password, name } = req.body;

    /////Сравниваем все ли поля заполнены

    if (!email || !password || !name) {
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
    const salt = await brypt.genSalt(10);

    ////Хэшировавние пароля с помощью сгенерированной соли:
    const hashedPassord = await brypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassord,
        },
    });

    /////Секретный ключ создание
    const secret = process.env.JWT_SECRET;

    if (user && secret) {
        res.status(201).json({
            id: user.id,
            email: user.email,
            name,
            token: jwt.sign({ id: user.id }, secret, { expiresIn: '30d' })
        })
    } else {
        return res.status(400).json({ message: 'Не удалось создать пользователя' })
    }
};

const current = async (req, res) => {
    res.send("current");
};

module.exports = {
    login,
    register,
    current,
};
