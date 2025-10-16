/**
 * Модуль для анализа и нахождения уровней поддержки и сопротивления
 * из различных рыночных данных.
 */

const S_R_LEVEL_SIGNIFICANCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

class SupportResistanceAnalyzer {
  constructor(config = {}) {
    this.config = {
      orderBook: {
        depth: config.orderBook?.depth || 20, // Глубина анализа стакана
        volumeRatio: config.orderBook?.volumeRatio || 3.0, // Во сколько раз объем должен превышать средний
      },
      trades: {
        clusterThreshold: config.trades?.clusterThreshold || 0.005, // 0.5% для кластеризации цен
      },
      priceAction: {
        pivotWindow: config.priceAction?.pivotWindow || 5, // Окно для поиска локальных экстремумов
      },
    };
  }

  /**
   * Основной метод, который запускает все анализы и объединяет результаты.
   * @param {object} bybitData - Данные из секции bybit (orderBook, recentTrades, kline).
   * @returns {Array<object>} Массив объектов уровней S/R.
   */
  calculateSupportResistance(bybitData) {
    if (!bybitData) return [];

    const orderBookLevels = this._findOrderBookLevels(bybitData.orderBook, bybitData.ticker?.lastPrice);
    const tradeClusters = this._findTradeClusters(bybitData.recentTrades);
    const priceActionLevels = this._findPriceActionLevels(bybitData.kline);

    // TODO: Implement a more sophisticated merging logic
    const allLevels = [...orderBookLevels, ...tradeClusters, ...priceActionLevels];
    
    // For now, just return a flattened list
    return allLevels.sort((a, b) => b.price - a.price);
  }

  /**
   * Находит "стены" в книге ордеров.
   * @private
   */
  _findOrderBookLevels(orderBook, lastPrice) {
    if (!orderBook || !lastPrice) return [];

    const levels = [];
    const { bids, asks } = orderBook;

    const analyzeSide = (side, type) => {
      const significantLevels = [];
      const totalVolume = side.reduce((acc, [_, size]) => acc + parseFloat(size), 0);
      const avgVolume = totalVolume / side.length;
      const volumeThreshold = avgVolume * this.config.orderBook.volumeRatio;

      for (const [price, size] of side) {
        if (parseFloat(size) > volumeThreshold) {
          significantLevels.push({
            price: parseFloat(price),
            type: type,
            significance: S_R_LEVEL_SIGNIFICANCE.HIGH,
            source: 'OrderBook',
          });
        }
      }
      return significantLevels;
    };

    levels.push(...analyzeSide(bids.slice(0, this.config.orderBook.depth), 'support'));
    levels.push(...analyzeSide(asks.slice(0, this.config.orderBook.depth), 'resistance'));

    return levels;
  }

  /**
   * Находит кластеры объемов в ленте сделок.
   * @private
   */
  _findTradeClusters(trades) {
    if (!trades || trades.length === 0) return [];
    
    const priceClusters = trades.reduce((acc, trade) => {
      const price = parseFloat(trade.price);
      const size = parseFloat(trade.size);
      const clusterKey = Math.round(price / (price * this.config.trades.clusterThreshold)) * (price * this.config.trades.clusterThreshold);
      
      if (!acc[clusterKey]) {
        acc[clusterKey] = { totalVolume: 0, prices: [] };
      }
      acc[clusterKey].totalVolume += size;
      acc[clusterKey].prices.push(price);
      return acc;
    }, {});

    const sortedClusters = Object.values(priceClusters).sort((a, b) => b.totalVolume - a.totalVolume);
    const topClusters = sortedClusters.slice(0, 5); // Take top 5 clusters

    return topClusters.map(cluster => {
      const avgPrice = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
      return {
        price: avgPrice,
        type: 'cluster',
        significance: S_R_LEVEL_SIGNIFICANCE.MEDIUM,
        source: 'Trades',
      };
    });
  }

  /**
   * Находит локальные максимумы и минимумы (пивоты).
   * @private
   */
  _findPriceActionLevels(kline) {
    if (!kline || kline.length < this.config.priceAction.pivotWindow * 2 + 1) return [];
    
    const levels = [];
    // kline data is [timestamp, open, high, low, close, volume, turnover]
    const highs = kline.map(k => parseFloat(k[2])).reverse(); // Reverse to have latest data first
    const lows = kline.map(k => parseFloat(k[3])).reverse();

    for (let i = this.config.priceAction.pivotWindow; i < kline.length - this.config.priceAction.pivotWindow; i++) {
      const preWindowHighs = highs.slice(i - this.config.priceAction.pivotWindow, i);
      const postWindowHighs = highs.slice(i + 1, i + 1 + this.config.priceAction.pivotWindow);
      const isPivotHigh = Math.max(...preWindowHighs) < highs[i] && Math.max(...postWindowHighs) < highs[i];

      const preWindowLows = lows.slice(i - this.config.priceAction.pivotWindow, i);
      const postWindowLows = lows.slice(i + 1, i + 1 + this.config.priceAction.pivotWindow);
      const isPivotLow = Math.min(...preWindowLows) > lows[i] && Math.min(...postWindowLows) > lows[i];

      if (isPivotHigh) {
        levels.push({
          price: highs[i],
          type: 'resistance',
          significance: S_R_LEVEL_SIGNIFICANCE.LOW,
          source: 'PriceAction',
        });
      }
      if (isPivotLow) {
        levels.push({
          price: lows[i],
          type: 'support',
          significance: S_R_LEVEL_SIGNIFICANCE.LOW,
          source: 'PriceAction',
        });
      }
    }
    return levels.slice(0, 10); // Limit the number of PA levels
  }
}

module.exports = SupportResistanceAnalyzer; 