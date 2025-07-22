// controllers/transactionController.js
const Portfolio = require('../models/portfolio');

const buyStock = async (req, res) => {
    try {
        const { ticker, shares, price } = req.body;
        const userId = req.user._id;
        let portfolio = await Portfolio.findOne({ user: userId });
        const sharesNum = parseFloat(shares);
        const priceNum = parseFloat(price);

        const existingPosition = portfolio.positions.find(pos => pos.ticker === ticker);

        if (existingPosition && existingPosition.position_type === 'Short') {
            // Closing or Reducing Short Position
            // Closing or Reducing Short Position
            const profitOrLoss = (existingPosition.average_price - priceNum) * Math.min(existingPosition.shares, sharesNum);
            portfolio.transactions.push({ ticker, shares: sharesNum, price: priceNum, type: 'Buy', profitOrLoss });

            if (existingPosition.shares <= sharesNum) {
                portfolio.positions = portfolio.positions.filter(pos => pos.ticker !== ticker);
            } else {
                existingPosition.shares -= sharesNum;
            }
        } else {
            // Adding to or Initiating Long Position
            if (existingPosition && existingPosition.position_type === 'Long') {
                existingPosition.shares += sharesNum;
                existingPosition.average_price = ((existingPosition.average_price * existingPosition.shares) + (priceNum * sharesNum)) / (existingPosition.shares + sharesNum);
            } else {
                portfolio.positions.push({ ticker, shares: sharesNum, average_price: priceNum, position_type: 'Long' });
            }
            portfolio.transactions.push({ ticker, shares: sharesNum, price: priceNum, type: 'Buy', profitOrLoss: 0 });
        }

        portfolio.cash_balance -= sharesNum * priceNum;
        await portfolio.save();
        res.status(200).json(portfolio);
    } catch (error) {
        res.status(500).json({ message: "Error processing buy order", error });
    }
};

const sellStock = async (req, res) => {
    try {
        const { ticker, shares, price } = req.body;
        const userId = req.user._id;
        let portfolio = await Portfolio.findOne({ user: userId });
        const sharesNum = parseFloat(shares);
        const priceNum = parseFloat(price);

        const existingPosition = portfolio.positions.find(pos => pos.ticker === ticker);

        if (existingPosition && existingPosition.position_type === 'Long' && existingPosition.shares >= sharesNum) {
            // Calculating Profit or Loss
            const profitOrLoss = (priceNum - existingPosition.average_price) * sharesNum;
            portfolio.transactions.push({ ticker, shares: sharesNum, price: priceNum, type: 'Sell', profitOrLoss });
            
            // Reducing Long Position
            existingPosition.shares -= sharesNum;
            if (existingPosition.shares === 0) {
                portfolio.positions = portfolio.positions.filter(pos => pos.ticker !== ticker);
            }

            // Update cash balance based on profit or loss
            portfolio.cash_balance += profitOrLoss; // Add profit or subtract loss
        } else if (existingPosition && existingPosition.position_type === 'Short') {
            // Updating existing Short Position
            existingPosition.shares += sharesNum;
            existingPosition.average_price = ((existingPosition.average_price * existingPosition.shares) + (priceNum * sharesNum)) / (existingPosition.shares + sharesNum);
            portfolio.transactions.push({ ticker, shares: sharesNum, price: priceNum, type: 'Sell', profitOrLoss: 0 });
        } else {
            // Initiating new Short Position
            portfolio.positions.push({ ticker, shares: sharesNum, average_price: priceNum, position_type: 'Short' });
            portfolio.transactions.push({ ticker, shares: sharesNum, price: priceNum, type: 'Sell', profitOrLoss: 0 });
        }

        await portfolio.save();
        res.status(200).json(portfolio);
    } catch (error) {
        res.status(500).json({ message: "Error processing sell order", error });
    }
};

module.exports = { buyStock, sellStock };

