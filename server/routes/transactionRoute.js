// routes/transactionRoute.js
const express = require('express');
const { buyStock, sellStock } = require('../controllers/transactionController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/buy', auth, buyStock);
router.post('/sell', auth, sellStock);

module.exports = router;
