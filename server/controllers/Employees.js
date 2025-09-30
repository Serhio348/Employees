const { prisma } = require('../../prisma/prisma-client')

/**
 * @route GET /api/employees
 * @desc Получение всех сотрудников
 * @access Private
 */


const all = async (req, res) => {
    try {
        //////Обращение к БД и нахождение всех сотрудников
        const employees = await prisma.employee.findMany();
        res.status(200).json(employees)
    } catch {
        res.status(400).json({ message: 'Не удалось получить сотрудников' })
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
/**
 * @route POST /api/employees/add
 * @desc Добавление сотрудника
 * @access Private
 */
const add = async (req, res) => {
    try {
        const data = req.body;
        console.log('Received employee data:', data);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Пользователь не авторизован" });
        }
        
        if (!data.firstName || !data.lastName || !data.address || !data.age || !data.profession) {
            console.log('Validation failed - missing fields:', {
                firstName: !!data.firstName,
                lastName: !!data.lastName,
                address: !!data.address,
                age: !!data.age,
                profession: !!data.profession
            });
            return res.status(400).json({ message: "Все поля обязательные" });
        }
        const employee = await prisma.employee.create({
            data: {
                ...data,
                age: parseInt(data.age), // Преобразуем возраст в число
                height: data.height ? parseInt(data.height) : null, // Преобразуем рост в число
                birthDate: data.birthDate ? new Date(data.birthDate) : null, // Преобразуем дату рождения
                userId: req.user.id,
            },
        });

        return res.status(201).json(employee);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Что-то пошло не так" });
    }
}

/**
* @route DELETE /api/employees/remove/:id
* @desc Удаление сотрудника
* @access Private
*/
const remove = async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.employee.delete({
            where: {
                id,
            },
        });

        res.status(204).json("OK");
    } catch {
        res.status(500).json({ message: "Не удалось удалить сотрудника" });
    }
};

/**
 * @route PUT /api/employees/edit/:id
 * @desc Редактирование сотрудника
 * @access Private
 */
const edit = async (req, res) => {
    const data = req.body;
    const id = data.id;

    try {
        await prisma.employee.update({
            where: {
                id,
            },
            data: {
                ...data,
                age: data.age ? parseInt(data.age) : undefined,
                height: data.height ? parseInt(data.height) : null,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
            },
        });

        res.status(204).json("OK");
    } catch (err) {
        res.status(500).json({ message: "Не удалось редактировать сотрудника" });
    }
};

/**
 * @route GET /api/employees/:id
 * @desc Получение сотрудника
 * @access Private
 */
const employee = async (req, res) => {
    const { id } = req.params; // http://localhost:8000/api/employees/9fe371c1-361f-494a-9def-465959ecc098

    try {
        const employee = await prisma.employee.findUnique({
            where: {
                id,
            },
        });

        res.status(200).json(employee);
    } catch {
        res.status(500).json({ message: "Не удалось получить сотрудника" });
    }
};


module.exports = {
    all,
    add,
    remove,
    edit,
    employee
}