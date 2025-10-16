/**
 * Priority Queue Module
 * Manages coin analysis priority based on market activity
 */

const { getCacheManager } = require('./cache');

class PriorityManager {
  constructor() {
    this.cache = getCacheManager();
    this.queueName = 'analysis:priority:queue';
  }

  /**
   * Calculate priority score for a coin based on market metrics
   * Higher score = higher priority
   */
  calculatePriority(coinData) {
    let score = 0;

    // Volume weight (40%)
    if (coinData.top_volume_exchange?.volume_usd) {
      const volumeScore = Math.log10(coinData.top_volume_exchange.volume_usd + 1);
      score += volumeScore * 0.4;
    }

    // Liquidation weight (30%)
    const totalLiquidations = (coinData.sum_long_liquidations_usd || 0) + 
                              (coinData.sum_short_liquidations_usd || 0);
    if (totalLiquidations > 0) {
      const liquidationScore = Math.log10(totalLiquidations + 1);
      score += liquidationScore * 0.3;
    }

    // Funding rate extremity weight (20%)
    const fundingExtreme = Math.abs(coinData.avg_funding_rate || 0);
    if (fundingExtreme > 0.005) {
      score += fundingExtreme * 1000 * 0.2;
    }

    // Price volatility weight (10%)
    if (coinData.price_change_24h) {
      const volatilityScore = Math.abs(coinData.price_change_24h);
      score += volatilityScore * 0.1;
    }

    // TODO: Add more factors
    // - Social sentiment score
    // - News impact score
    // - Whale activity score

    return Math.round(score * 100) / 100;
  }

  /**
   * Add coin to priority queue
   */
  async addToQueue(symbol, coinData) {
    const priority = this.calculatePriority(coinData);
    
    const queueItem = {
      symbol,
      priority,
      timestamp: Date.now(),
      metrics: {
        volume: coinData.top_volume_exchange?.volume_usd || 0,
        liquidations: (coinData.sum_long_liquidations_usd || 0) + 
                      (coinData.sum_short_liquidations_usd || 0),
        funding: coinData.avg_funding_rate || 0
      }
    };

    await this.cache.addToPriorityQueue(this.queueName, queueItem, priority);
    
    console.log(`📊 Added ${symbol} to priority queue with score: ${priority}`);
    return priority;
  }

  /**
   * Get next batch of coins to analyze
   */
  async getNextBatch(batchSize = 5) {
    return await this.cache.getFromPriorityQueue(this.queueName, batchSize);
  }

  /**
   * Get top priority coins (alias for getNextBatch)
   */
  async getTopPriority(count = 5) {
    return this.getNextBatch(count);
  }

  /**
   * Get priority queue info
   */
  getPriorityQueue() {
    return {
      hasCoin: async (symbol) => {
        // Check if coin is in priority queue
        const items = await this.cache.getFromPriorityQueue(this.queueName, 100);
        return items.some(item => item.symbol === symbol);
      }
    };
  }

  /**
   * Check if coin should be prioritized for immediate analysis
   */
  shouldPrioritize(coinData) {
    // Extreme funding rate
    if (Math.abs(coinData.avg_funding_rate || 0) > 0.01) {
      return { prioritize: true, reason: 'extreme_funding' };
    }

    // High liquidations
    const totalLiquidations = (coinData.sum_long_liquidations_usd || 0) + 
                              (coinData.sum_short_liquidations_usd || 0);
    if (totalLiquidations > 10000000) { // $10M
      return { prioritize: true, reason: 'high_liquidations' };
    }

    // Liquidation imbalance
    const longLiq = coinData.sum_long_liquidations_usd || 0;
    const shortLiq = coinData.sum_short_liquidations_usd || 0;
    if (longLiq > 0 && shortLiq > 0) {
      const ratio = Math.max(longLiq, shortLiq) / Math.min(longLiq, shortLiq);
      if (ratio > 3) {
        return { prioritize: true, reason: 'liquidation_imbalance' };
      }
    }

    // High volume spike
    // TODO: Compare with historical average
    if (coinData.top_volume_exchange?.volume_usd > 100000000) { // $100M
      return { prioritize: true, reason: 'high_volume' };
    }

    return { prioritize: false, reason: null };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    // TODO: Implement queue size, processing rate, etc.
    return {
      queueSize: 0,
      processingRate: 0,
      averagePriority: 0
    };
  }

  /**
   * Clear the priority queue
   */
  async clearQueue() {
    // TODO: Implement queue clearing
    console.log('Priority queue cleared');
  }
}

// Singleton instance
let priorityInstance;

function getPriorityManager() {
  if (!priorityInstance) {
    priorityInstance = new PriorityManager();
  }
  return priorityInstance;
}

module.exports = {
  PriorityManager,
  getPriorityManager
}; 