class EnhancedMonitoring {
  constructor() {
    this.cycleStats = [];
    this.performanceMetrics = {
      totalCycles: 0,
      totalProcessed: 0,
      totalSignalsCreated: 0,
      averageProcessingTime: 0,
      successRate: 0
    };
  }

  /**
   * Генерировать сводку цикла анализа
   */
  generateCycleSummary(analyzedCoins, selectedSignals, cycleTime) {
    const summary = {
      timestamp: new Date().toISOString(),
      cycle_time_ms: cycleTime,
      cycle_time_formatted: this.formatTime(cycleTime),
      
      coins: {
        total_analyzed: analyzedCoins.length,
        avg_processing_time: analyzedCoins.length > 0 ? cycleTime / analyzedCoins.length : 0,
        top_volume_coins: this.getTopCoinsByVolume(analyzedCoins, 5),
        top_liquidation_coins: this.getTopCoinsByLiquidations(analyzedCoins, 5)
      },
      
      signals: {
        total_created: selectedSignals.length,
        buy_signals: selectedSignals.filter(s => s.analysisResult.recommendation === 'buy').length,
        sell_signals: selectedSignals.filter(s => s.analysisResult.recommendation === 'sell').length,
        avg_score: selectedSignals.length > 0 ? 
          selectedSignals.reduce((sum, s) => sum + s.finalScore, 0) / selectedSignals.length : 0,
        avg_confidence: selectedSignals.length > 0 ? 
          selectedSignals.reduce((sum, s) => sum + s.analysisResult.confidence, 0) / selectedSignals.length : 0,
        signal_details: selectedSignals.map(s => ({
          symbol: s.symbol,
          type: s.analysisResult.recommendation,
          score: s.finalScore,
          confidence: Math.round(s.analysisResult.confidence * 100)
        }))
      },
      
      performance: {
        coins_per_second: analyzedCoins.length / (cycleTime / 1000),
        signals_per_coin_ratio: analyzedCoins.length > 0 ? selectedSignals.length / analyzedCoins.length : 0,
        efficiency_score: this.calculateEfficiencyScore(analyzedCoins.length, selectedSignals.length, cycleTime)
      }
    };

    // Сохраняем статистику цикла
    this.cycleStats.push(summary);
    this.updatePerformanceMetrics(summary);
    
    // Выводим красивую сводку
    this.logCycleSummary(summary);
    
    return summary;
  }

  /**
   * Обновить общие метрики производительности
   */
  updatePerformanceMetrics(cycleSummary) {
    this.performanceMetrics.totalCycles++;
    this.performanceMetrics.totalProcessed += cycleSummary.coins.total_analyzed;
    this.performanceMetrics.totalSignalsCreated += cycleSummary.signals.total_created;
    
    // Скользящее среднее времени обработки
    const newAvgTime = (this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.totalCycles - 1) + 
                       cycleSummary.cycle_time_ms) / this.performanceMetrics.totalCycles;
    this.performanceMetrics.averageProcessingTime = newAvgTime;
    
