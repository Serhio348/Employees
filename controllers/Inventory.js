const { prisma } = require('../prisma/prisma-client');

/**
 * @route GET /api/inventory
 * @desc Получение всех предметов инвентаря
 * @access Private
 */
const all = async (req, res) => {
    try {
        const inventory = await prisma.inventory.findMany({
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
        const inventoryItem = await prisma.inventory.findUnique({
            where: { id }
        });

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
        console.log('Received inventory data:', data);
        
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
        console.log('Edit inventory - received data:', data);
        
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

        console.log('Edit inventory - updated item:', inventoryItem);
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