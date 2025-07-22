const { runBacktest } = require("../services/backtestEngine");

exports.performBacktest = async (req, res) => {
  const { asset, direction, entry, takeProfit, stopLoss, startDate, endDate } = req.body;

  if (!asset || !entry || !startDate || !endDate) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const result = await runBacktest({
      asset,
      direction,
      entry,
      takeProfit,
      stopLoss,
      startDate,
      endDate,
    });

    res.json(result);
  } catch (err) {
    console.error("❌ Backtest error:", err.message);
    res.status(500).json({ error: "Failed to perform backtest" });
  }
};
