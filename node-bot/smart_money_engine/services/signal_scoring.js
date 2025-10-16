class SignalScoring {
  /**
   * Рассчитать финальный скор сигнала
   * @param {Object} analysisResult - Результат анализа
   * @param {Object} marketData - Рыночные данные
   * @param {number} technicalScore - Технический скор
   * @param {Array<object>} srLevels - Массив уровней поддержки/сопротивления
   * @returns {number} Финальный скор от 0 до 100
   */
  static calculateFinalScore(analysisResult, marketData, technicalScore, srLevels = []) {
    if (!analysisResult || analysisResult.recommendation === 'wait') {
      return 0;
    }

    const components = {
      confidence: this.getConfidenceScore(analysisResult.confidence),
      technical: this.normalizeTechnicalScore(technicalScore),
      smartMoney: this.getSmartMoneyScore(marketData),
      volume: this.getVolumeScore(marketData),
      liquidations: this.getLiquidationScore(marketData),
      openInterest: this.getOpenInterestScore(marketData),
      fundingRate: this.getFundingRateScore(marketData),
      riskReward: this.getRiskRewardScore(analysisResult),
      srConfluence: this.getSrConfluenceScore(analysisResult, marketData.price, srLevels)
    };

    // Веса для каждого компонента
    const weights = {
      confidence: 0.15,    // 15% - базовая уверенность алгоритма
      technical: 0.15,     // 15% - технические индикаторы
      smartMoney: 0.20,    // 20% - Smart Money факторы
      volume: 0.10,        // 10% - объем торгов
      liquidations: 0.10,  // 10% - ликвидации
      openInterest: 0.05,  // 5% - открытый интерес
      fundingRate: 0.05,   // 5% - фандинг рейт
      riskReward: 0.05,    // 5% - риск/прибыль
      srConfluence: 0.15   // 15% - близость к уровням S/R
    };

    // Рассчитываем взвешенный скор
    let finalScore = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      const componentScore = components[key] || 0;
      finalScore += componentScore * weight;
    });

    // Бонусы за особые условия
    const bonuses = this.calculateBonuses(analysisResult, marketData);
    finalScore += bonuses;

    // Ограничиваем от 0 до 100
    return Math.max(0, Math.min(100, Math.round(finalScore)));
  }

  /**
   * Скор уверенности алгоритма
   */
  static getConfidenceScore(confidence) {
    if (!confidence || confidence < 0.5) return 0;
    return (confidence - 0.5) * 200; // Масштабируем от 0.5-1.0 до 0-100
  }

  /**
   * Нормализовать технический скор
   */
  static normalizeTechnicalScore(technicalScore) {
    // Технический скор от -100 до +100, нормализуем к 0-100
    return Math.max(0, (technicalScore + 100) / 2);
  }

  /**
   * Скор Smart Money факторов
   */
  static getSmartMoneyScore(marketData) {
    const longLiq = marketData.sum_long_liquidations_usd || 0;
    const shortLiq = marketData.sum_short_liquidations_usd || 0;
    const totalLiq = longLiq + shortLiq;
    
    if (totalLiq < 1000000) return 0; // Слишком мало активности
    
    let score = 0;
    
    // Скор за дисбаланс ликвидаций
    const liqRatio = shortLiq > 0 ? longLiq / shortLiq : 10;
    if (liqRatio > 3) {
      score += 40; // Много лонг-ликвидаций = потенциал роста
    } else if (liqRatio < 0.33) {
      score += 40; // Много шорт-ликвидаций = потенциал падения
    } else {
      score += 10; // Сбалансированно
    }
    
    // Скор за объем ликвидаций
    if (totalLiq > 50000000) {
      score += 30; // Очень высокая активность
    } else if (totalLiq > 10000000) {
      score += 20; // Высокая активность
    } else {
      score += 10; // Умеренная активность
    }
    
    // Скор за открытый интерес
    const oi = marketData.avg_open_interest_usd || 0;
    if (oi > 100000000) {
      score += 30; // Высокий институциональный интерес
    } else if (oi > 10000000) {
      score += 20; // Средний интерес
    } else {
      score += 10; // Низкий интерес
    }
    
    return Math.min(100, score);
  }

  /**
   * Скор объема торгов
   */
  static getVolumeScore(marketData) {
    const volume = marketData.total_volume_usd || 0;
    
    if (volume > 1000000000) return 100; // $1B+
    if (volume > 500000000) return 80;   // $500M+
    if (volume > 100000000) return 60;   // $100M+
    if (volume > 50000000) return 40;    // $50M+
    if (volume > 10000000) return 20;    // $10M+
    return 0;
  }

  /**
   * Скор ликвидаций
   */
  static getLiquidationScore(marketData) {
    const longLiq = marketData.sum_long_liquidations_usd || 0;
    const shortLiq = marketData.sum_short_liquidations_usd || 0;
    const totalLiq = longLiq + shortLiq;
    
    if (totalLiq < 1000000) return 0;
    
    let score = 0;
    
    // Базовый скор за активность
    if (totalLiq > 100000000) score += 40;
    else if (totalLiq > 50000000) score += 30;
    else if (totalLiq > 10000000) score += 20;
    else score += 10;
    
    // Бонус за дисбаланс (индикатор направления)
    const ratio = shortLiq > 0 ? longLiq / shortLiq : 10;
    if (ratio > 5 || ratio < 0.2) {
      score += 60; // Сильный дисбаланс
    } else if (ratio > 2 || ratio < 0.5) {
      score += 40; // Умеренный дисбаланс
    } else {
      score += 20; // Слабый дисбаланс
    }
    
    return Math.min(100, score);
  }

  /**
   * Скор открытого интереса
   */
  static getOpenInterestScore(marketData) {
    const oi = marketData.avg_open_interest_usd || 0;
    
    if (oi > 1000000000) return 100; // $1B+
    if (oi > 500000000) return 80;   // $500M+
    if (oi > 100000000) return 60;   // $100M+
    if (oi > 50000000) return 40;    // $50M+
    if (oi > 10000000) return 20;    // $10M+
    return 0;
  }

  /**
   * Скор фандинг рейта
   */
  static getFundingRateScore(marketData) {
    const rate = marketData.avg_funding_rate || 0;
    
    // Экстремальные значения дают больше очков
    if (Math.abs(rate) > 0.01) return 100;  // >1%
    if (Math.abs(rate) > 0.005) return 80;  // >0.5%
    if (Math.abs(rate) > 0.002) return 60;  // >0.2%
    if (Math.abs(rate) > 0.001) return 40;  // >0.1%
    return 20; // Нормальный уровень
  }

  /**
   * Скор риск/прибыль
   */
  static getRiskRewardScore(analysisResult) {
    if (!analysisResult.take_profit || !analysisResult.stop_loss || !analysisResult.entry_zone) {
      return 50; // Средний скор если нет данных
    }

    const entryPrice = (analysisResult.entry_zone.from + analysisResult.entry_zone.to) / 2;
    const profit = Math.abs(analysisResult.take_profit - entryPrice);
    const risk = Math.abs(entryPrice - analysisResult.stop_loss);
    
    if (risk === 0) return 0;
    
    const rrRatio = profit / risk;
    
    if (rrRatio > 3) return 100;      // R:R > 3:1
    if (rrRatio > 2) return 80;       // R:R > 2:1
    if (rrRatio > 1.5) return 60;     // R:R > 1.5:1
    if (rrRatio > 1) return 40;       // R:R > 1:1
    return 20; // R:R < 1:1
  }

  /**
   * Рассчитать бонусы за особые условия
   */
  static calculateBonuses(analysisResult, marketData) {
    let bonuses = 0;
    
    // Бонус за множественные подтверждения
    const reasoningCount = analysisResult.reasoning?.length || 0;
    if (reasoningCount >= 4) bonuses += 5;
    else if (reasoningCount >= 3) bonuses += 3;
    
    // Бонус за экстремальные ликвидации
    const totalLiq = (marketData.sum_long_liquidations_usd || 0) + (marketData.sum_short_liquidations_usd || 0);
    if (totalLiq > 200000000) bonuses += 8; // $200M+
    else if (totalLiq > 100000000) bonuses += 5; // $100M+
    
    // Бонус за экстремальный фандинг
    const rate = Math.abs(marketData.avg_funding_rate || 0);
    if (rate > 0.015) bonuses += 10; // >1.5%
    else if (rate > 0.01) bonuses += 5; // >1%
    
    // Бонус за высокую уверенность
    if (analysisResult.confidence > 0.9) bonuses += 8;
    else if (analysisResult.confidence > 0.8) bonuses += 5;
    
    return bonuses;
  }

  /**
   * Получить детальную разбивку скора
   */
  static getScoreBreakdown(analysisResult, marketData, technicalScore) {
    const components = {
      confidence: this.getConfidenceScore(analysisResult.confidence),
      technical: this.normalizeTechnicalScore(technicalScore),
      smartMoney: this.getSmartMoneyScore(marketData),
      volume: this.getVolumeScore(marketData),
      liquidations: this.getLiquidationScore(marketData),
      openInterest: this.getOpenInterestScore(marketData),
      fundingRate: this.getFundingRateScore(marketData),
      riskReward: this.getRiskRewardScore(analysisResult)
    };

    const bonuses = this.calculateBonuses(analysisResult, marketData);
    
    return {
      components,
      bonuses,
      total: this.calculateFinalScore(analysisResult, marketData, technicalScore)
    };
  }

  /**
   * Оценивает близость сигнала к сильному уровню поддержки/сопротивления.
   * @param {object} analysisResult - Результат анализа
   * @param {number} price - Текущая цена
   * @param {Array<object>} srLevels - Массив уровней
   * @returns {number} - Балл от 0 до 100
   */
  static getSrConfluenceScore(analysisResult, price, srLevels) {
    if (!srLevels || srLevels.length === 0) return 50; // Нейтральный балл, если уровней нет

    const type = analysisResult.recommendation === 'buy' ? 'support' : 'resistance';
    const relevantLevels = srLevels.filter(l => l.type === type && l.significance !== 'low');
    
    if (relevantLevels.length === 0) return 50;

    // Находим ближайший сильный уровень
    const nearestLevel = relevantLevels
      .map(level => ({ ...level, distance: Math.abs(level.price - price) }))
      .sort((a, b) => a.distance - b.distance)[0];

    const proximity = Math.max(0, 1 - (nearestLevel.distance / price) / 0.01); // 1% ценового диапазона

    return proximity * 100; // Возвращаем балл от 0 до 100
  }
}

module.exports = SignalScoring; 