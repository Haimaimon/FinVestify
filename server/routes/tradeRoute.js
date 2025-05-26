const express = require("express");
const router = express.Router();
const { getAllTrades , deleteTrade  } = require("../controllers/tradeController");
const { auth } = require("../middleware/auth");

router.get("/", auth,getAllTrades);
router.delete("/:id", deleteTrade);

module.exports = router;
