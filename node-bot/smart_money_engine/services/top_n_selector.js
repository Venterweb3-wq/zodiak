const logger = require('../utils/logger');

class TopNSelector {
  /**
   * Отобрать топ-N сигналов по скору
   * @param {Array} candidateSignals - Массив кандидатов
   * @param {number} maxSignals - Максимальное количество сигналов
   * @param {number} minScore - Минимальный скор для отбора
   * @returns {Array} Отобранные топ сигналы
   */
  static async selectTopSignals(candidateSignals, maxSignals = 5, minScore = 70) {
    if (!candidateSignals || candidateSignals.length === 0) {
      logger.info('📊 Нет кандидатов для отбора');
      return [];
    }

    logger.info(`\n🎯 ОТБОР ЛУЧШИХ СИГНАЛОВ из ${candidateSignals.length} кандидатов:`);

    // 1. Фильтрация по минимальному скору
    const qualifiedSignals = candidateSignals.filter(signal => signal.finalScore >= minScore);
    
    logger.info(`📊 После фильтрации (score >= ${minScore}): ${qualifiedSignals.length} сигналов`);

    if (qualifiedSignals.length === 0) {
      logger.info('❌ Нет сигналов с достаточным скором');
      return [];
    }

    // 2. Сортировка по скору (от лучшего к худшему)
    const sortedSignals = qualifiedSignals.sort((a, b) => b.finalScore - a.finalScore);
    
    // 3. Выбор лучших N сигналов
    const selectedSignals = sortedSignals.slice(0, maxSignals);
    
    // 4. Вывод результатов
    this.logSelectionResults(selectedSignals, candidateSignals);
    
    return selectedSignals;
  }

  /**
   * Группировать сигналы по типу
   */
  static groupSignalsByType(signals) {
    const groups = {
      buy: [],
      sell: []
    };

    signals.forEach(signal => {
      const type = signal.analysisResult.recommendation;
      if (groups[type]) {
        groups[type].push(signal);
      }
    });

    // Сортируем каждую группу по скору
    groups.buy.sort((a, b) => b.finalScore - a.finalScore);
    groups.sell.sort((a, b) => b.finalScore - a.finalScore);

    logger.info(`📊 Группировка: ${groups.buy.length} BUY, ${groups.sell.length} SELL`);
    
    return groups;
  }

  /**
   * Балансировать типы сигналов
   */
  static balanceSignalTypes(groups, maxSignals) {
    const balanced = [];
    const { buy, sell } = groups;
    
    // Если один тип сигналов значительно превышает другой, ограничиваем его
    const maxPerType = Math.ceil(maxSignals * 0.8); // Максимум 80% от одного типа
    
    // Берем лучшие из каждой группы
    const selectedBuy = buy.slice(0, Math.min(maxPerType, buy.length));
    const selectedSell = sell.slice(0, Math.min(maxPerType, sell.length));
    
    balanced.push(...selectedBuy, ...selectedSell);
    
    logger.info(`⚖️ Балансировка: взято ${selectedBuy.length} BUY + ${selectedSell.length} SELL`);
    
    return balanced;
  }

  /**
   * Логирование результатов отбора
   */
  static logSelectionResults(selectedSignals, allCandidates) {
    logger.info(`\n🏆 ФИНАЛЬНЫЙ ОТБОР: ${selectedSignals.length} сигналов`);
    
    selectedSignals.forEach((signal, index) => {
      const rank = index + 1;
      const symbol = signal.symbol;
      const type = signal.analysisResult.recommendation.toUpperCase();
      const score = signal.finalScore;
      const confidence = (signal.analysisResult.confidence * 100).toFixed(1);
      const techScore = signal.technicalScore;
      
      logger.info(`${rank}. ${symbol} ${type} - Score: ${score}, Conf: ${confidence}%, Tech: ${techScore}`);
      
      // Топ-3 причины
      const reasons = signal.analysisResult.reasoning.slice(0, 3);
      logger.info(`   💡 ${reasons.join(' | ')}`);
    });

    // Статистика отбора
    const avgScore = selectedSignals.reduce((sum, s) => sum + s.finalScore, 0) / selectedSignals.length;
    const buyCount = selectedSignals.filter(s => s.analysisResult.recommendation === 'buy').length;
    const sellCount = selectedSignals.filter(s => s.analysisResult.recommendation === 'sell').length;
    
    logger.info(`\n📊 СТАТИСТИКА ОТБОРА:`);
    logger.info(`📈 Средний скор: ${avgScore.toFixed(1)}`);
    logger.info(`🟢 BUY сигналы: ${buyCount}`);
    logger.info(`🔴 SELL сигналы: ${sellCount}`);
    logger.info(`🎯 Отобрано: ${selectedSignals.length}/${allCandidates.length} (${(selectedSignals.length/allCandidates.length*100).toFixed(1)}%)`);
  }

