const mongoose = require("mongoose");

const pendingSignalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  asset: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true
  },
  entry: {
    type: Number,
    required: true
  },
  takeProfit: {
    type: Number,
    default: null
  },
  stopLoss: {
    type: Number,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model("PendingSignal", pendingSignalSchema);
