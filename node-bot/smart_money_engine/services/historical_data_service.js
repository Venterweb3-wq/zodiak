const mongoose = require('mongoose');
const BybitAPI = require('../../market_data_collector/bybit_api');
const { calculateIndicators } = require('../utils/indicators');
const appState = require('../utils/app_state');

// Schema for historical price data
const priceHistorySchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  timestamp: { type: Date, required: true },
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, required: true },
  indicators: {
    rsi: Number,
    ema20: Number,
    ema50: Number,
    bbUpper: Number,
    bbMiddle: Number,
    bbLower: Number,
    macd: Number,
    macdSignal: Number,
    macdHistogram: Number,
    trend: String
  }
}, {
  timestamps: true,
  indexes: [
    { symbol: 1, timestamp: -1 }
  ]
});

const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);

class HistoricalDataService {
  constructor() {
    this.bybit = new BybitAPI();
    this.updateInterval = 60 * 60 * 1000; // 1 hour
    this.isRunning = false;
  }

  /**
   * Fetch and store historical data for a symbol
   * @param {string} symbol - Trading symbol (e.g., "BTC")
   * @param {number} lookbackHours - How many hours of history to fetch
   */
  async fetchHistoricalData(symbol, lookbackHours = 168) { // 7 days default
    try {
      const symbolPair = `${symbol}USDT`;
      console.log(`[History] Fetching historical data for ${symbolPair}`);
      
      // Get kline data from Bybit
      const klineData = await this.bybit.getKline(symbolPair, '60', lookbackHours);
      
      if (!klineData.result || !klineData.result.list) {
        console.error(`[History] No data received for ${symbolPair}`);
        return null;
      }

      // Transform and prepare data
      const candles = klineData.result.list.reverse().map(candle => ({
        timestamp: new Date(parseInt(candle[0])),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));

      // Calculate indicators for the entire dataset
      const historicalData = candles.map(c => c.close);
      const indicators = calculateIndicators(historicalData);
      
      // Store data with indicators
      const bulkOps = candles.map((candle, index) => {
        const indicatorData = {};
        
        // Only add indicators if we have enough data
        if (index >= 20) { // Need at least 20 periods for most indicators
          indicatorData.rsi = indicators.rsi;
          indicatorData.ema20 = indicators.ema20;
          indicatorData.ema50 = indicators.ema50;
          if (indicators.bb) {
            indicatorData.bbUpper = indicators.bb.upper;
            indicatorData.bbMiddle = indicators.bb.middle;
            indicatorData.bbLower = indicators.bb.lower;
          }
          if (indicators.macd) {
            indicatorData.macd = indicators.macd.MACD;
            indicatorData.macdSignal = indicators.macd.signal;
            indicatorData.macdHistogram = indicators.macd.histogram;
          }
          indicatorData.trend = indicators.trend;
        }

        return {
          updateOne: {
            filter: { symbol, timestamp: candle.timestamp },
            update: {
              $set: {
                ...candle,
                symbol,
                indicators: indicatorData
              }
            },
            upsert: true
          }
        };
      });

      await PriceHistory.bulkWrite(bulkOps);
      console.log(`[History] Stored ${candles.length} candles for ${symbol}`);
      
      return candles;
    } catch (error) {
      console.error(`[History] Error fetching data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Get recent historical data for analysis
   * @param {string} symbol - Trading symbol
   * @param {number} periods - Number of periods to retrieve
   */
  async getRecentData(symbol, periods = 100) {
    try {
      const data = await PriceHistory
        .find({ symbol })
        .sort({ timestamp: -1 })
        .limit(periods)
        .lean();
      
      return data.reverse();
    } catch (error) {
      console.error(`[History] Error retrieving data for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Update historical data for all active symbols
   * @param {Array} symbols - List of symbols to update
   */
  async updateAllSymbols(symbols) {
    console.log(`[History] Updating historical data for ${symbols.length} symbols`);
    
    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      // Check if shutdown was requested
      if (appState.isShutdownRequested()) {
        console.log('[History] 🛑 Остановка обновления исторических данных по запросу...');
        break;
      }
      
      const batch = symbols.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(symbol => this.fetchHistoricalData(symbol, 24)) // Last 24 hours
      );
      
      // Wait between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Start continuous data collection
   * @param {Array} symbols - List of symbols to track
   */
  async startContinuousCollection(symbols) {
    if (this.isRunning) {
      console.log('[History] Continuous collection already running');
      return;
    }

    this.isRunning = true;
    console.log('[History] Starting continuous historical data collection');

    // Initial fetch
    await this.updateAllSymbols(symbols);

    // Set up interval for updates
    this.updateInterval = setInterval(async () => {
      if (this.isRunning && !appState.isShutdownRequested()) {
        await this.updateAllSymbols(symbols);
      } else if (appState.isShutdownRequested()) {
        this.stopContinuousCollection();
      }
    }, this.updateInterval);
  }

  /**
   * Stop continuous data collection
   */
  stopContinuousCollection() {
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    console.log('[History] Stopped continuous collection');
  }

  /**
   * Alias for stopContinuousCollection for graceful shutdown
   */
  async stopCollection() {
    return this.stopContinuousCollection();
  }

  /**
   * Clean up old data
   * @param {number} daysToKeep - Number of days of history to keep
   */
  async cleanupOldData(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await PriceHistory.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`[History] Cleaned up ${result.deletedCount} old records`);
  }
}

module.exports = HistoricalDataService; 