const express = require('express');
const AnalysisResult = require('../models/AnalysisResults');
const router = express.Router();

/**
 * GET /api/smart-indicators/:symbol
 * Получить последний анализ для конкретной монеты
 */
router.get('/api/smart-indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = await AnalysisResult.getLatestForSymbol(symbol.toUpperCase());
    
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: `No analysis data found for ${symbol}`
      });
    }

    // Форматируем ответ
    const response = {
      symbol: analysis.symbol,
      price: analysis.price,
      last_updated: analysis.updatedAt,
      age_minutes: Math.round((Date.now() - analysis.updatedAt.getTime()) / 60000),
      
      technical_indicators: {
        rsi: {
          value: analysis.technical.rsi,
          signal: analysis.technical.rsi_signal,
          interpretation: getRSIInterpretation(analysis.technical.rsi, analysis.technical.rsi_signal)
        },
        ema: {
          ema_20: analysis.technical.ema_20,
          ema_50: analysis.technical.ema_50,
          trend: analysis.technical.ema_trend,
          interpretation: getEMAInterpretation(analysis.technical.ema_trend)
        },
        bollinger_bands: {
          upper: analysis.technical.bb_upper,
          middle: analysis.technical.bb_middle,
          lower: analysis.technical.bb_lower,
          position: analysis.technical.bb_position,
          interpretation: getBBInterpretation(analysis.technical.bb_position)
        },
        volume: {
          ma: analysis.technical.volume_ma,
          strength: analysis.technical.volume_strength,
          interpretation: getVolumeInterpretation(analysis.technical.volume_strength)
        },
        atr: {
          value: analysis.technical.atr,
          signal: analysis.technical.atr_signal,
          interpretation: getATRInterpretation(analysis.technical.atr_signal)
        },
        overall: {
          signal: analysis.technical.overall_signal,
          interpretation: getOverallInterpretation(analysis.technical.overall_signal)
        }
      },
      
      smart_money: {
        funding_rate: {
          value: analysis.smart_money.avg_funding_rate,
          signal: analysis.smart_money.funding_signal,
          interpretation: getFundingInterpretation(analysis.smart_money.funding_signal)
        },
        liquidations: {
          long: analysis.smart_money.long_liquidations,
          short: analysis.smart_money.short_liquidations,
          total: analysis.smart_money.total_liquidations,
          bias: analysis.smart_money.liquidation_bias,
          interpretation: getLiquidationInterpretation(analysis.smart_money.liquidation_bias)
        },
        open_interest: {
          value: analysis.smart_money.open_interest,
          signal: analysis.smart_money.oi_signal,
          interpretation: getOIInterpretation(analysis.smart_money.oi_signal)
        }
      },
      
      analysis: {
        recommendation: analysis.analysis.recommendation,
        confidence: Math.round(analysis.analysis.confidence * 100),
        final_score: analysis.analysis.final_score,
        technical_score: analysis.analysis.technical_score,
        reasoning: analysis.analysis.reasoning,
        entry_zone: analysis.analysis.entry_zone,
        stop_loss: analysis.analysis.stop_loss,
        take_profit: analysis.analysis.take_profit,
        risk_reward: analysis.analysis.risk_reward_ratio
      },
      
      market_context: analysis.market_context
    };

    res.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/smart-indicators
 * Получить анализы для всех монет или с фильтрами
 */
