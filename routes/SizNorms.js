const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/Auth');
const { 
    all,
    item,
    add,
    edit,
    remove,
    initDefaults
} = require('../controllers/SizNorms');

///   /api/siz-norms
router.get('/', auth, all);

///   /api/siz-norms/:id
router.get('/:id', auth, item);

///   /api/siz-norms/add
router.post('/add', auth, add);

///   /api/siz-norms/edit/:id
router.put('/edit/:id', auth, edit);

///   /api/siz-norms/remove/:id
router.delete('/remove/:id', auth, remove);

///   /api/siz-norms/init-defaults
router.post('/init-defaults', auth, initDefaults);

module.exports = router;
