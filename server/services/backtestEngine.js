const axios = require("axios");
const { formatChartData } = require("../utils/chartDataFormatter");
require("dotenv").config();

const API_KEY = process.env.TWELVE_DATA_API_KEY;

async function fetchHistoricalData(asset, startDate, endDate) {
  const url = `https://api.twelvedata.com/time_series?symbol=${asset}&interval=1h&start_date=${startDate}&end_date=${endDate}&apikey=${API_KEY}`;
  const { data } = await axios.get(url);

  if (!data || !data.values) throw new Error("No historical data found");

  return data.values.reverse(); // oldest first
}

exports.runBacktest = async (params) => {
  const { asset, direction, entry, takeProfit, stopLoss, startDate, endDate } = params;
  const data = await fetchHistoricalData(asset, startDate, endDate);

  const trades = [];
  let positionOpen = false;

  // 🧠 בדיקת תנאי כניסה – האם בכלל המחיר שהוגדר נכנס בטווח הנתונים ההיסטוריים
  const allPrices = data.map((c) => parseFloat(c.close));
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);

  if (entry < minPrice || entry > maxPrice) {
    throw new Error(`❌ Entry price ${entry} is out of historical range (${minPrice} - ${maxPrice})`);
  }

  if (takeProfit < minPrice || takeProfit > maxPrice) {
    throw new Error(`❌ Take Profit price ${takeProfit} is out of historical range (${minPrice} - ${maxPrice})`);
  }

  if (stopLoss < minPrice || stopLoss > maxPrice) {
    throw new Error(`❌ Stop Loss price ${stopLoss} is out of historical range (${minPrice} - ${maxPrice})`);
  }

  for (const candle of data) {
    const price = parseFloat(candle.close);
    const time = candle.datetime;

    if (!positionOpen) {
      if (
        (direction === "BUY" && price <= entry) ||
        (direction === "SELL" && price >= entry)
      ) {
        trades.push({ type: "entry", price, time });
        positionOpen = true;
      }
    } else {
      const tpHit =
        takeProfit !== null &&
        ((direction === "BUY" && price >= takeProfit) ||
          (direction === "SELL" && price <= takeProfit));

      const slHit =
        stopLoss !== null &&
        ((direction === "BUY" && price <= stopLoss) ||
          (direction === "SELL" && price >= stopLoss));

      if (tpHit || slHit) {
        trades.push({ type: "exit", price, time });
        positionOpen = false;
      }
    }
  }

  const pnl = calculatePnL(trades, direction);

  return {
    asset,
    trades,
    pnl,
    chartData: formatChartData(data, trades),
  };
};

function calculatePnL(trades, direction) {
  if (trades.length < 2) return 0;
  const entry = trades.find((t) => t.type === "entry").price;
  const exit = trades.find((t) => t.type === "exit").price;
  return direction === "BUY" ? exit - entry : entry - exit;
}
