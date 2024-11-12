// routes/portfolioRoute.js
const express = require('express');
const { getPortfolio ,depositFunds,withdrawFunds,
     getPortfolioPerformance,checkFavoriteStatus,
     toggleFavorite,
     removeFavorite,getFavoriteStocks, getStockData ,getLatestStockPrice} = require("../controllers/PortfolioController")
const { auth} = require('../middleware/auth'); // וודא שה-middlewae טעון כראוי

const router = express.Router();

router.get('/portfolio',auth, getPortfolio);
router.post('/portfolio/deposit' , auth,depositFunds);
router.post('/portfolio/withdraw',auth,withdrawFunds);
router.get('/portfolio/performance',auth,getPortfolioPerformance);
router.get('/portfolio/favorites/:ticker' , auth , checkFavoriteStatus);
router.post('/portfolio/favorite', auth,toggleFavorite);
router.delete('/portfolio/favorites/:ticker',auth,removeFavorite);
router.get('/portfolio/favorites', auth,getFavoriteStocks);
router.get('/portfolio/stock/:ticker',auth,getStockData);
router.get('/portfolio/stock/:ticker/latest',auth,getLatestStockPrice);

module.exports = router;
