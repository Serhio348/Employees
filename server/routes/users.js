const express = require('express');
const { auth } = require('../middleware/Auth')
const router = express.Router();

const { login, register, current } = require('../controllers/users')

/* api/user/login */
router.post('/login', login);

/* api/user/register */
router.post('/register', register);

/* api/user/current */
router.get('/current', auth, current);

module.exports = router;
