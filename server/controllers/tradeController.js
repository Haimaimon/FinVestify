const Trade = require("../models/trade");
const PendingSignal = require("../models/pendingSignal");
const { intervalMap } = require("../utils/priceWatcher");

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find().sort({ executedAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשליפת טריידים" });
  }
};

exports.getPendingSignals = async (req, res) => {
  try {
    const signals = await PendingSignal.find().sort({ createdAt: -1 });
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשליפת פקודות פתוחות" });
  }
};
exports.deletePendingSignal = async (req, res) => {
  const { id } = req.params.id;
  console.log(`🗑️ מנסה למחוק פקודה עם ID: ${id}`);
  try {
    // ביטול המעקב בזמן אמת
    if (intervalMap.has(id)) {
      clearInterval(intervalMap.get(id));
      intervalMap.delete(id);
      console.log(`🛑 הופסק מעקב עבור פקודה ${id}`);
    }
    const result = await PendingSignal.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: "פקודה לא נמצאה" });
    res.json({ message: "הפקודה נמחקה בהצלחה" });
  } catch (err) {
    res.status(500).json({ error: "שגיאה במחיקת הפקודה" });
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    await Trade.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ טרייד נמחק בהצלחה" });
  } catch (err) {
    res.status(500).json({ error: "❌ שגיאה במחיקת טרייד" });
  }
};
