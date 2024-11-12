// controllers/portfolioController.js
const Portfolio = require('../models/portfolio');
const { get } = require('../models/position');
const yahooFinance = require('yahoo-finance2').default;

const getPortfolio = async (req, res) => {
    try {
      const portfolio = await Portfolio.findOne({ user: req.user._id })
        .populate('user', 'name')
        .exec();
  
      if (!portfolio) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
  
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
  const depositFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        let portfolio = await Portfolio.findOne({ user: userId });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        portfolio.cash_balance += parseFloat(amount);
        await portfolio.save();

        res.status(200).json({ message: 'Funds deposited successfully', cash_balance: portfolio.cash_balance });
    } catch (error) {
        res.status(500).json({ message: "Error depositing funds", error });
    }
};

const withdrawFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user._id;

        let portfolio = await Portfolio.findOne({ user: userId });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found" });
        }

        const withdrawalAmount = parseFloat(amount);
        if (portfolio.cash_balance < withdrawalAmount) {
            return res.status(400).json({ message: "Insufficient funds for withdrawal" });
        }

        portfolio.cash_balance -= withdrawalAmount;
        await portfolio.save();

        res.status(200).json({ message: 'Funds withdrawn successfully', cash_balance: portfolio.cash_balance });
    } catch (error) {
        res.status(500).json({ message: "Error withdrawing funds", error });
    }
};  

