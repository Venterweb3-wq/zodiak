const AnalysisResult = require('../models/AnalysisResults');

class AnalysisSaver {
  constructor() {
    this.batchSize = 10;
    this.batch = [];
    this.saveInterval = null;
  }

  /**
   * Сохранить результат анализа в базу данных
   * @param {string} symbol - Символ монеты
   * @param {Object} analysisResult - Результат анализа от analyzeCoin
   * @param {Object} marketData - Рыночные данные
   * @param {number} technicalScore - Технический скор
   * @param {number} finalScore - Финальный скор
   * @param {number} processingTime - Время обработки в мс
   */
  async saveAnalysisResult(symbol, analysisResult, marketData, technicalScore = 0, finalScore = 0, processingTime = 0) {
    try {
      const document = this.buildAnalysisDocument(
        symbol, 
        analysisResult, 
        marketData, 
        technicalScore, 
        finalScore, 
        processingTime
      );

      // Сохраняем в базу с upsert (обновляем если уже есть)
      await AnalysisResult.findOneAndUpdate(
        { symbol: symbol },
        document,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      console.log(`💾 Анализ сохранен: ${symbol} (${analysisResult.recommendation}, score: ${finalScore})`);
      
    } catch (error) {
      console.error(`❌ Ошибка сохранения анализа для ${symbol}:`, error.message);
    }
  }

  /**
   * Построить документ для сохранения
   */
  buildAnalysisDocument(symbol, analysisResult, marketData, technicalScore, finalScore, processingTime) {
    const ti = marketData.technical_indicators || {};
    const sm = this.extractSmartMoneyData(marketData);
    
    return {
      symbol: symbol,
      price: marketData.price || 0,
      
      // Технические индикаторы
      technical: {
        rsi: ti.rsi || null,
        rsi_signal: ti.rsi_signal || 'unknown',
        ema_20: ti.ema_20 || null,
        ema_50: ti.ema_50 || null,
        ema_trend: ti.ema_trend || 'unknown',
        bb_upper: ti.bb_upper || null,
        bb_middle: ti.bb_middle || null,
        bb_lower: ti.bb_lower || null,
        bb_position: ti.bb_position || 'unknown',
        atr: ti.atr || null,
        atr_signal: ti.atr_signal || 'unknown',
        volume_ma: ti.volume_ma || null,
        volume_strength: ti.volume_strength || 'unknown',
        macd: ti.macd ? {
          value: ti.macd.MACD || null,
          signal: ti.macd.signal || null,
          histogram: ti.macd.histogram || null
        } : null,
        overall_signal: ti.overall_signal || 'unknown'
      },
      
      // Smart Money данные
      smart_money: sm,
      
      // Финальный анализ
      analysis: {
        recommendation: analysisResult.recommendation || 'wait',
        confidence: analysisResult.confidence || 0,
        final_score: finalScore,
        technical_score: technicalScore,
        reasoning: analysisResult.reasoning || [],
        entry_zone: analysisResult.entry_zone || null,
        stop_loss: analysisResult.stop_loss || null,
        take_profit: analysisResult.take_profit || null,
        risk_reward_ratio: this.calculateRiskReward(analysisResult)
      },
      
      // Рыночные условия
      market_context: {
        market_phase: this.determineMarketPhase(marketData),
        btc_dominance: null, // Можно добавить позже
        fear_greed_index: null, // Можно добавить позже
        total_market_liquidations: sm.total_liquidations
      },
      
      // Метаданные
      data_sources: {
        bybit: true,
        binance: false,
        coinglass: true,
        cmc: true
      },
      processing_time_ms: processingTime,
      version: '1.0'
    };
  }

  /**
   * Извлечь Smart Money данные
   */
  extractSmartMoneyData(marketData) {
    const longLiq = marketData.sum_long_liquidations_usd || 0;
    const shortLiq = marketData.sum_short_liquidations_usd || 0;
    const totalLiq = longLiq + shortLiq;
    const oi = marketData.avg_open_interest_usd || 0;
    const volume = marketData.total_volume_usd || 0;
    const fundingRate = marketData.avg_funding_rate || 0;

    return {
      avg_funding_rate: fundingRate,
      funding_signal: this.getFundingSignal(fundingRate),
      best_funding_rate: marketData.best_funding_rate ? {
        exchange: marketData.best_funding_rate.exchange,
        value: marketData.best_funding_rate.value
      } : null,
      long_liquidations: longLiq,
      short_liquidations: shortLiq,
      total_liquidations: totalLiq,
      liquidation_bias: this.getLiquidationBias(longLiq, shortLiq),
      liquidation_ratio: shortLiq > 0 ? longLiq / shortLiq : null,
      open_interest: oi,
      oi_signal: this.getOISignal(oi),
      volume_24h: volume,
      volume_dominance: marketData.top_volume_exchange ? {
        exchange: marketData.top_volume_exchange.exchange,
        percentage: volume > 0 ? (marketData.top_volume_exchange.volume_usd / volume) * 100 : 0
      } : null
    };
  }

  /**
   * Определить сигнал фандинг-рейта
   */
  getFundingSignal(rate) {
    if (rate > 0.01) return 'extremely_positive';
    if (rate > 0.005) return 'positive';
    if (rate < -0.01) return 'extremely_negative';
    if (rate < -0.005) return 'negative';
    return 'neutral';
  }

  /**
   * Определить смещение ликвидаций
   */
  getLiquidationBias(longLiq, shortLiq) {
    const total = longLiq + shortLiq;
    if (total < 1000000) return 'low_activity';
    
    const ratio = 2.5;
    if (longLiq > shortLiq * ratio) return 'long_heavy';
    if (shortLiq > longLiq * ratio) return 'short_heavy';
    return 'balanced';
  }

  /**
   * Определить сигнал открытого интереса
   */
  getOISignal(oi) {
    if (oi > 500000000) return 'very_high';
    if (oi > 100000000) return 'high';
    if (oi > 10000000) return 'normal';
    if (oi > 1000000) return 'low';
    return 'very_low';
  }

  /**
   * Определить фазу рынка
   */
  determineMarketPhase(marketData) {
    const ti = marketData.technical_indicators;
    if (!ti) return 'unknown';

    const totalLiq = (marketData.sum_long_liquidations_usd || 0) + (marketData.sum_short_liquidations_usd || 0);
    
    if (totalLiq > 50000000) return 'high_volatility';
    if (totalLiq < 5000000) return 'low_volatility';
    
    if (ti.overall_signal === 'bullish') return 'bull_market';
    if (ti.overall_signal === 'bearish') return 'bear_market';
    
    return 'sideways';
  }

  /**
   * Рассчитать риск/прибыль
   */
  calculateRiskReward(analysisResult) {
    if (!analysisResult.take_profit || !analysisResult.stop_loss || !analysisResult.entry_zone) {
      return null;
    }

    const entryPrice = (analysisResult.entry_zone.from + analysisResult.entry_zone.to) / 2;
    const profit = Math.abs(analysisResult.take_profit - entryPrice);
    const risk = Math.abs(entryPrice - analysisResult.stop_loss);
    
    return risk > 0 ? profit / risk : null;
  }

  /**
   * Пакетное сохранение (для оптимизации)
   */
  async batchSave(analysisData) {
    this.batch.push(analysisData);
    
    if (this.batch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Сохранить накопленные данные
   */
  async flushBatch() {
    if (this.batch.length === 0) return;

    try {
      const operations = this.batch.map(data => ({
        updateOne: {
          filter: { symbol: data.symbol },
          update: data,
          upsert: true
        }
      }));

      await AnalysisResult.bulkWrite(operations);
      console.log(`💾 Пакетное сохранение: ${this.batch.length} анализов`);
      
      this.batch = [];
    } catch (error) {
      console.error('❌ Ошибка пакетного сохранения:', error.message);
    }
  }

  /**
   * Запустить автоматическое сохранение
   */
  startAutoSave(intervalMs = 30000) {
    this.saveInterval = setInterval(() => {
      this.flushBatch();
    }, intervalMs);
  }

  /**
   * Остановить автоматическое сохранение
   */
  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    // Сохраняем оставшиеся данные
    this.flushBatch();
  }

  /**
   * Получить статистику по сохраненным анализам
   */
  async getStats() {
    const total = await AnalysisResult.countDocuments();
    const recent = await AnalysisResult.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const topScores = await AnalysisResult.find({
      'analysis.final_score': { $gte: 80 }
    }).countDocuments();

    return {
      total_analyses: total,
      last_24h: recent,
      high_score_signals: topScores,
      batch_pending: this.batch.length
    };
  }
}

module.exports = AnalysisSaver; 