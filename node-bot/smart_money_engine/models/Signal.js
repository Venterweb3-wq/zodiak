const mongoose = require('mongoose');

// Schema for tracking signals
const signalSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  entryPrice: { type: Number, required: true },
  entryZone: {
    from: { type: Number, required: true },
    to: { type: Number, required: true }
  },
  stopLoss: { type: Number, required: true },
  takeProfit: { type: Number, required: true },
  confidence: { type: Number, required: true },
  reasoning: [String],
  status: { 
    type: String, 
    enum: ['pending', 'active', 'hit_tp', 'hit_sl', 'expired', 'cancelled'],
    default: 'pending'
  },
  activatedAt: Date,
  closedAt: Date,
  result: {
    pnl: Number,
    pnlPercent: Number,
    actualExitPrice: Number,
    maxDrawdown: Number,
    maxProfit: Number
  },
  marketConditions: {
    funding_rate: Number,
    long_liquidations: Number,
    short_liquidations: Number,
    open_interest: Number
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

const Signal = mongoose.model('Signal', signalSchema);

module.exports = Signal; 