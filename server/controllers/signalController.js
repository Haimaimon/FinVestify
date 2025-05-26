const PendingSignal = require("../models/pendingSignal");
const { parseSignal } = require("../utils/parseSignal");
const { trackSignal } = require("../utils/priceWatcher");

exports.handleSignal = async (req, res) => {
  const { message } = req.body;
  const signal = parseSignal(message);
  if (!signal) return res.status(400).json({ error: "פורמט הודעה לא תקין" });

  try {
    const saved = await PendingSignal.create(signal);

    // שליחת נוטיפיקציה ללקוח
    const io = req.app.get("socketio");
    io.emit("pending_created", saved);

    // התחלת מעקב מיידי אחרי המחיר
    trackSignal(saved, io);

    // הדפסות לטרמינל
    console.log(`📩 התקבלה פקודת ${signal.direction} ל־${signal.asset}`);
    console.log(`👉 מחיר כניסה שנבחר: ${signal.entry}`);

    res.json({ message: "📡 הפקודה נשמרה, מעקב התחיל" });
  } catch (err) {
    console.error("❌ שגיאה בשמירת פקודה:", err.message);
    res.status(500).json({ error: "שגיאה בשמירת פקודה" });
  }
};
