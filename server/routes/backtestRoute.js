const express = require("express");
const router = express.Router();
const { performBacktest } = require("../controllers/backtestController");
const { auth } = require("../middleware/auth");

router.post("/", auth, performBacktest);

module.exports = router;
