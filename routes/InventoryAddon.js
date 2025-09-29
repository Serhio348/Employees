const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/Auth');
const { 
    getInventoryAddons, 
    addInventoryAddon, 
    updateInventoryAddon, 
    deleteInventoryAddon, 
    getInventoryAddon,
    getExpiringAddons
} = require('../controllers/InventoryAddon');

///   /api/inventory-addon/inventory/:inventoryId
router.get('/inventory/:inventoryId', auth, getInventoryAddons);

///   /api/inventory-addon/item/:id
router.get('/item/:id', auth, getInventoryAddon);

///   /api/inventory-addon/expiring
router.get('/expiring', auth, getExpiringAddons);

///   /api/inventory-addon/add
router.post('/add', auth, addInventoryAddon);

///   /api/inventory-addon/:id
router.put('/:id', auth, updateInventoryAddon);

///   /api/inventory-addon/:id
router.delete('/:id', auth, deleteInventoryAddon);

module.exports = router;
