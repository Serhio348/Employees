const { prisma } = require('../../prisma/prisma-client');

/**
 * @route GET /api/siz-norms
 * @desc Получение всех норм СИЗ
 * @access Private
 */
const all = async (req, res) => {
    try {
        const sizNorms = await prisma.sizNorm.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(sizNorms);
    } catch (error) {
        console.error('Get SIZ norms error:', error);
        res.status(400).json({ message: 'Не удалось получить нормы СИЗ' });
    }
};

/**
 * @route GET /api/siz-norms/:id
 * @desc Получение конкретной нормы СИЗ
 * @access Private
 */
const item = async (req, res) => {
    const { id } = req.params;

    try {
        const sizNorm = await prisma.sizNorm.findUnique({
            where: { id }
        });

        if (!sizNorm) {
            return res.status(404).json({ message: "Норма СИЗ не найдена" });
        }

        res.status(200).json(sizNorm);
    } catch (error) {
        console.error('Get SIZ norm error:', error);
        res.status(500).json({ message: "Не удалось получить норму СИЗ" });
    }
};

/**
 * @route POST /api/siz-norms/add
 * @desc Добавление новой нормы СИЗ
 * @access Private
 */
const add = async (req, res) => {
    try {
        const data = req.body;
        console.log('Received SIZ norm data:', data);
        
        if (!data.name || !data.period || !data.periodType) {
            return res.status(400).json({ message: "Название, период и тип периода обязательны" });
        }
        
        const sizNorm = await prisma.sizNorm.create({
            data: {
                name: data.name,
                classification: data.classification || null,
                quantity: parseInt(data.quantity) || 1,
                period: data.period,
                periodType: data.periodType,
            },
        });
        
        res.status(201).json(sizNorm);
    } catch (error) {
        console.error('Add SIZ norm error:', error);
        res.status(500).json({ message: "Не удалось добавить норму СИЗ", error: error.message });
    }
};

/**
 * @route PUT /api/siz-norms/edit/:id
 * @desc Редактирование нормы СИЗ
 * @access Private
 */
const edit = async (req, res) => {
    const data = req.body;
    const { id } = req.params;

    try {
        console.log('Edit SIZ norm - received data:', data);
        
        const sizNorm = await prisma.sizNorm.update({
            where: { id },
            data: {
                name: data.name,
                classification: data.classification,
                quantity: data.quantity ? parseInt(data.quantity) : undefined,
                period: data.period,
                periodType: data.periodType,
            },
        });

        console.log('Edit SIZ norm - updated item:', sizNorm);
        res.status(200).json(sizNorm);
    } catch (error) {
        console.error('Edit SIZ norm error:', error);
        res.status(500).json({ message: "Не удалось обновить норму СИЗ", error: error.message });
    }
};

/**
 * @route DELETE /api/siz-norms/remove/:id
 * @desc Удаление нормы СИЗ
 * @access Private
 */
const remove = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.sizNorm.delete({
            where: { id },
        });

        res.status(204).json("OK");
    } catch (error) {
        console.error('Delete SIZ norm error:', error);
        res.status(500).json({ message: "Не удалось удалить норму СИЗ" });
    }
};

/**
 * @route POST /api/siz-norms/init-defaults
 * @desc Инициализация стандартных норм СИЗ
 * @access Private
 */
const initDefaults = async (req, res) => {
    try {
        // Проверяем, есть ли уже нормы в базе
        const existingNorms = await prisma.sizNorm.findMany();
        if (existingNorms.length > 0) {
            return res.status(200).json({ message: "Нормы СИЗ уже инициализированы", norms: existingNorms });
        }

        // Стандартные нормативы СИЗ
        const defaultNorms = [
            {
                name: 'Жилет утепленный',
                classification: 'Тн',
                quantity: 1,
                period: '24',
                periodType: 'months'
            },
            {
                name: 'Костюм х/б',
                classification: 'ЗМи',
                quantity: 1,
                period: '12',
                periodType: 'months'
            },
            {
                name: 'Ботинки',
                classification: 'Ми',
                quantity: 1,
                period: '12',
                periodType: 'months'
            },
            {
                name: 'Сапоги резиновые',
                classification: 'В',
                quantity: 1,
                period: '24',
                periodType: 'months'
            },
            {
                name: 'Каска защитная',
                classification: '',
                quantity: 1,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Фуфайка с логотипом',
                classification: 'ЗМи',
                quantity: 2,
                period: '6',
                periodType: 'months'
            },
            {
                name: 'Куртка утеплённая',
                classification: 'Тн',
                quantity: 1,
                period: '36',
                periodType: 'months'
            },
            {
                name: 'Брюки утепленные',
                classification: 'Тн',
                quantity: 1,
                period: '36',
                periodType: 'months'
            },
            {
                name: 'Перчатки зимние',
                classification: 'Тн',
                quantity: 1,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Ботинки утепленные',
                classification: 'Тн',
                quantity: 1,
                period: '24',
                periodType: 'months'
            },
            {
                name: 'Кепка',
                classification: '',
                quantity: 1,
                period: '12',
                periodType: 'months'
            },
            {
                name: 'Очки защитные',
                classification: 'ЗП',
                quantity: 1,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Шапка трикотажная',
                classification: '',
                quantity: 1,
                period: '24',
                periodType: 'months'
            },
            {
                name: 'Перчатки х/б с ПВХ',
                classification: 'Ми',
                quantity: 1,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Перчатки резиновые',
                classification: 'Вн',
                quantity: 2,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Плащ влагостойкий',
                classification: 'Вн',
                quantity: 3,
                period: 'д/и',
                periodType: 'until_worn'
            },
            {
                name: 'Пояс предохранительный пп-а фал',
                classification: 'Вн',
                quantity: 4,
                period: 'д/и',
                periodType: 'until_worn'
            }
        ];

        // Создаем нормы по одной
        const createdNorms = [];
        for (const norm of defaultNorms) {
            const created = await prisma.sizNorm.create({
                data: norm
            });
            createdNorms.push(created);
        }

        res.status(201).json({ message: "Стандартные нормы СИЗ инициализированы", count: createdNorms.length });
    } catch (error) {
        console.error('Init default SIZ norms error:', error);
        res.status(500).json({ message: "Не удалось инициализировать стандартные нормы СИЗ", error: error.message });
    }
};

module.exports = {
    all,
    item,
    add,
    edit,
    remove,
    initDefaults
};
