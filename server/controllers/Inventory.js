const { prisma } = require('../../prisma/prisma-client');
const { getAccessibleEmployee, getAccessibleInventoryItem, isAdminUser } = require('../utils/access');

/**
 * @route GET /api/inventory
 * @desc Получение всех предметов инвентаря
 * @access Private
 */
const all = async (req, res) => {
    try {
        const where = isAdminUser(req.user)
            ? {}
            : {
                employeeId: {
                    in: (await prisma.employee.findMany({
                        where: { userId: req.user.id },
                        select: { id: true }
                    })).map(employee => employee.id)
                }
            };

        const inventory = await prisma.inventory.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(inventory);
    } catch (error) {
        console.error('Get inventory error:', error);
        res.status(400).json({ message: 'Не удалось получить инвентарь' });
    }
};

/**
 * @route GET /api/inventory/:id
 * @desc Получение конкретного предмета инвентаря
 * @access Private
 */
const item = async (req, res) => {
    const { id } = req.params;

    try {
        const inventoryItem = await getAccessibleInventoryItem(prisma, id, req.user);

        if (!inventoryItem) {
            return res.status(404).json({ message: "Предмет не найден" });
        }

        res.status(200).json(inventoryItem);
    } catch (error) {
        console.error('Get inventory item error:', error);
        res.status(500).json({ message: "Не удалось получить предмет" });
    }
};

/**
 * @route GET /api/inventory/employee/:employeeId
 * @desc Получение инвентаря сотрудника
 * @access Private
 */
const getEmployeeInventory = async (req, res) => {
    const { employeeId } = req.params;

    try {
        const employee = await getAccessibleEmployee(prisma, employeeId, req.user);
        if (!employee) {
            return res.status(404).json({ message: "Сотрудник не найден" });
        }

        const inventory = await prisma.inventory.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json(inventory);
    } catch (error) {
        console.error('Get employee inventory error:', error);
        res.status(500).json({ message: "Не удалось получить инвентарь сотрудника" });
    }
};

/**
 * @route POST /api/inventory/add
 * @desc Добавление предмета в инвентарь
 * @access Private
 */
const add = async (req, res) => {
    try {
        const data = req.body;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        
        if (!data.itemName || !data.itemType || !data.employeeId || !data.issueDate) {
            console.log('Validation failed - missing fields:', {
                itemName: !!data.itemName,
                itemType: !!data.itemType,
                employeeId: !!data.employeeId,
                issueDate: !!data.issueDate
            });
            return res.status(400).json({ message: "Название предмета, тип, дата выдачи и ID сотрудника обязательны" });
        }

        const employee = await getAccessibleEmployee(prisma, data.employeeId, req.user);
        if (!employee) {
            return res.status(404).json({ message: "Сотрудник не найден" });
        }
        
        const inventoryItem = await prisma.inventory.create({
            data: {
                itemName: data.itemName,
                itemType: data.itemType,
                issueDate: new Date(data.issueDate),
                quantity: parseInt(data.quantity) || 1,
                status: data.status || "выдан",
                employeeId: data.employeeId,
            },
        });
        
        res.status(201).json(inventoryItem);
    } catch (error) {
        console.error('Add inventory item error:', error);
        res.status(500).json({ message: "Не удалось добавить предмет", error: error.message });
    }
};

/**
 * @route PUT /api/inventory/edit/:id
 * @desc Редактирование предмета инвентаря
 * @access Private
 */
const edit = async (req, res) => {
    const data = req.body;
    const { id } = req.params;

    try {
        const existing = await getAccessibleInventoryItem(prisma, id, req.user);
        if (!existing) {
            return res.status(404).json({ message: "Предмет не найден" });
        }
        
        const inventoryItem = await prisma.inventory.update({
            where: { id },
            data: {
                itemName: data.itemName,
                itemType: data.itemType,
                issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
                quantity: data.quantity ? parseInt(data.quantity) : undefined,
                status: data.status,
            },
        });

        res.status(200).json(inventoryItem);
    } catch (error) {
        console.error('Edit inventory item error:', error);
        res.status(500).json({ message: "Не удалось обновить предмет", error: error.message });
    }
};

/**
 * @route DELETE /api/inventory/remove/:id
 * @desc Удаление предмета из инвентаря
 * @access Private
 */
const remove = async (req, res) => {
    const { id } = req.params;

    try {
        const existing = await getAccessibleInventoryItem(prisma, id, req.user);
        if (!existing) {
            return res.status(404).json({ message: "Предмет не найден" });
        }

        await prisma.inventory.delete({
            where: { id },
        });

        res.status(204).json("OK");
    } catch (error) {
        console.error('Delete inventory item error:', error);
        res.status(500).json({ message: "Не удалось удалить предмет" });
    }
};

module.exports = {
    all,
    item,
    getEmployeeInventory,
    add,
    edit,
    remove
};