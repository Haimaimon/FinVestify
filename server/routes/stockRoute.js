// routes/stocksRoutes.js
const express = require('express');
const router = express.Router();
const { getStockYearData ,getStockPrice} = require('../controllers/stockController');

// GET /api/stocks/year?ticker=AAPL&year=2025&mode=percentChange
router.get('/year', getStockYearData);

router.get('/price/:ticker',getStockPrice);

module.exports = router;
