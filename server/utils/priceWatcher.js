const PendingSignal = require("../models/pendingSignal");
const Trade = require("../models/trade");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const API_KEY = process.env.TWELVE_DATA_API_KEY;
const intervalMap = new Map();

const getForexPrice = async (symbol) => {
  const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
  const { data } = await axios.get(url);
  const price = parseFloat(data?.price);
  if (isNaN(price)) throw new Error("מחיר לא תקין מה־API");
  return price;
};

const trackSignal = async (signal, io) => {
  const groupId = uuidv4();
  console.log(`👁️‍🗨️ התחיל מעקב עבור ${signal.asset} @ ${signal.entry}`);
  let positionOpen = false;

  const checkAndExecute = async () => {
    try {
      const currentPrice = await getForexPrice(signal.asset);
      console.log(`📈 מחיר נוכחי ל־${signal.asset}: ${currentPrice}`);

      if (!positionOpen) {
        if (
          (signal.direction === "BUY" && currentPrice <= signal.entry) ||
          (signal.direction === "SELL" && currentPrice >= signal.entry)
        ) {
          positionOpen = true;

          const createdTrade = await Trade.create({
            user: signal.user,
            asset: signal.asset,
            direction: signal.direction,
            entry: signal.entry,
            price: currentPrice,
            groupId
          });

          io.emit("trade_executed", createdTrade);
          await PendingSignal.deleteOne({ _id: signal._id });

          const tpInterval = setInterval(async () => {
            try {
              const tpPrice = await getForexPrice(signal.asset);
              console.log(`🎯 בודק TP/SL עבור ${signal.asset}: עכשיו ${tpPrice}`);

              let tpHit = false, slHit = false;

              if (signal.takeProfit) {
                tpHit = (
                  (signal.direction === "BUY" && tpPrice >= signal.takeProfit) ||
                  (signal.direction === "SELL" && tpPrice <= signal.takeProfit)
                );
              }

              if (signal.stopLoss) {
                slHit = (
                  (signal.direction === "BUY" && tpPrice <= signal.stopLoss) ||
                  (signal.direction === "SELL" && tpPrice >= signal.stopLoss)
                );
              }

              if (tpHit || slHit) {
                const exitTrade = await Trade.create({
                  user: signal.user,
                  asset: signal.asset,
                  direction: signal.direction === "BUY" ? "SELL" : "BUY",
                  entry: tpHit ? signal.takeProfit : signal.stopLoss,
                  price: tpPrice,
                  groupId
                });

                io.emit("trade_executed", exitTrade);
                clearInterval(tpInterval);

                const mainId = signal._id.toString();
                if (intervalMap.has(mainId)) {
                  clearInterval(intervalMap.get(mainId));
                  intervalMap.delete(mainId);
                }
              }

            } catch (err) {
              console.error(`❌ שגיאה בבדיקת TP/SL ל־${signal.asset}:`, err.message);
            }
          }, 30000);
        }
      }
    } catch (err) {
      console.error(`❌ שגיאה במחיר ל־${signal.asset}:`, err.message);
    }
  };

  await checkAndExecute();
  const interval = setInterval(checkAndExecute, 30000);
  intervalMap.set(signal._id.toString(), interval);
};

const startAllWatchers = async (io) => {
  const signals = await PendingSignal.find();
  signals.forEach(signal => trackSignal(signal, io));
};

module.exports = { startAllWatchers, trackSignal, intervalMap };