router.get('/api/smart-indicators', async (req, res) => {
  try {
    const {
      recommendation,
      min_score,
      max_age_hours = 1,
      limit = 20,
      sort_by = 'final_score'
    } = req.query;

    // Строим фильтр
    const filter = {
      createdAt: { 
        $gte: new Date(Date.now() - parseInt(max_age_hours) * 60 * 60 * 1000) 
      }
    };

    if (recommendation && recommendation !== 'all') {
      filter['analysis.recommendation'] = recommendation;
    }

    if (min_score) {
      filter['analysis.final_score'] = { $gte: parseInt(min_score) };
    }

    // Определяем сортировку
    const sortOptions = {
      final_score: { 'analysis.final_score': -1 },
      confidence: { 'analysis.confidence': -1 },
      updated: { 'updatedAt': -1 },
      symbol: { 'symbol': 1 }
    };

    const sort = sortOptions[sort_by] || sortOptions.final_score;

    const analyses = await AnalysisResult
      .find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .lean();

    const response = {
      total_found: analyses.length,
      filters_applied: {
        recommendation: recommendation || 'all',
        min_score: min_score || 'none',
        max_age_hours: parseInt(max_age_hours),
        sort_by
      },
      data: analyses.map(analysis => ({
        symbol: analysis.symbol,
        price: analysis.price,
        recommendation: analysis.analysis.recommendation,
        confidence: Math.round(analysis.analysis.confidence * 100),
        final_score: analysis.analysis.final_score,
        technical_score: analysis.analysis.technical_score,
        last_updated: analysis.updatedAt,
        age_minutes: Math.round((Date.now() - analysis.updatedAt.getTime()) / 60000),
        
        // Краткие технические данные
        technical_summary: {
          rsi: `${analysis.technical.rsi?.toFixed(1) || 'N/A'} (${analysis.technical.rsi_signal})`,
          trend: analysis.technical.ema_trend,
          bb_position: analysis.technical.bb_position,
          volume: analysis.technical.volume_strength,
          overall: analysis.technical.overall_signal
        },
        
        // Краткие Smart Money данные
        smart_money_summary: {
          funding: analysis.smart_money.funding_signal,
          liquidations: analysis.smart_money.liquidation_bias,
          open_interest: analysis.smart_money.oi_signal
        }
      }))
    };

    res.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/smart-indicators/top-signals
 * Получить топ сигналы с высоким скором
 */
router.get('/api/smart-indicators/top-signals', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topSignals = await AnalysisResult.getTopSignals(parseInt(limit));
    
    const response = {
      total_signals: topSignals.length,
      data: topSignals.map(signal => ({
        symbol: signal.symbol,
        recommendation: signal.analysis.recommendation,
        final_score: signal.analysis.final_score,
        confidence: Math.round(signal.analysis.confidence * 100),
        price: signal.price,
        reasoning: signal.analysis.reasoning,
        entry_zone: signal.analysis.entry_zone,
        stop_loss: signal.analysis.stop_loss,
        take_profit: signal.analysis.take_profit,
        last_updated: signal.updatedAt,
        formatted: signal.getFormattedAnalysis()
      }))
    };

    res.json(response);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/smart-indicators/market-overview
 * Получить общую сводку по рынку
 */
router.get('/api/smart-indicators/market-overview', async (req, res) => {
  try {
    const overview = await AnalysisResult.getMarketOverview();
    
    const stats = {
      total_analyses: 0,
      recommendations: {
        buy: { count: 0, avg_score: 0, avg_confidence: 0 },
        sell: { count: 0, avg_score: 0, avg_confidence: 0 },
        wait: { count: 0, avg_score: 0, avg_confidence: 0 }
      },
      market_sentiment: 'neutral'
    };

    overview.forEach(item => {
      const rec = item._id || 'wait';
      stats.recommendations[rec] = {
        count: item.count,
        avg_score: Math.round(item.avgScore || 0),
        avg_confidence: Math.round((item.avgConfidence || 0) * 100)
      };
      stats.total_analyses += item.count;
    });

    // Определяем общее настроение рынка
    const buyCount = stats.recommendations.buy.count;
    const sellCount = stats.recommendations.sell.count;
    
    if (buyCount > sellCount * 1.5) {
      stats.market_sentiment = 'bullish';
    } else if (sellCount > buyCount * 1.5) {
      stats.market_sentiment = 'bearish';
    }

    res.json(stats);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/smart-indicators/symbols
 * Получить список всех анализируемых символов
 */
router.get('/api/smart-indicators/symbols', async (req, res) => {
  try {
    const symbols = await AnalysisResult.distinct('symbol');
    
    res.json({
      total_symbols: symbols.length,
      symbols: symbols.sort()
    });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Вспомогательные функции для интерпретации
function getRSIInterpretation(value, signal) {
  const interpretations = {
    oversold: '🟢 Перепроданность - потенциал роста',
    overbought: '🔴 Перекупленность - потенциал падения',
    bullish: '📈 Бычий настрой',
    bearish: '📉 Медвежий настрой',
    neutral: '⚪ Нейтральная зона'
  };
  return interpretations[signal] || 'Неизвестный сигнал';
}

function getEMAInterpretation(trend) {
  const interpretations = {
    strong_uptrend: '🚀 Сильный восходящий тренд',
    uptrend: '📈 Восходящий тренд',
    sideways: '↔️ Боковое движение',
    downtrend: '📉 Нисходящий тренд',
    strong_downtrend: '💥 Сильный нисходящий тренд'
  };
  return interpretations[trend] || 'Тренд неопределен';
}

function getBBInterpretation(position) {
  const interpretations = {
    above_upper: '🔴 Выше верхней полосы - возможна коррекция',
    below_lower: '🟢 Ниже нижней полосы - потенциал отскока',
    middle: '⚪ В средней зоне - нейтрально'
  };
  return interpretations[position] || 'Позиция неопределена';
}

function getVolumeInterpretation(strength) {
  const interpretations = {
    very_strong: '💪 Очень сильный объем',
    strong: '📊 Сильный объем',
    normal: '⚪ Нормальный объем',
    weak: '📉 Слабый объем',
    very_weak: '💤 Очень слабый объем'
  };
  return interpretations[strength] || 'Объем неопределен';
}

function getATRInterpretation(signal) {
  const interpretations = {
    high_volatility: '⚡ Высокая волатильность',
    normal: '⚪ Нормальная волатильность',
    low_volatility: '😴 Низкая волатильность'
  };
  return interpretations[signal] || 'Волатильность неопределена';
}

function getOverallInterpretation(signal) {
  const interpretations = {
    bullish: '🐂 Общий бычий настрой',
    bearish: '🐻 Общий медвежий настрой',
    neutral: '⚪ Нейтральные условия'
  };
  return interpretations[signal] || 'Неопределенные условия';
}

function getFundingInterpretation(signal) {
  const interpretations = {
    extremely_positive: '🔥 Экстремально положительный - перегрев',
    positive: '📈 Положительный - бычий настрой',
    neutral: '⚪ Нейтральный',
    negative: '📉 Отрицательный - медвежий настрой',
    extremely_negative: '❄️ Экстремально отрицательный - дно'
  };
  return interpretations[signal] || 'Неопределен';
}

function getLiquidationInterpretation(bias) {
  const interpretations = {
    long_heavy: '💥 Перевес лонг-ликвидаций - потенциал отскока',
    short_heavy: '💥 Перевес шорт-ликвидаций - потенциал падения',
    balanced: '⚖️ Сбалансированные ликвидации',
    low_activity: '😴 Низкая активность ликвидаций'
  };
  return interpretations[bias] || 'Неопределено';
}

function getOIInterpretation(signal) {
  const interpretations = {
    very_high: '🏢 Очень высокий - институциональный интерес',
    high: '📊 Высокий - хороший интерес',
    normal: '⚪ Нормальный',
    low: '📉 Низкий - слабый интерес',
    very_low: '💤 Очень низкий - нет интереса'
  };
  return interpretations[signal] || 'Неопределен';
}

module.exports = router; 