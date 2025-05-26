const express = require("express");
const router = express.Router();
const { getPendingSignals ,deletePendingSignal} = require("../controllers/tradeController");
const { auth } = require("../middleware/auth");

router.get("/", auth,getPendingSignals);
router.delete("/:id", auth, deletePendingSignal); // Assuming you want to delete a pending signal by ID
module.exports = router;
