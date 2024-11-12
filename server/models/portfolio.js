// models/Portfolio.js
const mongoose = require('mongoose');
const PositionSchema = require('./position');
const TransactionSchema = require('./transaction');

const PortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cash_balance: { type: Number, default: 0 },
  positions: [PositionSchema], // רשימת הפוזיציות הכוללת
  transactions: [TransactionSchema],
  favorites: [{ type: String }],
});

const Portfolio = mongoose.model("Portfolio", PortfolioSchema);

module.exports = Portfolio;
