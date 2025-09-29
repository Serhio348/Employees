const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/Auth');
const { 
    all,
    item,
    getEmployeeInventory,
    add,
    edit,
    remove
} = require('../controllers/Inventory');

///   /api/inventory
router.get('/', auth, all);

///   /api/inventory/:id
router.get('/:id', auth, item);

///   /api/inventory/employee/:employeeId
router.get('/employee/:employeeId', auth, getEmployeeInventory);

///   /api/inventory/add
router.post('/add', auth, add);

///   /api/inventory/edit/:id
router.put('/edit/:id', auth, edit);

///   /api/inventory/remove/:id
router.delete('/remove/:id', auth, remove);

module.exports = router;