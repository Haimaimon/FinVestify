// service/stockHistoryService.js
const axios = require('axios');
const dayjs = require('dayjs');

// Finnhub למשל
const FINHUB_API_KEY = process.env.FINHUB_API_KEY || 'YOUR_FINNHUB_TOKEN';

async function getHistoricalPrice(ticker, year) {
  // לצורך דוגמה: נחשב את טווח התאריכים של אותה שנה
  const startOfYear = dayjs(`${year}-01-01`).startOf('day');
  const endOfYear = dayjs(`${year}-12-31`).endOf('day');

  // הופכים ל-UNIX timestamp
  const fromTS = startOfYear.unix(); 
  const toTS = endOfYear.unix();

  // לדוגמה משתמשים ב- Finnhub Stock Candle
  // https://finnhub.io/docs/api/stock-candles
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${fromTS}&to=${toTS}&token=${FINHUB_API_KEY}`;

  const response = await axios.get(url);

  // התשובה עשויה לכלול שדות c, h, l, o, t (arrays)
  // בחלק מהמקרים אם אין מידע יחזור s='no_data'
  const data = response.data;

  if (data.s === 'no_data') {
    return null;
  }

  // ניקח מחיר פתיחה של היום הראשון ומחיר סגירה של היום האחרון
  // (אפשר הגדרה אחרת, ממוצע וכד').
  // c (close) הוא מערך של מחירי סגירה בכל יום, t הוא מערך של timestamps
  // למשל:
  // c: [150.12, 151.3, 152.0, ...]
  // o: [149.2, ...]
  // t: [1640995200, 1641081600, ...]
  
  // ניקח את האלמנט הראשון והאחרון
  const n = data.c.length;
  if (n === 0) return null;

  const firstClose = data.c[0];
  const lastClose = data.c[n - 1];

  return {
    ticker,
    year,
    firstClose,
    lastClose
  };
}

function calcPercentageChange(oldVal, newVal) {
  if (oldVal === 0) return null;
  return ((newVal - oldVal) / oldVal) * 100;
}

module.exports = {
  getHistoricalPrice,
  calcPercentageChange
};
