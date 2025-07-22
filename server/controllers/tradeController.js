const Trade = require("../models/trade");
const PendingSignal = require("../models/pendingSignal");
const { intervalMap } = require("../utils/priceWatcher");

exports.getAllTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user._id }).sort({ executedAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשליפת טריידים" });
  }
};

exports.getPendingSignals = async (req, res) => {
  try {
    const signals = await PendingSignal.find({ user: req.user._id }).sort({ createdAt: -1 });
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
    const result = await Trade.deleteMany({ groupId: req.params.id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "❗לא נמצאו טריידים עם groupId כזה" });
    }

    res.json({ message: "✅ כל הטריידים נמחקו בהצלחה לפי groupId" });
  } catch (err) {
    console.error("❌ שגיאה בשרת במחיקת טרייד:", err);
    res.status(500).json({ error: "❌ שגיאה במחיקת טרייד", details: err.message });
  }
};

