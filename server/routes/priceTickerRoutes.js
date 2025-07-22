// routes/priceTickerRoutes.js
const express = require("express");
const router = express.Router();
const { getTickerPrices } = require("../controllers/priceTickerController");
const { auth} = require("../middleware/auth");

router.get("/tickers",auth, getTickerPrices);

module.exports = router;
