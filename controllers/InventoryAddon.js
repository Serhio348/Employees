const { prisma } = require('../prisma/prisma-client');

/**
 * @route GET /api/inventory-addon/:inventoryId
 * @desc Получение дополнений инвентаря
 * @access Private
 */
const getInventoryAddons = async (req, res) => {
    try {
        const { inventoryId } = req.params;
        
        const addons = await prisma.inventoryAddon.findMany({
            where: {
                inventoryId: inventoryId,
            },
            orderBy: {
                issueDate: 'desc'
            }
        });
        
        res.status(200).json(addons);
    } catch (error) {
        console.error('Get inventory addons error:', error);
        res.status(500).json({ message: "Не удалось получить дополнения", error: error.message });
    }
};

/**
 * @route POST /api/inventory-addon/add
 * @desc Добавление дополнения к инвентарю
 * @access Private
 */
const addInventoryAddon = async (req, res) => {
    try {
        const data = req.body;
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        
        if (!data.name || !data.inventoryId || !data.wearPeriodMonths) {
            return res.status(400).json({ message: "Название, ID инвентаря и срок носки обязательны" });
        }
        
        // Вычисляем дату следующей замены
        const issueDate = new Date(data.issueDate || new Date());
        const nextReplacementDate = new Date(issueDate);
        nextReplacementDate.setMonth(nextReplacementDate.getMonth() + data.wearPeriodMonths);
        
        const addon = await prisma.inventoryAddon.create({
            data: {
                name: data.name,
                issueDate: issueDate,
                wearPeriodMonths: data.wearPeriodMonths,
                nextReplacementDate: nextReplacementDate,
                inventoryId: data.inventoryId,
            },
        });
        
        res.status(201).json(addon);
    } catch (error) {
        console.error('Add inventory addon error:', error);
        res.status(500).json({ message: "Не удалось добавить дополнение", error: error.message });
    }
};

/**
 * @route PUT /api/inventory-addon/:id
 * @desc Обновление дополнения инвентаря
 * @access Private
 */
const updateInventoryAddon = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        // Пересчитываем дату следующей замены если изменился срок носки
        let nextReplacementDate = data.nextReplacementDate;
        if (data.wearPeriodMonths && data.issueDate) {
            const issueDate = new Date(data.issueDate);
            nextReplacementDate = new Date(issueDate);
            nextReplacementDate.setMonth(nextReplacementDate.getMonth() + data.wearPeriodMonths);
        }
        
        const addon = await prisma.inventoryAddon.update({
            where: { id },
            data: {
                name: data.name,
                issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
                wearPeriodMonths: data.wearPeriodMonths,
                nextReplacementDate: nextReplacementDate ? new Date(nextReplacementDate) : undefined,
            },
        });
        
        res.status(200).json(addon);
    } catch (error) {
        console.error('Update inventory addon error:', error);
        res.status(500).json({ message: "Не удалось обновить дополнение", error: error.message });
    }
};

/**
 * @route DELETE /api/inventory-addon/:id
 * @desc Удаление дополнения инвентаря
 * @access Private
 */
const deleteInventoryAddon = async (req, res) => {
    try {
        const { id } = req.params;
        
        await prisma.inventoryAddon.delete({
            where: { id },
        });
        
        res.status(204).json({ message: "Дополнение удалено" });
    } catch (error) {
        console.error('Delete inventory addon error:', error);
        res.status(500).json({ message: "Не удалось удалить дополнение", error: error.message });
    }
};

/**
 * @route GET /api/inventory-addon/item/:id
 * @desc Получение конкретного дополнения
 * @access Private
 */
const getInventoryAddon = async (req, res) => {
    try {
        const { id } = req.params;
        
        const addon = await prisma.inventoryAddon.findUnique({
            where: { id },
            include: {
                inventory: {
                    include: {
                        employee: {
                            select: {
                                firstName: true,
                                lastName: true,
                                surName: true,
                                employeeNumber: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!addon) {
            return res.status(404).json({ message: "Дополнение не найдено" });
        }
        
        res.status(200).json(addon);
    } catch (error) {
        console.error('Get inventory addon error:', error);
        res.status(500).json({ message: "Не удалось получить дополнение", error: error.message });
    }
};

/**
 * @route GET /api/inventory-addon/expiring
 * @desc Получение дополнений, требующих замены
 * @access Private
 */
const getExpiringAddons = async (req, res) => {
    try {
        const { days = 30 } = req.query; // по умолчанию 30 дней
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));
        
        const expiringAddons = await prisma.inventoryAddon.findMany({
            where: {
                nextReplacementDate: {
                    lte: futureDate
                }
            },
            include: {
                inventory: {
                    include: {
                        employee: {
                            select: {
                                firstName: true,
                                lastName: true,
                                surName: true,
                                employeeNumber: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                nextReplacementDate: 'asc'
            }
        });
        
        res.status(200).json(expiringAddons);
    } catch (error) {
        console.error('Get expiring addons error:', error);
        res.status(500).json({ message: "Не удалось получить дополнения для замены", error: error.message });
    }
};

module.exports = {
    getInventoryAddons,
    addInventoryAddon,
    updateInventoryAddon,
    deleteInventoryAddon,
    getInventoryAddon,
    getExpiringAddons
};