    // Коэффициент успешности (процент циклов с сигналами)
    const cyclesWithSignals = this.cycleStats.filter(c => c.signals.total_created > 0).length;
    this.performanceMetrics.successRate = cyclesWithSignals / this.performanceMetrics.totalCycles;
  }

  /**
   * Логирование красивой сводки цикла
   */
  logCycleSummary(summary) {
    console.log(`\n📊 ═══════════════════════════════════════════════════════════════`);
    console.log(`📊 СВОДКА ЦИКЛА АНАЛИЗА - ${new Date().toLocaleString('ru-RU')}`);
    console.log(`📊 ═══════════════════════════════════════════════════════════════`);
    
    // Время выполнения
    console.log(`⏱️  ПРОИЗВОДИТЕЛЬНОСТЬ:`);
    console.log(`   ⚡ Время цикла: ${summary.cycle_time_formatted}`);
    console.log(`   📈 Скорость: ${summary.performance.coins_per_second.toFixed(1)} монет/сек`);
    console.log(`   🎯 Эффективность: ${summary.performance.efficiency_score.toFixed(1)}/100`);
    
    // Монеты
    console.log(`\n💰 АНАЛИЗ МОНЕТ:`);
    console.log(`   📊 Проанализировано: ${summary.coins.total_analyzed} монет`);
    console.log(`   ⏱️  Среднее время: ${summary.coins.avg_processing_time.toFixed(0)}мс/монету`);
    
    // Топ монеты по объему
    if (summary.coins.top_volume_coins.length > 0) {
      console.log(`   💎 Топ по объему: ${summary.coins.top_volume_coins.slice(0, 3).map(c => c.symbol).join(', ')}`);
    }
    
    // Сигналы
    console.log(`\n🎯 СОЗДАННЫЕ СИГНАЛЫ:`);
    if (summary.signals.total_created > 0) {
      console.log(`   ✅ Всего сигналов: ${summary.signals.total_created}`);
      console.log(`   🟢 BUY: ${summary.signals.buy_signals} | 🔴 SELL: ${summary.signals.sell_signals}`);
      console.log(`   📊 Средний скор: ${summary.signals.avg_score.toFixed(1)}`);
      console.log(`   🎯 Средняя уверенность: ${(summary.signals.avg_confidence * 100).toFixed(1)}%`);
      
      // Детали сигналов
      console.log(`   📋 Детали:`);
      summary.signals.signal_details.forEach((signal, i) => {
        const emoji = signal.type === 'buy' ? '🟢' : '🔴';
        console.log(`      ${i+1}. ${emoji} ${signal.symbol} - Score: ${signal.score}, Conf: ${signal.confidence}%`);
      });
    } else {
      console.log(`   ❌ Сигналов не создано`);
    }
    
    // Общая статистика
    console.log(`\n📈 ОБЩАЯ СТАТИСТИКА:`);
    console.log(`   🔄 Всего циклов: ${this.performanceMetrics.totalCycles}`);
    console.log(`   📊 Всего обработано: ${this.performanceMetrics.totalProcessed} монет`);
    console.log(`   🎯 Всего сигналов: ${this.performanceMetrics.totalSignalsCreated}`);
    console.log(`   ✅ Успешность: ${(this.performanceMetrics.successRate * 100).toFixed(1)}%`);
    
    console.log(`📊 ═══════════════════════════════════════════════════════════════\n`);
  }

  /**
   * Получить топ монеты по объему
   */
  getTopCoinsByVolume(coins, limit = 5) {
    return coins
      .filter(coin => coin.total_volume_usd > 0)
      .sort((a, b) => b.total_volume_usd - a.total_volume_usd)
      .slice(0, limit)
      .map(coin => ({
        symbol: coin.symbol,
        volume_usd: coin.total_volume_usd,
        volume_formatted: this.formatMoney(coin.total_volume_usd)
      }));
  }

  /**
   * Получить топ монеты по ликвидациям
   */
  getTopCoinsByLiquidations(coins, limit = 5) {
    return coins
      .map(coin => ({
        symbol: coin.symbol,
        total_liquidations: (coin.sum_long_liquidations_usd || 0) + (coin.sum_short_liquidations_usd || 0)
      }))
      .filter(coin => coin.total_liquidations > 0)
      .sort((a, b) => b.total_liquidations - a.total_liquidations)
      .slice(0, limit)
      .map(coin => ({
        symbol: coin.symbol,
        liquidations_usd: coin.total_liquidations,
        liquidations_formatted: this.formatMoney(coin.total_liquidations)
      }));
  }

  /**
   * Рассчитать скор эффективности
   */
  calculateEfficiencyScore(coinsAnalyzed, signalsCreated, cycleTime) {
    if (coinsAnalyzed === 0) return 0;
    
    // Факторы эффективности
    const speedFactor = Math.min(100, (coinsAnalyzed / (cycleTime / 1000)) * 2); // Скорость обработки
    const signalFactor = Math.min(100, (signalsCreated / coinsAnalyzed) * 200); // Качество отбора
    const timeFactor = Math.max(0, 100 - (cycleTime / 1000 / 60) * 10); // Штраф за долгое выполнение
    
    return (speedFactor * 0.4 + signalFactor * 0.4 + timeFactor * 0.2);
  }

  /**
   * Форматировать время
   */
  formatTime(ms) {
    if (ms < 1000) return `${ms}мс`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}с`;
    return `${Math.floor(ms / 60000)}м ${Math.floor((ms % 60000) / 1000)}с`;
  }

  /**
   * Форматировать деньги
   */
  formatMoney(amount) {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  }

  /**
   * Получить статистику за период
   */
  getPeriodStats(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const periodCycles = this.cycleStats.filter(cycle => 
      new Date(cycle.timestamp) >= cutoffTime
    );

    if (periodCycles.length === 0) {
      return { message: `Нет данных за последние ${hours} часов` };
    }

    const totalSignals = periodCycles.reduce((sum, cycle) => sum + cycle.signals.total_created, 0);
    const totalCoins = periodCycles.reduce((sum, cycle) => sum + cycle.coins.total_analyzed, 0);
    const avgCycleTime = periodCycles.reduce((sum, cycle) => sum + cycle.cycle_time_ms, 0) / periodCycles.length;

    return {
      period_hours: hours,
      total_cycles: periodCycles.length,
      total_signals_created: totalSignals,
      total_coins_analyzed: totalCoins,
      avg_cycle_time: this.formatTime(avgCycleTime),
      avg_signals_per_cycle: totalSignals / periodCycles.length,
      cycles_with_signals: periodCycles.filter(c => c.signals.total_created > 0).length,
      success_rate: periodCycles.filter(c => c.signals.total_created > 0).length / periodCycles.length,
      
      signal_distribution: {
        buy: periodCycles.reduce((sum, cycle) => sum + cycle.signals.buy_signals, 0),
        sell: periodCycles.reduce((sum, cycle) => sum + cycle.signals.sell_signals, 0)
      },
      
      performance_trend: this.getPerformanceTrend(periodCycles)
    };
  }

  /**
   * Получить тренд производительности
   */
  getPerformanceTrend(cycles) {
    if (cycles.length < 2) return 'insufficient_data';
    
    const recentHalf = cycles.slice(-Math.floor(cycles.length / 2));
    const earlierHalf = cycles.slice(0, Math.floor(cycles.length / 2));
    
    const recentAvgTime = recentHalf.reduce((sum, c) => sum + c.cycle_time_ms, 0) / recentHalf.length;
    const earlierAvgTime = earlierHalf.reduce((sum, c) => sum + c.cycle_time_ms, 0) / earlierHalf.length;
    
    const recentAvgSignals = recentHalf.reduce((sum, c) => sum + c.signals.total_created, 0) / recentHalf.length;
    const earlierAvgSignals = earlierHalf.reduce((sum, c) => sum + c.signals.total_created, 0) / earlierHalf.length;
    
    const timeImprovement = (earlierAvgTime - recentAvgTime) / earlierAvgTime;
    const signalImprovement = (recentAvgSignals - earlierAvgSignals) / (earlierAvgSignals || 1);
    
    if (timeImprovement > 0.1 && signalImprovement > 0.1) return 'improving';
    if (timeImprovement < -0.1 || signalImprovement < -0.1) return 'degrading';
    return 'stable';
  }

  /**
   * Очистить старые статистики
   */
  cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 дней
    const cutoffTime = new Date(Date.now() - maxAge);
    const initialLength = this.cycleStats.length;
    
    this.cycleStats = this.cycleStats.filter(cycle => 
      new Date(cycle.timestamp) >= cutoffTime
    );
    
    const removed = initialLength - this.cycleStats.length;
    if (removed > 0) {
      console.log(`🧹 Очищено ${removed} старых записей статистики`);
    }
  }
}

module.exports = EnhancedMonitoring; 