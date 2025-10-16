const mongoose = require('mongoose');
const EventEmitter = require('events');
const Signal = require('../models/Signal');

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

class SignalTracker extends EventEmitter {
  constructor() {
    super();
    this.activeSignals = new Map();
    this.checkInterval = null;
  }

  /**
   * Create a new signal from analysis result
   * @param {Object} analysisResult - Result from analyzeCoin
   * @param {Object} marketData - Current market data
   * @param {number} ttlHours - Time to live in hours (default 24)
   */
  async createSignal(analysisResult, marketData, ttlHours = 24) {
    if (analysisResult.recommendation === 'wait') {
      return null;
    }

    // Check if similar signal already exists (same symbol, type, and recent)
    const recentCutoff = new Date();
    recentCutoff.setMinutes(recentCutoff.getMinutes() - 30); // 30 minutes ago
    
    const existingSignal = await Signal.findOne({
      symbol: marketData.symbol,
      type: analysisResult.recommendation,
      status: { $in: ['pending', 'active'] },
      createdAt: { $gte: recentCutoff }
    });

    if (existingSignal) {
      console.log(`[SignalTracker] Similar ${analysisResult.recommendation.toUpperCase()} signal for ${marketData.symbol} already exists, skipping`);
      return existingSignal;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const signal = new Signal({
      symbol: marketData.symbol,
      type: analysisResult.recommendation,
      entryPrice: marketData.price,
      entryZone: analysisResult.entry_zone,
      stopLoss: analysisResult.stop_loss,
      takeProfit: analysisResult.take_profit,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      expiresAt,
      marketConditions: {
        funding_rate: marketData.avg_funding_rate,
        long_liquidations: marketData.sum_long_liquidations_usd,
        short_liquidations: marketData.sum_short_liquidations_usd,
        open_interest: marketData.avg_open_interest_usd
      }
    });

    await signal.save();
    this.activeSignals.set(signal._id.toString(), signal);
    
    this.emit('signal:created', signal);
    console.log(`[SignalTracker] New ${signal.type.toUpperCase()} signal created for ${signal.symbol}`);
    
    return signal;
  }

  /**
   * Update signal status based on current price
   * @param {string} signalId - Signal ID
   * @param {number} currentPrice - Current market price
   */
  async updateSignalStatus(signalId, currentPrice) {
    const signal = await Signal.findById(signalId);
    if (!signal || signal.status !== 'pending' && signal.status !== 'active') {
      return null;
    }

    // Check if price entered the entry zone
    if (signal.status === 'pending') {
      if (currentPrice >= signal.entryZone.from && currentPrice <= signal.entryZone.to) {
        signal.status = 'active';
        signal.activatedAt = new Date();
        await signal.save();
        
        this.emit('signal:activated', signal);
        console.log(`[SignalTracker] Signal activated for ${signal.symbol} at ${currentPrice}`);
      }
    }

    // Check if active signal hit TP or SL
    if (signal.status === 'active') {
      let hitTarget = false;
      
      if (signal.type === 'buy') {
        if (currentPrice >= signal.takeProfit) {
          signal.status = 'hit_tp';
          signal.result = this.calculateResult(signal, currentPrice);
          hitTarget = true;
        } else if (currentPrice <= signal.stopLoss) {
          signal.status = 'hit_sl';
          signal.result = this.calculateResult(signal, currentPrice);
          hitTarget = true;
        }
      } else { // sell
        if (currentPrice <= signal.takeProfit) {
          signal.status = 'hit_tp';
          signal.result = this.calculateResult(signal, currentPrice);
          hitTarget = true;
        } else if (currentPrice >= signal.stopLoss) {
          signal.status = 'hit_sl';
          signal.result = this.calculateResult(signal, currentPrice);
          hitTarget = true;
        }
      }

      if (hitTarget) {
        signal.closedAt = new Date();
        await signal.save();
        
        this.activeSignals.delete(signalId);
        this.emit('signal:closed', signal);
        console.log(`[SignalTracker] Signal ${signal.status} for ${signal.symbol} at ${currentPrice}`);
      }
    }

    // Check expiration
    if (new Date() > signal.expiresAt && signal.status === 'pending') {
      signal.status = 'expired';
      signal.closedAt = new Date();
      await signal.save();
      
      this.activeSignals.delete(signalId);
      this.emit('signal:expired', signal);
      console.log(`[SignalTracker] Signal expired for ${signal.symbol}`);
    }

    return signal;
  }

  /**
   * Calculate PnL for a closed signal
   * @param {Object} signal - Signal object
   * @param {number} exitPrice - Exit price
   */
  calculateResult(signal, exitPrice) {
    const entryPrice = signal.activatedAt ? signal.entryPrice : 
                       (signal.entryZone.from + signal.entryZone.to) / 2;
    
    let pnlPercent;
    if (signal.type === 'buy') {
      pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
    } else {
      pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
    }

    return {
      pnl: pnlPercent * 1000, // Assuming $1000 position size
      pnlPercent,
      actualExitPrice: exitPrice
    };
  }

  /**
   * Get all active signals
   */
  async getActiveSignals() {
    const signals = await Signal.find({
      status: { $in: ['pending', 'active'] }
    }).sort({ createdAt: -1 });
    
    return signals;
  }

  /**
   * Update all active signals with current prices
   * @param {Function} priceGetter - Function to get current price for a symbol
   */
  async updateSignals(priceGetter) {
    const activeSignals = await this.getActiveSignals();
    let updated = 0;
    let errors = 0;
    
    console.log(`📊 Обновление ${activeSignals.length} активных сигналов...`);
    
    for (const signal of activeSignals) {
      try {
        const currentPrice = await priceGetter(signal.symbol);
        if (currentPrice) {
          const oldStatus = signal.status;
          await this.updateSignalStatus(signal._id.toString(), currentPrice);
          
          // Check if status changed
          const updatedSignal = await Signal.findById(signal._id);
          if (updatedSignal && updatedSignal.status !== oldStatus) {
            updated++;
            console.log(`🔄 ${signal.symbol}: ${oldStatus} → ${updatedSignal.status} @ $${currentPrice}`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ Ошибка обновления сигнала ${signal.symbol}:`, error.message);
      }
    }
    
    if (updated > 0 || errors > 0) {
      console.log(`✅ Обновлено сигналов: ${updated}, ошибок: ${errors}`);
    } else {
      console.log(`✅ Все сигналы актуальны`);
    }
    
    return { updated, errors };
  }

  /**
   * Get signal performance statistics
   * @param {number} days - Number of days to look back
   */
  async getPerformanceStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const closedSignals = await Signal.find({
      status: { $in: ['hit_tp', 'hit_sl'] },
      closedAt: { $gte: startDate }
    });

    const stats = {
      totalSignals: closedSignals.length,
      winningSignals: 0,
      losingSignals: 0,
      totalPnL: 0,
      avgWin: 0,
      avgLoss: 0,
      winRate: 0,
      profitFactor: 0
    };

    let totalWins = 0;
    let totalLosses = 0;

    closedSignals.forEach(signal => {
      if (signal.result && signal.result.pnlPercent) {
        stats.totalPnL += signal.result.pnlPercent;
        
        if (signal.result.pnlPercent > 0) {
          stats.winningSignals++;
          totalWins += signal.result.pnlPercent;
        } else {
          stats.losingSignals++;
          totalLosses += Math.abs(signal.result.pnlPercent);
        }
      }
    });

    if (stats.winningSignals > 0) {
      stats.avgWin = totalWins / stats.winningSignals;
    }
    if (stats.losingSignals > 0) {
      stats.avgLoss = totalLosses / stats.losingSignals;
    }
    if (stats.totalSignals > 0) {
      stats.winRate = (stats.winningSignals / stats.totalSignals) * 100;
    }
    if (totalLosses > 0) {
      stats.profitFactor = totalWins / totalLosses;
    }

    return stats;
  }

  /**
   * Start monitoring active signals
   * @param {Function} priceGetter - Function to get current price for a symbol
   * @param {number} intervalMs - Check interval in milliseconds
   */
  startMonitoring(priceGetter, intervalMs = 60000) {
    if (this.checkInterval) {
      console.log('[SignalTracker] Monitoring already running');
      return;
    }

    console.log('[SignalTracker] Starting signal monitoring');
    
    this.checkInterval = setInterval(async () => {
      const activeSignals = await this.getActiveSignals();
      
      for (const signal of activeSignals) {
        try {
          const currentPrice = await priceGetter(signal.symbol);
          if (currentPrice) {
            await this.updateSignalStatus(signal._id.toString(), currentPrice);
          }
        } catch (error) {
          console.error(`[SignalTracker] Error updating signal ${signal._id}:`, error.message);
        }
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring signals
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[SignalTracker] Stopped signal monitoring');
    }
  }

  /**
   * Clean up old signals
   * @param {number} daysToKeep - Number of days to keep
   */
  async cleanupOldSignals(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Signal.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['expired', 'cancelled'] }
    });
    
    console.log(`[SignalTracker] Cleaned up ${result.deletedCount} old signals`);
  }
}

module.exports = SignalTracker; 