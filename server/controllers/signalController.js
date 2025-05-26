const axios = require("axios");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const Trade = require("../models/trade");
require("dotenv").config();

const API_KEY = process.env.TWELVE_DATA_API_KEY;

// ניתוח הודעת טרייד
function parseSignal(message) {
  const assetMatch = message.match(/🔔([A-Z/]+)🔔/);
  const direction = message.match(/Direction:\s*(BUY|SELL)/);
  const entry = message.match(/Entry Price:\s*([\d.]+)/);

  const tpMatches = [...message.matchAll(/TP\\d+\\s+([\\d.]+)/g)];
  const tps = tpMatches.map(m => parseFloat(m[1])).filter(n => !isNaN(n));

  let takeProfit = null;

  if (!assetMatch || !direction || !entry) return null;

  const dir = direction[1];
  const entryPrice = parseFloat(entry[1]);

  if (dir === "BUY") {
    const validTps = tps.filter(tp => tp > entryPrice);
    takeProfit = validTps.length ? Math.min(...validTps) : null;
  } else if (dir === "SELL") {
    const validTps = tps.filter(tp => tp < entryPrice);
    takeProfit = validTps.length ? Math.max(...validTps) : null;
  }

  return {
    asset: assetMatch[1],
    direction: dir,
    entry: entryPrice,
    takeProfit
  };
}


// בקשת מחיר נוכחי מ־TwelveData
const getForexPrice = async (symbol) => {
  const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
  const { data } = await axios.get(url);
  const price = parseFloat(data?.price);
  if (isNaN(price)) throw new Error("מחיר לא תקין מה־API");
  return price;
};

// טיפול בהודעת טרייד
exports.handleSignal = async (req, res) => {
  const { message } = req.body;
  const signal = parseSignal(message);
  const io = req.app.get("socketio");

  if (!signal) return res.status(400).json({ error: "פורמט הודעה לא תקין" });

  res.json({ signal });

  let positionOpen = false;
  const groupId = uuidv4(); // מזהה עסקה ייחודי

  const interval = setInterval(async () => {
    try {
      const currentPrice = await getForexPrice(signal.asset);

      console.log(`⏳ ${signal.direction} ${signal.asset} @${currentPrice} (entry ${signal.entry})`);

      // פתיחת פוזיציה
      if (!positionOpen) {
        const shouldEnter =
          (signal.direction === "BUY" && currentPrice <= signal.entry) ||
          (signal.direction === "SELL" && currentPrice >= signal.entry);

        if (shouldEnter) {
          positionOpen = true;

          console.log(`✅ פתיחת פוזיציה: ${signal.direction} ${signal.asset} ב־${currentPrice}`);

          await Trade.create({
            asset: signal.asset,
            direction: signal.direction,
            entry: signal.entry,
            price: currentPrice,
            groupId
          });

          io.emit("trade_executed", {
            asset: signal.asset,
            price: currentPrice,
            entry: signal.entry,
            direction: signal.direction
          });
        }
      }

      // סגירת פוזיציה (מכירה אוטומטית)
      const shouldClose =
        positionOpen &&
        signal.direction === "BUY" &&
        signal.takeProfit &&
        currentPrice >= signal.takeProfit;

      if (shouldClose) {
        positionOpen = false;

        console.log(`💰 סגירת פוזיציה ב־TP: SELL ${signal.asset} ב־${currentPrice}`);

        await Trade.create({
          asset: signal.asset,
          direction: "SELL",
          entry: signal.takeProfit,
          price: currentPrice,
          groupId
        });

        io.emit("trade_executed", {
          asset: signal.asset,
          price: currentPrice,
          entry: signal.takeProfit,
          direction: "SELL"
        });

        clearInterval(interval);
      }
    } catch (error) {
      console.error("❌ שגיאה בבדיקת מחיר:", error.message);
    }
  }, 30000);
};
