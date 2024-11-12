// models/Position.js
const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  ticker: { type: String, required: true },
  shares: { type: Number, required: true },
  average_price: { type: Number, required: true },
  position_type: { type: String, required: true, enum: ['Long', 'Short'] } // מציין אם רגילה או שורט
});

module.exports = PositionSchema;
