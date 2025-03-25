// controllers/stockController.js
const { getHistoricalPrice, calcPercentageChange } = require('../utils/stockHistoryService');
const { getStockData } = require('../utils/getStockData');
/**
 * מחזיר מחיר פתיחה/סגירה לשנה מסוימת
 */
exports.getStockYearData = async (req, res) => {
  try {
    const { ticker, year, mode } = req.query;
    // mode יכול להיות 'priceOnly' / 'percentChange' וכדומה.
    
    if (!ticker || !year) {
      return res.status(400).json({ error: 'Missing ticker or year' });
    }

    const histData = await getHistoricalPrice(ticker, year);
    if (!histData) {
      return res.json({ message: 'No data found' });
    }

    // histData = { firstClose, lastClose }
    let result;
    if (mode === 'percentChange') {
      const pct = calcPercentageChange(histData.firstClose, histData.lastClose);
      result = { 
        ...histData,
        percentChange: pct
      };
    } else {
      // רק מחזירים את first/last
      result = histData;
    }

    return res.json(result);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getStockPrice = async (req, res) => {
    try {
        const { ticker } = req.params;
        const data = await getStockData(ticker);
        // מחזיר JSON של Finnhub, לדוגמה: { c: 177.49, h: 178, l: 176.73, o: 177.89, pc: 177.88 }
        return res.json(data);
      } catch (error) {
        console.error('Error fetching stock data:', error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
      }
    };