const getPortfolioPerformance = async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolio = await Portfolio.findOne({ user: userId });
    if (!portfolio) return res.status(404).json({ message: "Portfolio not found" });

    const now = new Date();
    const oneWeekAgo = new Date(now);
    const oneMonthAgo = new Date(now);

    oneWeekAgo.setDate(now.getDate() - 7);
    oneMonthAgo.setMonth(now.getMonth() - 1);

    // יצירת מערכים לתאריכים
    const dailyPerformance = calculatePerformanceForRange(portfolio.transactions, 7); // הוספת תאריכים וערכים ליומי
    const dailyLabels = generateDateLabels(7);

    const weeklyPerformance = calculatePerformanceForRange(portfolio.transactions, 7);
    const weeklyLabels = generateDateLabels(7);

    const monthlyPerformance = calculatePerformanceForRange(portfolio.transactions, 30);
    const monthlyLabels = generateDateLabels(30);

    res.json({ dailyPerformance, dailyLabels, weeklyPerformance, weeklyLabels, monthlyPerformance, monthlyLabels, cash_balance: portfolio.cash_balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// פונקציה לחישוב הביצועים עבור כל טווח זמן
const calculatePerformanceForRange = (transactions, daysRange) => {
  let performance = [];

  for (let i = 0; i < daysRange; i++) {
    const dateToCheck = new Date();
    dateToCheck.setDate(dateToCheck.getDate() - i);

    const transactionsForDay = transactions.filter(transaction =>
      new Date(transaction.date).toDateString() === dateToCheck.toDateString()
    );

    const dailyProfitOrLoss = calculateProfitOrLoss(transactionsForDay);
    performance.unshift(dailyProfitOrLoss);
  }

  return performance;
};

// פונקציה ליצירת מערך תאריכים
const generateDateLabels = (daysRange) => {
  let labels = [];
  
  for (let i = 0; i < daysRange; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.unshift(date.toLocaleDateString()); // פורמט תאריך מתאים
  }
  
  return labels;
};

// חישוב רווח/הפסד לכל יום
const calculateProfitOrLoss = (transactions) => {
  let totalProfitOrLoss = 0;
  transactions.forEach(transaction => {
    if (transaction.type === 'Sell' || transaction.type === 'Cover' || transaction.type === 'Buy') {
      const profitOrLoss = (transaction.price) * transaction.shares;
      totalProfitOrLoss += profitOrLoss;
    }
  });

  return totalProfitOrLoss;
};

// Route to check if a stock is in favorites
const checkFavoriteStatus = async (req , res) => {
  try {
    const userId = req.user._id;
    const { ticker } = req.params;

    // מציאת הפורטפוליו של המשתמש
    const portfolio = await Portfolio.findOne({ user: userId });

    // בדיקה אם הפורטפוליו קיים והאם יש לו רשימת מועדפים
    if (!portfolio || !portfolio.favorites) {
      return res.json({ isFavorite: false });
    }

    // בדיקה אם המניה נמצאת במועדפים
    const isFavorite = portfolio.favorites.includes(ticker);
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
const getFavoriteStocks = async (req, res) => {
  try {
    const userId = req.user._id;
    const portfolio = await Portfolio.findOne({ user: userId });

    if (!portfolio || portfolio.favorites.length === 0) {
      return res.json([]);
    }

    // Fetching the closing prices for each favorite ticker
    const favoriteData = await Promise.all(
      portfolio.favorites.map(async (ticker) => {
        const stockData = await getClosingPrice(ticker); // Your function to get closing prices
        return { ticker, ...stockData };
      })
    );

    res.json(favoriteData);
  } catch (error) {
    console.error("Error fetching favorite stocks:", error);
    res.status(500).json({ error: "Failed to fetch favorite stocks." });
  }
};

// Helper function to get closing price (example with Yahoo Finance)
const getClosingPrice = async (ticker) => {
  try {
    const result = await yahooFinance.quote(ticker);
    return { close: result.regularMarketPreviousClose };
  } catch (error) {
    console.error(`Failed to fetch data for ${ticker}:`, error);
    return { close: null };
  }
};

// Route to add/remove favorite
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user is populated from authentication middleware
    const { ticker } = req.body;

    // Find the user's portfolio, or create one if it doesn't exist
    let portfolio = await Portfolio.findOne({ user: userId });

    // If no portfolio is found, create a new one with the user ID
    if (!portfolio) {
      portfolio = new Portfolio({ user: userId, favorites: [] });
    }

    // Ensure favorites is an array (in case it's uninitialized)
    if (!portfolio.favorites) {
      portfolio.favorites = [];
    }

    // Toggle the favorite status of the specified ticker
    const isFavorite = portfolio.favorites.includes(ticker);
    if (isFavorite) {
      portfolio.favorites = portfolio.favorites.filter(fav => fav !== ticker);
    } else {
      portfolio.favorites.push(ticker);
    }

    // Save the updated portfolio
    await portfolio.save();
    res.json({ isFavorite: !isFavorite });
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    res.status(500).json({ error: "Failed to toggle favorite status" });
  }
};

const removeFavorite = async (req , res ) => {
  try {
    const userId = req.user._id;
    const { ticker } = req.params;

    // חיפוש הפורטפוליו ועדכון רשימת המועדפים
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: userId },
      { $pull: { favorites: ticker } },
      { new: true }
    );

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getStockData = async (req, res) => {
  const { ticker } = req.params;
  try {
    // Fetch historical data
    const historicalData = await yahooFinance.historical(ticker, {
      period1: '2024-08-01', // Start date for historical data
      interval: '1d'
    });

    const formattedPrices = historicalData.map(day => ({
      date: day.date,
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close
    }));

    const stockData = await yahooFinance.quote(ticker); // No need to specify modules

    const closePrice = stockData.regularMarketPreviousClose;
    const currentPrice = stockData.regularMarketPrice;
    const change = ((currentPrice - closePrice) / closePrice * 100).toFixed(2);

    res.json({ closePrice: currentPrice, change, prices: formattedPrices });
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};

// Controller function to get the latest stock price
const getLatestStockPrice = async (req, res) => {
  const { ticker } = req.params;
  try {
    const stockData = await yahooFinance.quote(ticker);
    const currentPrice = stockData.regularMarketPrice;
    const previousClose = stockData.regularMarketPreviousClose;
    const change = ((currentPrice - previousClose) / previousClose * 100).toFixed(2);

    res.json({ currentPrice, change });
  } catch (error) {
    console.error('Error fetching latest stock price:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
};

module.exports = { getPortfolio , 
  depositFunds,withdrawFunds,
   getPortfolioPerformance,checkFavoriteStatus,toggleFavorite ,
   removeFavorite, getFavoriteStocks,getStockData , getLatestStockPrice};
