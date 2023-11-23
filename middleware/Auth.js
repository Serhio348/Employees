const jwt = require("jsonwebtoken");
const { prisma } = require("../prisma/prisma-client");

const auth = async (req, res, next) => {
    try {
        /////Вынимаем из ответа токен и присваиваем переменной
        let token = req.headers.authorization?.split(" ")[1];
        /////декодирование токена и валидация
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        /////Нахождение нужного пользователя
        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });
        req.user = user;

        next();
    } catch (error) {
        res.status(401).json({ message: 'Не авторизован' });
    }
};

module.exports = {
    auth,
};
