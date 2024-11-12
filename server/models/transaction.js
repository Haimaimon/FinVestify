// models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  ticker: { type: String, required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true, enum: ['Buy', 'Sell', 'Short', 'Cover'] },
  profitOrLoss: { type: Number, required: true },
  closed: { type: Boolean, default: false },
});

module.exports = TransactionSchema;
