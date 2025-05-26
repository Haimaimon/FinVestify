const express = require("express");
const router = express.Router();
const { handleSignal } = require("../controllers/signalController");
const { auth } = require('../middleware/auth');

router.post("/",auth, handleSignal);

module.exports = router;
