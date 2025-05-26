const express = require("express");
const router = express.Router();
const { getAllTrades } = require("../controllers/tradeController");
const { auth } = require("../middleware/auth");

router.get("/", auth,getAllTrades);

module.exports = router;
