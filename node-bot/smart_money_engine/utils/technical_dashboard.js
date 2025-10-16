class TechnicalDashboard {
  /**
   * Форматировать технический анализ для вывода
   */
  static formatTechnicalAnalysis(coin) {
    const { technical_indicators: ti } = coin;
    if (!ti) return "❌ Нет технических данных";

    const indicators = [
      `📊 RSI: ${ti.rsi?.toFixed(1) || 'N/A'} (${this.getRSIEmoji(ti.rsi_signal)} ${ti.rsi_signal})`,
      `📈 EMA Trend: ${this.getTrendEmoji(ti.ema_trend)} ${ti.ema_trend}`,
      `📉 BB Position: ${this.getBBEmoji(ti.bb_position)} ${ti.bb_position}`,
      `⚡ ATR: ${ti.atr_signal} ${this.getATREmoji(ti.atr_signal)}`,
      `📊 Volume: ${ti.volume_strength} ${this.getVolumeEmoji(ti.volume_strength)}`,
      `🎯 Overall: ${ti.overall_signal} ${this.getOverallEmoji(ti.overall_signal)}`
    ];

    return `\n🔬 ТЕХНИЧЕСКИЙ АНАЛИЗ:\n${indicators.join('\n')}`;
  }

  /**
   * Рассчитать технический скор
   */
  static getTechnicalScore(indicators) {
    if (!indicators) return 0;
    
    let score = 0;
    const weights = {
      rsi_signal: { 
        oversold: 15, 
        overbought: -15, 
        bullish: 8, 
        bearish: -8, 
        neutral: 0,
        unknown: 0
      },
      ema_trend: { 
        strong_uptrend: 20, 
        uptrend: 10, 
        strong_downtrend: -20, 
        downtrend: -10, 
        sideways: 0,
        unknown: 0
      },
      bb_position: { 
        below_lower: 12, 
        above_upper: -12, 
        middle: 0,
        unknown: 0
      },
      volume_strength: { 
        very_strong: 15, 
        strong: 10, 
        normal: 0, 
        weak: -5, 
        very_weak: -10,
        unknown: 0
      },
      overall_signal: { 
        bullish: 25, 
        bearish: -25, 
        neutral: 0,
        unknown: 0
      }
    };

    Object.entries(weights).forEach(([key, values]) => {
      const signal = indicators[key];
      if (signal && values[signal] !== undefined) {
        score += values[signal];
      }
    });

    return Math.max(-100, Math.min(100, score)); // Ограничиваем от -100 до +100
  }

  /**
   * Получить эмодзи для RSI
   */
  static getRSIEmoji(signal) {
    const emojis = {
      oversold: '🟢', 
      overbought: '🔴', 
      bullish: '📈', 
      bearish: '📉', 
      neutral: '⚪', 
      unknown: '❓'
    };
    return emojis[signal] || '❓';
  }

  /**
   * Получить эмодзи для тренда
   */
  static getTrendEmoji(trend) {
    const emojis = {
      strong_uptrend: '🚀',
      uptrend: '📈',
      sideways: '↔️',
      downtrend: '📉',
      strong_downtrend: '💥',
      unknown: '❓'
    };
    return emojis[trend] || '❓';
  }

  /**
   * Получить эмодзи для Bollinger Bands
   */
  static getBBEmoji(position) {
    const emojis = {
      above_upper: '🔴',
      below_lower: '🟢',
      middle: '⚪',
      unknown: '❓'
    };
    return emojis[position] || '❓';
  }

  /**
   * Получить эмодзи для ATR
   */
  static getATREmoji(signal) {
    const emojis = {
      high_volatility: '⚡',
      normal: '⚪',
      low_volatility: '😴',
      unknown: '❓'
    };
    return emojis[signal] || '❓';
  }

  /**
   * Получить эмодзи для объема
   */
  static getVolumeEmoji(strength) {
    const emojis = {
      very_strong: '💪',
      strong: '📊',
      normal: '⚪',
      weak: '📉',
      very_weak: '💤',
      unknown: '❓'
    };
    return emojis[strength] || '❓';
  }

  /**
   * Получить эмодзи для общего сигнала
   */
  static getOverallEmoji(signal) {
    const emojis = {
      bullish: '🐂',
      bearish: '🐻',
      neutral: '⚪',
      unknown: '❓'
    };
    return emojis[signal] || '❓';
  }
}

module.exports = TechnicalDashboard; 