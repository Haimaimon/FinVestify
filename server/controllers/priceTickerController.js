// controllers/priceTickerController.js
const axios = require("axios");
require("dotenv").config();

const API_KEY = process.env.TWELVE_DATA_API_KEY;

const symbols = [
  // Forex
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "USD/CHF",
  "USD/CAD",
  "AUD/USD",
  "NZD/USD",

  // Crypto
  "BTC/USD",
  "ETH/USD",
  "BNB/USD",
  "ADA/USD",
  "DOGE/USD",
  "XRP/USD",
  "SOL/USD",
  "DOT/USD",
  "AVAX/USD",
  "LINK/USD",
  "MATIC/USD",
  "LTC/USD",
  "TRX/USD",

  // Commodities
  "XAU/USD", // זהב
  "XAG/USD", // כסף
  "XPT/USD", // פלטינה
  "XPD/USD", // פלדיום
];

exports.getTickerPrices = async (req, res) => {
  try {
    const promises = symbols.map(async (symbol) => {
      try {
        const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
        const { data } = await axios.get(url);
        if (!data || !data.price) throw new Error("Invalid price data");
        return { symbol, price: parseFloat(data.price) };
      } catch (err) {
        console.warn(`⚠️ Failed to fetch price for ${symbol}:`, err.message);
        return { symbol, price: null };
      }
    });

    const results = await Promise.all(promises);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching ticker prices:", err.message);
    res.status(500).json({ error: "Failed to fetch ticker prices" });
  }
};

