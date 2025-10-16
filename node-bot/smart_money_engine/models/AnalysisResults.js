const mongoose = require('mongoose');

// Схема для сохранения результатов анализа
const analysisResultSchema = new mongoose.Schema({
  symbol: { 
    type: String, 
    required: true, 
    index: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  
  // Технические индикаторы
  technical: {
    rsi: Number,
    rsi_signal: {
      type: String,
      enum: ['oversold', 'overbought', 'bullish', 'bearish', 'neutral', 'unknown']
    },
    ema_20: Number,
    ema_50: Number,
    ema_trend: {
      type: String,
      enum: ['strong_uptrend', 'uptrend', 'sideways', 'downtrend', 'strong_downtrend', 'unknown']
    },
    bb_upper: Number,
    bb_middle: Number,
    bb_lower: Number,
    bb_position: {
      type: String,
      enum: ['above_upper', 'middle', 'below_lower', 'unknown']
    },
    atr: Number,
    atr_signal: {
      type: String,
      enum: ['high_volatility', 'normal', 'low_volatility', 'unknown']
    },
    volume_ma: Number,
    volume_strength: {
      type: String,
      enum: ['very_strong', 'strong', 'normal', 'weak', 'very_weak', 'unknown']
    },
    macd: {
      value: Number,
      signal: Number,
      histogram: Number
    },
    overall_signal: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral', 'unknown']
    }
  },
  
  // Smart Money факторы
  smart_money: {
    avg_funding_rate: Number,
    funding_signal: {
      type: String,
      enum: ['extremely_positive', 'positive', 'neutral', 'negative', 'extremely_negative']
    },
    best_funding_rate: {
      exchange: String,
      value: Number
    },
    long_liquidations: Number,
    short_liquidations: Number,
    total_liquidations: Number,
    liquidation_bias: {
      type: String,
      enum: ['long_heavy', 'short_heavy', 'balanced', 'low_activity']
    },
    liquidation_ratio: Number, // long/short ratio
    open_interest: Number,
    oi_signal: {
      type: String,
      enum: ['very_high', 'high', 'normal', 'low', 'very_low']
    },
    volume_24h: Number,
    volume_dominance: {
      exchange: String,
      percentage: Number
    }
  },
  
  // Финальный анализ
  analysis: {
    recommendation: {
      type: String,
      enum: ['buy', 'sell', 'wait'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    final_score: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
      index: true
    },
    technical_score: {
      type: Number,
      min: -100,
      max: 100,
      default: 0
    },
    reasoning: [{ type: String }],
    entry_zone: {
      type: [Number]
    },
    stop_loss: {
      type: Number
    },
    take_profit: {
      type: Number
    },
    risk_reward_ratio: Number
  },
  
  // Рыночные условия
  market_context: {
    market_phase: {
      type: String,
      enum: ['bull_market', 'bear_market', 'sideways', 'high_volatility', 'low_volatility']
    },
    btc_dominance: Number,
    fear_greed_index: Number,
    total_market_liquidations: Number
  },
  
  // Метаданные
  data_sources: {
    bybit: Boolean,
    binance: Boolean,
    coinglass: Boolean,
    cmc: Boolean
  },
  processing_time_ms: Number,
  version: {
    type: String,
    default: '1.0'
  },
  
  // Исторические данные для анализа
  historical_data_summary: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true, // Автоматически добавляет createdAt и updatedAt
  collection: 'analysis_results'
});

// Индексы для оптимизации запросов
analysisResultSchema.index({ symbol: 1, createdAt: -1 });
analysisResultSchema.index({ 'analysis.recommendation': 1, 'analysis.final_score': -1 });
analysisResultSchema.index({ 'analysis.final_score': -1 });
analysisResultSchema.index({ createdAt: -1 });

// Виртуальные поля
analysisResultSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

analysisResultSchema.virtual('isActive').get(function() {
  return this.age < 30 * 60 * 1000; // Активен если младше 30 минут
});

// Методы схемы
analysisResultSchema.methods.getFormattedAnalysis = function() {
  const emoji = {
    buy: '🟢',
    sell: '🔴', 
    wait: '⚪'
  };
  
  return {
    symbol: this.symbol,
    recommendation: `${emoji[this.analysis.recommendation]} ${this.analysis.recommendation.toUpperCase()}`,
    confidence: `${(this.analysis.confidence * 100).toFixed(1)}%`,
    score: this.analysis.final_score,
    price: `$${this.price.toFixed(2)}`,
    age: `${Math.round(this.age / 60000)}m ago`
  };
};

analysisResultSchema.methods.getTechnicalSummary = function() {
  const t = this.technical;
  if (!t) return 'No technical data';
  
  return [
    `RSI: ${t.rsi?.toFixed(1)} (${t.rsi_signal})`,
    `EMA: ${t.ema_trend}`,
    `BB: ${t.bb_position}`,
    `Volume: ${t.volume_strength}`,
    `Overall: ${t.overall_signal}`
  ].join(' | ');
};

// Статические методы
analysisResultSchema.statics.getLatestForSymbol = function(symbol) {
  return this.findOne({ symbol }).sort({ createdAt: -1 });
};

analysisResultSchema.statics.getTopSignals = function(limit = 10) {
  return this.find({
    'analysis.recommendation': { $in: ['buy', 'sell'] },
    'analysis.final_score': { $gte: 60 },
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Последний час
  })
  .sort({ 'analysis.final_score': -1 })
  .limit(limit);
};

analysisResultSchema.statics.getMarketOverview = function() {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: '$analysis.recommendation',
        count: { $sum: 1 },
        avgScore: { $avg: '$analysis.final_score' },
        avgConfidence: { $avg: '$analysis.confidence' }
      }
    }
  ]);
};

const AnalysisResult = mongoose.model('AnalysisResult', analysisResultSchema);

module.exports = AnalysisResult; 