  /**
   * Получить детальную аналитику по кандидатам
   */
  static getSelectionAnalytics(candidateSignals) {
    if (!candidateSignals || candidateSignals.length === 0) {
      return { message: 'Нет кандидатов для анализа' };
    }

    const scores = candidateSignals.map(s => s.finalScore);
    const confidences = candidateSignals.map(s => s.analysisResult.confidence);
    const techScores = candidateSignals.map(s => s.technicalScore);

    const analytics = {
      total_candidates: candidateSignals.length,
      
      score_distribution: {
        min: Math.min(...scores),
        max: Math.max(...scores),
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        above_80: scores.filter(s => s >= 80).length,
        above_70: scores.filter(s => s >= 70).length,
        above_60: scores.filter(s => s >= 60).length
      },
      
      confidence_distribution: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        avg: confidences.reduce((a, b) => a + b, 0) / confidences.length,
        above_90: confidences.filter(c => c >= 0.9).length,
        above_80: confidences.filter(c => c >= 0.8).length,
        above_70: confidences.filter(c => c >= 0.7).length
      },
      
      technical_distribution: {
        min: Math.min(...techScores),
        max: Math.max(...techScores),
        avg: techScores.reduce((a, b) => a + b, 0) / techScores.length,
        positive: techScores.filter(t => t > 0).length,
        negative: techScores.filter(t => t < 0).length
      },
      
      signal_types: {
        buy: candidateSignals.filter(s => s.analysisResult.recommendation === 'buy').length,
        sell: candidateSignals.filter(s => s.analysisResult.recommendation === 'sell').length
      },
      
      top_symbols: this.getTopSymbols(candidateSignals, 5),
      top_reasons: this.getTopReasons(candidateSignals, 5)
    };

    return analytics;
  }

  /**
   * Получить топ символы по скору
   */
  static getTopSymbols(signals, limit = 5) {
    return signals
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit)
      .map(signal => ({
        symbol: signal.symbol,
        score: signal.finalScore,
        type: signal.analysisResult.recommendation,
        confidence: Math.round(signal.analysisResult.confidence * 100)
      }));
  }

  /**
   * Получить топ причины для сигналов
   */
  static getTopReasons(signals, limit = 5) {
    const reasonCounts = {};
    
    signals.forEach(signal => {
      if (signal.analysisResult.reasoning) {
        signal.analysisResult.reasoning.forEach(reason => {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        });
      }
    });

    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([reason, count]) => ({ reason, count }));
  }

  /**
   * Применить дополнительные фильтры
   */
  static applyAdvancedFilters(signals, filters = {}) {
    let filtered = [...signals];

    // Фильтр по минимальной confidence
    if (filters.minConfidence) {
      filtered = filtered.filter(s => s.analysisResult.confidence >= filters.minConfidence);
    }

    // Фильтр по типу сигнала
    if (filters.signalType && filters.signalType !== 'all') {
      filtered = filtered.filter(s => s.analysisResult.recommendation === filters.signalType);
    }

    // Фильтр по минимальному техническому скору
    if (filters.minTechnicalScore) {
      filtered = filtered.filter(s => s.technicalScore >= filters.minTechnicalScore);
    }

    // Фильтр по символам (whitelist)
    if (filters.includeSymbols && filters.includeSymbols.length > 0) {
      filtered = filtered.filter(s => filters.includeSymbols.includes(s.symbol));
    }

    // Фильтр по символам (blacklist)
    if (filters.excludeSymbols && filters.excludeSymbols.length > 0) {
      filtered = filtered.filter(s => !filters.excludeSymbols.includes(s.symbol));
    }

    logger.info(`🔍 Дополнительные фильтры: ${signals.length} → ${filtered.length} сигналов`);
    
    return filtered;
  }
}

module.exports = TopNSelector; 