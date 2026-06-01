const { prisma } = require('../../prisma/prisma-client');
const { getAccessibleInventoryItem, isAdminUser } = require('../utils/access');

async function getAccessibleAddon(addonId, user) {
    const addon = await prisma.inventoryAddon.findUnique({
        where: { id: addonId }
    });

    if (!addon) return null;

    const inventory = await getAccessibleInventoryItem(prisma, addon.inventoryId, user);
    if (!inventory) return null;

    return { addon, inventory };
}

async function withInventoryAndEmployee(addon) {
    const inventory = await prisma.inventory.findUnique({
        where: { id: addon.inventoryId }
    });
    const employee = inventory
        ? await prisma.employee.findUnique({ where: { id: inventory.employeeId } })
        : null;

    return {
        ...addon,
        inventory: inventory
            ? {
                ...inventory,
                employee: employee
                    ? {
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        surName: employee.surName,
                        employeeNumber: employee.employeeNumber
                    }
                    : null
            }
            : null
    };
}

/**
 * @route GET /api/inventory-addon/:inventoryId
 * @desc Получение дополнений инвентаря
 * @access Private
 */
const getInventoryAddons = async (req, res) => {
    try {
        const { inventoryId } = req.params;

        const inventory = await getAccessibleInventoryItem(prisma, inventoryId, req.user);
        if (!inventory) {
            return res.status(404).json({ message: "Инвентарь не найден" });
        }
        
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

        const inventory = await getAccessibleInventoryItem(prisma, data.inventoryId, req.user);
        if (!inventory) {
            return res.status(404).json({ message: "Инвентарь не найден" });
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

        const existing = await getAccessibleAddon(id, req.user);
        if (!existing) {
            return res.status(404).json({ message: "Дополнение не найдено" });
        }
        
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

        const existing = await getAccessibleAddon(id, req.user);
        if (!existing) {
            return res.status(404).json({ message: "Дополнение не найдено" });
        }
        
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
        
        const existing = await getAccessibleAddon(id, req.user);
        
        if (!existing) {
            return res.status(404).json({ message: "Дополнение не найдено" });
        }
        
        res.status(200).json(await withInventoryAndEmployee(existing.addon));
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
        
        const where = {
            nextReplacementDate: {
                lte: futureDate
            }
        };

        if (!isAdminUser(req.user)) {
            const employees = await prisma.employee.findMany({
                where: { userId: req.user.id },
                select: { id: true }
            });
            const inventory = await prisma.inventory.findMany({
                where: { employeeId: { in: employees.map(employee => employee.id) } },
                select: { id: true }
            });
            where.inventoryId = { in: inventory.map(item => item.id) };
        }
        
        const expiringAddons = await prisma.inventoryAddon.findMany({
            where: {
                ...where
            },
            orderBy: {
                nextReplacementDate: 'asc'
            }
        });
        
        res.status(200).json(await Promise.all(expiringAddons.map(withInventoryAndEmployee)));
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
