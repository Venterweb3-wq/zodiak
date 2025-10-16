// This file contains the Smart Money Concept (SMC) scoring logic.

const { calculateIndicators } = require('./indicators');

function roundPrice(value) {
  return +parseFloat(value).toFixed(4);
}

function analyzeCoin(data, config, historicalData = null, srLevels = []) {
  const {
    price: entryPrice,
    symbol,
    avg_funding_rate,
    sum_long_liquidations_usd,
    sum_short_liquidations_usd,
    avg_open_interest_usd,
    best_funding_rate,
    top_volume_exchange,
    total_volume_usd,
    technical_indicators
  } = data;

  const extremeFunding = parseFloat(config?.extreme_funding_threshold) || 0.005;
  const minLiquidations = parseFloat(config?.min_liquidations_usd) || 1000000;
  const liqBiasRatio = parseFloat(config?.liquidation_bias_ratio) || 2.0;

  const result = {
    recommendation: 'wait',
    confidence: 0.5,
    entry_zone: null,
    stop_loss: null,
    take_profit: null,
    bias: 'neutral',
    direction: null,
    reasoning: [],
    support_levels: [],
    indicators: null,
    marketPhase: 'unknown'
  };

  // --- Интеграция технических индикаторов ---
  if (technical_indicators) {
    result.indicators = technical_indicators;
    result.marketPhase = technical_indicators.overall_signal || 'unknown';
    
    // Добавляем техническую информацию в reasoning
    if (technical_indicators.rsi_signal === 'oversold') {
      result.reasoning.push(`📊 RSI oversold (${technical_indicators.rsi?.toFixed(1)}) — потенциал для отскока`);
    } else if (technical_indicators.rsi_signal === 'overbought') {
      result.reasoning.push(`📊 RSI overbought (${technical_indicators.rsi?.toFixed(1)}) — возможна коррекция`);
    }
    
    if (technical_indicators.ema_trend === 'strong_uptrend') {
      result.reasoning.push(`📈 Сильный восходящий тренд по EMA — бычий настрой`);
    } else if (technical_indicators.ema_trend === 'strong_downtrend') {
      result.reasoning.push(`📉 Сильный нисходящий тренд по EMA — медвежий настрой`);
    }
    
    if (technical_indicators.bb_position === 'below_lower') {
      result.reasoning.push(`📊 Цена ниже нижней полосы Боллинджера — потенциал отскока`);
    } else if (technical_indicators.bb_position === 'above_upper') {
      result.reasoning.push(`📊 Цена выше верхней полосы Боллинджера — возможна коррекция`);
    }
    
    if (technical_indicators.atr_signal === 'high_volatility') {
      result.reasoning.push(`⚡ Высокая волатильность по ATR — осторожность в позициях`);
    }
    
    if (technical_indicators.volume_strength === 'strong' || technical_indicators.volume_strength === 'very_strong') {
      result.reasoning.push(`📊 Сильный объем — подтверждение движения`);
    }
  }

  // --- Calculate funding momentum but use it more carefully ---
  const fundingMomentum = best_funding_rate && avg_funding_rate !== 0 
    ? best_funding_rate.value / avg_funding_rate 
    : 1;
  
  // Only consider extreme funding momentum (>5x) as a secondary signal
  if (Math.abs(fundingMomentum) > 5) {
    result.reasoning.push(
      `⚡ Резкий скачок фандинга на ${best_funding_rate.exchange} (x${fundingMomentum.toFixed(1)}) — локальный экстрим`
    );
    // Уменьшен вес скачка фандинга
    result.confidence = Math.min(0.70, result.confidence + 0.10);
  }

  // --- Volume dominance analysis ---
  if (total_volume_usd && top_volume_exchange?.volume_usd) {
    const volumeDominance = top_volume_exchange.volume_usd / total_volume_usd;
    if (volumeDominance > 0.5) {
      result.reasoning.push(
        `⚠️ ${top_volume_exchange.exchange} контролирует ${(volumeDominance * 100).toFixed(0)}% объема — возможна манипуляция`
      );
      result.confidence *= 0.85;
    }
  }

  // --- 4. Volume analysis (CRITICAL FILTER) ---
  if (technical_indicators) {
    const { volume_strength } = technical_indicators;
    if (volume_strength === 'very_weak') {
      // Полностью отменяем сигнал при мертвом объеме
      result.recommendation = 'wait';
      result.confidence = 0;
      result.reasoning.push('⛔️ КРИТИЧЕСКИЙ ФАКТОР: Объем торгов практически отсутствует. Сигнал отменен.');
    } else if (volume_strength === 'weak') {
      // Значительно снижаем уверенность при слабом объеме
      result.confidence = Math.max(0, result.confidence - 0.4); // Штраф 40%
      result.reasoning.push('⚠️ Низкий объем торгов. Надежность сигнала значительно снижена.');
    } else if (volume_strength === 'strong' || volume_strength === 'very_strong') {
      result.confidence = Math.min(0.95, result.confidence + 0.25); // Увеличен вес сильного объема
      result.reasoning.push(`📊 Сильный объем подтверждает сигнал`);
    }
  }

  // --- 5. Liquidations (primary driver) ---
  const totalLiquidations = sum_long_liquidations_usd + sum_short_liquidations_usd;
  
  if (totalLiquidations > minLiquidations) {
    if (sum_long_liquidations_usd > sum_short_liquidations_usd * liqBiasRatio) {
      result.bias = 'accumulation';
      result.recommendation = 'buy';
      result.direction = 'long';
      result.confidence = 0.75;
      result.reasoning.push(
        `💥 Перевес лонг-ликвидаций ($${(sum_long_liquidations_usd / 1e6).toFixed(2)}M vs $${(sum_short_liquidations_usd / 1e6).toFixed(2)}M) — отскок вверх`
      );
      
      // Техническое подтверждение для BUY
      if (technical_indicators) {
        if (technical_indicators.rsi_signal === 'oversold') {
          result.confidence = Math.min(0.9, result.confidence + 0.15); // Увеличен вес RSI
          result.reasoning.push(`✅ RSI подтверждает oversold условия`);
        }
        if (technical_indicators.ema_trend.includes('uptrend')) {
          result.confidence = Math.min(0.95, result.confidence + 0.10); // Уменьшен вес тренда
          result.reasoning.push(`✅ Восходящий тренд поддерживает лонг`);
        }
        if (technical_indicators.bb_position === 'below_lower') {
          result.confidence = Math.min(0.9, result.confidence + 0.10);
        }
      }
      
    } else if (sum_short_liquidations_usd > sum_long_liquidations_usd * liqBiasRatio) {
      result.bias = 'distribution';
      result.recommendation = 'sell';
      result.direction = 'short';
      result.confidence = 0.75;
      result.reasoning.push(
        `💥 Перевес шорт-ликвидаций ($${(sum_short_liquidations_usd / 1e6).toFixed(2)}M vs $${(sum_long_liquidations_usd / 1e6).toFixed(2)}M) — разворот вниз`
      );
      
      // Техническое подтверждение для SELL
      if (technical_indicators) {
        if (technical_indicators.rsi_signal === 'overbought') {
          result.confidence = Math.min(0.9, result.confidence + 0.15); // Увеличен вес RSI
          result.reasoning.push(`✅ RSI подтверждает overbought условия`);
        }
        if (technical_indicators.ema_trend.includes('downtrend')) {
          result.confidence = Math.min(0.95, result.confidence + 0.10); // Уменьшен вес тренда
          result.reasoning.push(`✅ Нисходящий тренд поддерживает шорт`);
        }
        if (technical_indicators.bb_position === 'above_upper') {
          result.confidence = Math.min(0.9, result.confidence + 0.10);
        }
      }
      
    } else if (totalLiquidations > minLiquidations * 2) {
      // High liquidations but no clear bias - market is volatile
      result.reasoning.push(
        `⚡ Высокие ликвидации ($${(totalLiquidations / 1e6).toFixed(2)}M) без явного перевеса — высокая волатильность`
      );
      result.confidence = Math.min(0.6, result.confidence + 0.1);
    }
  }

  // --- 6. Funding rate analysis (only if we have a signal) ---
  if (avg_funding_rate < -extremeFunding) {
    result.reasoning.push(`💰 Отрицательный фандинг (${avg_funding_rate.toFixed(4)}) — бычий настрой`);
    if (result.bias === 'accumulation' || result.recommendation === 'wait') {
      if (result.recommendation === 'wait' && totalLiquidations > minLiquidations * 0.5) {
        result.recommendation = 'buy';
        result.direction = 'long';
        result.bias = 'accumulation';
        result.confidence = 0.65;
      } else {
        result.confidence = Math.min(0.85, result.confidence + 0.1);
      }
    }
  } else if (avg_funding_rate > extremeFunding) {
    result.reasoning.push(`💰 Положительный фандинг (${avg_funding_rate.toFixed(4)}) — перегретость`);
    if (result.bias === 'distribution' || result.recommendation === 'wait') {
      if (result.recommendation === 'wait' && totalLiquidations > minLiquidations * 0.5) {
        result.recommendation = 'sell';
        result.direction = 'short';
        result.bias = 'distribution';
        result.confidence = 0.65;
      } else {
        result.confidence = Math.min(0.85, result.confidence + 0.1);
      }
    }
  }

  // --- 7. Open Interest filter ---
  if (avg_open_interest_usd < (parseFloat(config?.min_open_interest_usd) || 5000000)) {
    result.confidence = Math.max(0.4, result.confidence - 0.2);
    result.reasoning.push(`📉 Низкий OI ($${(avg_open_interest_usd / 1e6).toFixed(2)}M) — слабый сигнал`);
  } else if (avg_open_interest_usd > 100000000) { // $100M
    result.reasoning.push(`📊 Высокий OI ($${(avg_open_interest_usd / 1e6).toFixed(0)}M) — институциональный интерес`);
    result.confidence = Math.min(0.9, result.confidence + 0.05);
  }

  // --- 8. Technical indicators integration (enhanced) ---
  if (technical_indicators && result.recommendation !== 'wait') {
    // ATR volatility adjustment
    if (technical_indicators.atr_signal === 'high_volatility') {
      result.confidence = Math.max(0.5, result.confidence - 0.05);
      result.reasoning.push(`⚡ Высокая волатильность требует осторожности`);
    }
    
    // Overall technical signal alignment
    if (technical_indicators.overall_signal === 'bullish' && result.recommendation === 'buy') {
      result.confidence = Math.min(0.95, result.confidence + 0.15);
      result.reasoning.push(`✅ Технические индикаторы подтверждают бычий сигнал`);
    } else if (technical_indicators.overall_signal === 'bearish' && result.recommendation === 'sell') {
      result.confidence = Math.min(0.95, result.confidence + 0.15);
      result.reasoning.push(`✅ Технические индикаторы подтверждают медвежий сигнал`);
    } else if (technical_indicators.overall_signal === 'neutral') {
      result.confidence = Math.max(0.5, result.confidence - 0.05);
      result.reasoning.push(`⚠️ Технические индикаторы нейтральны`);
    }
  }

  // --- 9. Legacy technical indicators support (for backward compatibility) ---
  if (historicalData && historicalData.length >= 20 && !technical_indicators) {
    const indicators = calculateIndicators(historicalData);
    result.indicators = indicators;
    result.marketPhase = indicators.trend;
    
    // RSI confirmation
    if (indicators.rsi) {
      if (indicators.rsi < 30 && result.recommendation === 'buy') {
        result.confidence += 0.1;
        result.reasoning.push(`📊 RSI oversold (${indicators.rsi.toFixed(1)}) подтверждает покупку`);
      } else if (indicators.rsi > 70 && result.recommendation === 'sell') {
        result.confidence += 0.1;
        result.reasoning.push(`📊 RSI overbought (${indicators.rsi.toFixed(1)}) подтверждает продажу`);
      }
    }

    // Trend alignment
    if (indicators.trend && indicators.trend.includes('uptrend') && result.recommendation === 'buy') {
      result.confidence = Math.min(0.95, result.confidence + 0.15);
      result.reasoning.push(`📈 Восходящий тренд подтверждает лонг`);
    } else if (indicators.trend && indicators.trend.includes('downtrend') && result.recommendation === 'sell') {
      result.confidence = Math.min(0.95, result.confidence + 0.15);
      result.reasoning.push(`📉 Нисходящий тренд подтверждает шорт`);
    }
  }

  // --- Additional signal generation for low liquidation scenarios ---
  if (result.recommendation === 'wait' && totalLiquidations < minLiquidations) {
    // Check for extreme funding with good OI
    if (Math.abs(avg_funding_rate) > extremeFunding * 2 && avg_open_interest_usd > 10000000) {
      if (avg_funding_rate < 0) {
        result.recommendation = 'buy';
        result.direction = 'long';
        result.bias = 'accumulation';
        result.confidence = 0.6;
        result.reasoning.push('🔍 Экстремальный негативный фандинг с хорошим OI — возможность для лонга');
      } else {
        result.recommendation = 'sell';
        result.direction = 'short';
        result.bias = 'distribution';
        result.confidence = 0.6;
        result.reasoning.push('🔍 Экстремальный позитивный фандинг с хорошим OI — возможность для шорта');
      }
    }
    
    // Pure technical signal generation when no liquidation data
    if (technical_indicators && result.recommendation === 'wait') {
      if (technical_indicators.overall_signal === 'bullish' && 
          (technical_indicators.rsi_signal === 'oversold' || technical_indicators.bb_position === 'below_lower')) {
        result.recommendation = 'buy';
        result.direction = 'long';
        result.bias = 'accumulation';
        result.confidence = 0.6;
        result.reasoning.push('📊 Чисто технический бычий сигнал');
      } else if (technical_indicators.overall_signal === 'bearish' && 
                 (technical_indicators.rsi_signal === 'overbought' || technical_indicators.bb_position === 'above_upper')) {
        result.recommendation = 'sell';
        result.direction = 'short';
        result.bias = 'distribution';
        result.confidence = 0.6;
        result.reasoning.push('📊 Чисто технический медвежий сигнал');
      }
    }
  }

  // --- НОВЫЙ БЛОК: Генерация SELL-сигнала при пробое поддержки ---
  if (result.recommendation === 'wait' && technical_indicators) {
    const nearestSupport = findNearestLevel(entryPrice, srLevels, 'support');
    if (nearestSupport && entryPrice < nearestSupport.price) {
        // Цена пробила ближайший уровень поддержки
        if (technical_indicators.ema_trend.includes('downtrend') && technical_indicators.volume_strength !== 'very_weak') {
            result.recommendation = 'sell';
            result.direction = 'short';
            result.bias = 'distribution';
            result.confidence = 0.70; // Начальная уверенность для этого типа сигнала
            result.reasoning.push(`💥 Пробой ключевого уровня поддержки $${nearestSupport.price.toFixed(4)} на нисходящем тренде`);
            
            // Дополнительное усиление сигнала, если объем сильный
            if (technical_indicators.volume_strength === 'strong' || technical_indicators.volume_strength === 'very_strong') {
                result.confidence = Math.min(0.85, result.confidence + 0.15);
                result.reasoning.push(`✅ Пробой подтвержден сильным объемом`);
            }
        }
    }
  }

  if (result.reasoning.length === 0) {
    result.reasoning.push('🔍 Нет явных сигналов по ключевым метрикам');
  }

  // Расчет TP/SL с учетом уровней S/R
  const riskConfig = config.risk_management || {};
  const {
    default_tp_ratio: tpRatio = 3.0,
    default_sl_ratio: slRatio = 1.5,
    deviation = 0.8,
  } = riskConfig;

  if (result.recommendation === 'buy') {
    const nearestResistance = findNearestLevel(entryPrice, srLevels, 'resistance');
    result.take_profit = nearestResistance ? nearestResistance.price * 0.998 : entryPrice * (1 + tpRatio / 100);
    
    const nearestSupport = findNearestLevel(entryPrice, srLevels, 'support');
    result.stop_loss = nearestSupport ? nearestSupport.price * 0.998 : entryPrice * (1 - slRatio / 100);
    
    // Добавляем бонус к уверенности, если сигнал у сильного уровня поддержки
    if (nearestSupport) {
      result.confidence = Math.min(0.95, result.confidence + 0.20);
      result.reasoning.push(`🛡️ Сигнал вблизи сильного уровня поддержки ($${nearestSupport.price.toFixed(4)})`);
    }

    result.entry_zone = {
      from: entryPrice * (1 - deviation / 100),
      to: entryPrice * (1 + deviation / 100)
    };
  } else if (result.recommendation === 'sell') {
    const nearestSupport = findNearestLevel(entryPrice, srLevels, 'support');
    result.take_profit = nearestSupport ? nearestSupport.price * 1.002 : entryPrice * (1 - tpRatio / 100);

    const nearestResistance = findNearestLevel(entryPrice, srLevels, 'resistance');
    result.stop_loss = nearestResistance ? nearestResistance.price * 1.002 : entryPrice * (1 + slRatio / 100);

    // Добавляем бонус к уверенности, если сигнал у сильного уровня сопротивления
    if (nearestResistance) {
      result.confidence = Math.min(0.95, result.confidence + 0.20);
      result.reasoning.push(`🛡️ Сигнал вблизи сильного уровня сопротивления ($${nearestResistance.price.toFixed(4)})`);
    }
    
    result.entry_zone = {
      from: entryPrice * (1 + deviation / 100),
      to: entryPrice * (1 - deviation / 100)
    };
  }

  // Final confidence adjustment
  result.confidence = Math.round(result.confidence * 100) / 100;

  return result;
}

/**
 * Находит ближайший уровень заданного типа.
 * @param {number} price - Текущая цена
 * @param {Array<object>} levels - Массив уровней
 * @param {string} type - 'support' или 'resistance'
 * @returns {object|null} - Ближайший уровень или null
 */
function findNearestLevel(price, levels, type) {
  const filteredLevels = levels.filter(l => l.type === type);
  if (filteredLevels.length === 0) return null;

  if (type === 'resistance') {
    // Ищем ближайший уровень сопротивления СВЕРХУ
    return filteredLevels
      .filter(l => l.price > price)
      .sort((a, b) => a.price - b.price)[0] || null;
  } else { // support
    // Ищем ближайший уровень поддержки СНИЗУ
    return filteredLevels
      .filter(l => l.price < price)
      .sort((a, b) => b.price - a.price)[0] || null;
  }
}

module.exports = { analyzeCoin };
