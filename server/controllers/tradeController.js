const Trade = require("../models/trade");

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find().sort({ executedAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשליפת טריידים" });
  }
};
