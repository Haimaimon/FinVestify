const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  asset: { type: String, required: true },
  direction: { type: String, enum: ["BUY", "SELL"], required: true },
  entry: { type: Number, required: true },
  price: { type: Number, required: true },
  groupId: { type: String },
  executedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Trade", tradeSchema);
