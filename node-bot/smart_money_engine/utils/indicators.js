/**
 * Technical Indicators Module
 * Calculates RSI, EMA, Bollinger Bands, ATR, Volume MA and other indicators
 */

const TI = require('technicalindicators');

/**
 * Format small numbers for display
 */
function formatPrice(price, symbol = '') {
  if (!price || price === 0) return 'N/A';
  
  // For very small prices (< 0.01), show more decimal places
  if (price < 0.01) {
    return price.toFixed(8);
  } else if (price < 1) {
    return price.toFixed(6);
  } else if (price < 100) {
    return price.toFixed(4);
  } else {
    return price.toFixed(2);
  }
}

/**
 * Calculate all technical indicators for a coin
 * @param {Array} priceHistory - Array of {timestamp, open, high, low, close, volume}
 * @returns {Object} Calculated indicators with signals
 */
function calculateIndicators(priceHistory) {
  if (!priceHistory || priceHistory.length < 20) {
    return {
      rsi: null,
      rsi_signal: 'insufficient_data',
      ema20: null,
      ema50: null,
      ema_trend: 'unknown',
      bb: null,
      bb_position: 'unknown',
      atr: null,
      atr_signal: 'unknown',
      volumeProfile: null,
      volume_ma: null,
      volume_strength: 'unknown',
      trend: 'unknown',
      overall_signal: 'neutral'
    };
  }

  const closes = priceHistory.map(p => p.close);
  const highs = priceHistory.map(p => p.high);
  const lows = priceHistory.map(p => p.low);
  const volumes = priceHistory.map(p => p.volume);

  // RSI (14)
  const rsiValues = TI.RSI.calculate({
    values: closes,
    period: 14
  });
  const currentRSI = rsiValues[rsiValues.length - 1];
  const rsiSignal = getRSISignal(currentRSI);

  // EMA 20 & 50
  const ema20Values = TI.EMA.calculate({
    values: closes,
    period: 20
  });
  const ema50Values = TI.EMA.calculate({
    values: closes,
    period: 50
  });
  
  const ema20Current = ema20Values[ema20Values.length - 1];
  const ema50Current = ema50Values[ema50Values.length - 1];
  const emaTrend = getEMATrend(ema20Current, ema50Current, closes[closes.length - 1]);

  // Bollinger Bands
  const bbValues = TI.BollingerBands.calculate({
    period: 20,
    values: closes,
    stdDev: 2
  });
  const currentBB = bbValues[bbValues.length - 1];
  const bbPosition = getBollingerPosition(closes[closes.length - 1], currentBB);

  // ATR (Average True Range) - 14 period
  const atrValues = TI.ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14
  });
  const currentATR = atrValues[atrValues.length - 1];
  const atrSignal = getATRSignal(currentATR, closes[closes.length - 1]);

  // MACD
  const macdValues = TI.MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const currentMACD = macdValues[macdValues.length - 1];

  // Volume Moving Average (20 period)
  const volumeMAValues = TI.SMA.calculate({
    values: volumes,
    period: 20
  });
  const currentVolumeMA = volumeMAValues[volumeMAValues.length - 1];
  const currentVolume = volumes[volumes.length - 1];
  const volumeStrength = getVolumeStrength(currentVolume, currentVolumeMA);

  // Volume Profile (simplified)
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = currentVolume / avgVolume;

  // Overall trend detection
  const trend = detectTrend(ema20Current, ema50Current, closes, currentRSI, currentBB);
  
  // Generate overall signal
  const overallSignal = generateOverallSignal({
    rsi: currentRSI,
    rsiSignal,
    emaTrend,
    bbPosition,
    atrSignal,
    volumeStrength,
    macd: currentMACD,
    trend
  });

  return {
    rsi: currentRSI,
    rsi_signal: rsiSignal,
    ema_20: ema20Current,
    ema_50: ema50Current,
    ema_trend: emaTrend,
    bb_upper: currentBB?.upper,
    bb_middle: currentBB?.middle,
    bb_lower: currentBB?.lower,
    bb_position: bbPosition,
    atr: currentATR,
    atr_signal: atrSignal,
    volume_ma: currentVolumeMA,
    volume_strength: volumeStrength,
    volumeProfile: {
      current: currentVolume,
      average: avgVolume,
      ratio: volumeRatio
    },
    macd: currentMACD,
    trend: trend,
    overall_signal: overallSignal,
    // Additional derived signals
    signals: generateDetailedSignals(currentRSI, currentBB, currentMACD, trend, volumeStrength)
  };
}

/**
 * Enhanced function to calculate technical indicators and return structured data
 * @param {Array} priceHistory - OHLCV data
 * @returns {Object} Structured technical indicators
 */
function calculateTechnicalIndicators(priceHistory) {
  const indicators = calculateIndicators(priceHistory);
  
  return {
    rsi: indicators.rsi,
    rsi_signal: indicators.rsi_signal,
    ema_20: indicators.ema_20,
    ema_50: indicators.ema_50,
    ema_trend: indicators.ema_trend,
    bb_upper: indicators.bb_upper,
    bb_middle: indicators.bb_middle,
    bb_lower: indicators.bb_lower,
    bb_position: indicators.bb_position,
    atr: indicators.atr,
    atr_signal: indicators.atr_signal,
    volume_ma: indicators.volume_ma,
    volume_strength: indicators.volume_strength,
    overall_signal: indicators.overall_signal
  };
}

/**
 * Get RSI signal classification
 */
function getRSISignal(rsi) {
  if (rsi == null) return 'unknown';
  if (rsi < 30) return 'oversold';
  if (rsi > 70) return 'overbought';
  if (rsi < 40) return 'bearish';
  if (rsi > 60) return 'bullish';
  return 'neutral';
}

/**
 * Get EMA trend classification
 */
function getEMATrend(ema20, ema50, currentPrice) {
  if (!ema20 || !ema50) return 'unknown';
  
  const priceAboveEMA20 = currentPrice > ema20;
  const priceAboveEMA50 = currentPrice > ema50;
  const ema20AboveEMA50 = ema20 > ema50;

  if (priceAboveEMA20 && priceAboveEMA50 && ema20AboveEMA50) {
    return 'strong_uptrend';
  } else if (priceAboveEMA20 && ema20AboveEMA50) {
    return 'uptrend';
  } else if (!priceAboveEMA20 && !priceAboveEMA50 && !ema20AboveEMA50) {
    return 'strong_downtrend';
  } else if (!priceAboveEMA20 && !ema20AboveEMA50) {
    return 'downtrend';
  } else {
    return 'sideways';
  }
}

/**
 * Get Bollinger Bands position
 */
function getBollingerPosition(price, bb) {
  if (!bb) return 'unknown';
  
  if (price > bb.upper) return 'above_upper';
  if (price < bb.lower) return 'below_lower';
  
  const middleRange = (bb.upper - bb.lower) * 0.2; // 20% of range
  if (price > bb.middle + middleRange) return 'upper_middle';
  if (price < bb.middle - middleRange) return 'lower_middle';
  
  return 'middle';
}

/**
 * Get ATR signal classification
 */
function getATRSignal(atr, price) {
  if (!atr || !price || atr === 0) return 'unknown';
  
  const atrPercent = (atr / price) * 100;
  
  if (atrPercent > 10) return 'extreme_volatility';
  if (atrPercent > 5) return 'high_volatility';
  if (atrPercent < 0.5) return 'low_volatility';
  if (atrPercent > 3) return 'elevated_volatility';
  return 'normal';
}

/**
 * Get volume strength classification
 */
function getVolumeStrength(currentVolume, volumeMA) {
  if (!currentVolume || !volumeMA) return 'unknown';
  
  const ratio = currentVolume / volumeMA;
  
  if (ratio > 2) return 'very_strong';
  if (ratio > 1.5) return 'strong';
  if (ratio > 1.2) return 'above_average';
  if (ratio < 0.5) return 'very_weak';
  if (ratio < 0.8) return 'weak';
  return 'normal';
}

/**
 * Detect market trend based on multiple indicators
 */
function detectTrend(ema20, ema50, closes, rsi, bb) {
  const currentPrice = closes[closes.length - 1];
  const emaTrend = getEMATrend(ema20, ema50, currentPrice);
  
  // Combine EMA trend with other indicators
  if (emaTrend.includes('strong_uptrend')) {
    if (rsi && rsi < 70) return 'strong_uptrend_healthy';
    return 'strong_uptrend';
  }
  
  if (emaTrend.includes('strong_downtrend')) {
    if (rsi && rsi > 30) return 'strong_downtrend_oversold';
    return 'strong_downtrend';
  }
  
  return emaTrend;
}

/**
 * Generate overall signal based on all indicators
 */
function generateOverallSignal(indicators) {
  let bullishPoints = 0;
  let bearishPoints = 0;
  
  // RSI signals
  if (indicators.rsiSignal === 'oversold') bullishPoints += 2;
  if (indicators.rsiSignal === 'overbought') bearishPoints += 2;
  if (indicators.rsiSignal === 'bullish') bullishPoints += 1;
  if (indicators.rsiSignal === 'bearish') bearishPoints += 1;
  
  // EMA trend signals
  if (indicators.emaTrend.includes('uptrend')) bullishPoints += 2;
  if (indicators.emaTrend.includes('downtrend')) bearishPoints += 2;
  
  // Bollinger Bands signals
  if (indicators.bbPosition === 'below_lower') bullishPoints += 1;
  if (indicators.bbPosition === 'above_upper') bearishPoints += 1;
  
  // Volume strength
  if (indicators.volumeStrength === 'strong' || indicators.volumeStrength === 'very_strong') {
    if (bullishPoints > bearishPoints) bullishPoints += 1;
    if (bearishPoints > bullishPoints) bearishPoints += 1;
  }
  
  // ATR consideration (high volatility = caution)
  if (indicators.atrSignal === 'high_volatility' || indicators.atrSignal === 'extreme_volatility') {
    bullishPoints *= 0.8;
    bearishPoints *= 0.8;
  }
  
  const difference = Math.abs(bullishPoints - bearishPoints);
  
  if (bullishPoints > bearishPoints && difference >= 2) return 'bullish';
  if (bearishPoints > bullishPoints && difference >= 2) return 'bearish';
  if (bullishPoints > bearishPoints && difference >= 1) return 'slightly_bullish';
  if (bearishPoints > bullishPoints && difference >= 1) return 'slightly_bearish';
  
  return 'neutral';
}

/**
 * Generate detailed trading signals based on indicators
 */
function generateDetailedSignals(rsi, bb, macd, trend, volumeStrength) {
  const signals = [];

  // RSI signals
  if (rsi < 30) {
    signals.push({ 
      type: 'rsi_oversold', 
      strength: 0.8, 
      action: 'buy',
      description: `RSI oversold at ${rsi.toFixed(1)}`
    });
  } else if (rsi > 70) {
    signals.push({ 
      type: 'rsi_overbought', 
      strength: 0.8, 
      action: 'sell',
      description: `RSI overbought at ${rsi.toFixed(1)}`
    });
  }

  // Bollinger Bands signals
  if (bb) {
    const bbWidth = (bb.upper - bb.lower) / bb.middle;
    if (bbWidth < 0.05) {
      signals.push({ 
        type: 'bb_squeeze', 
        strength: 0.6, 
        action: 'wait',
        description: 'Bollinger Bands squeeze - breakout expected'
      });
    }
  }

  // MACD signals
  if (macd && macd.MACD > macd.signal) {
    signals.push({ 
      type: 'macd_bullish_cross', 
      strength: 0.7, 
      action: 'buy',
      description: 'MACD bullish crossover'
    });
  } else if (macd && macd.MACD < macd.signal) {
    signals.push({ 
      type: 'macd_bearish_cross', 
      strength: 0.7, 
      action: 'sell',
      description: 'MACD bearish crossover'
    });
  }

  // Volume confirmation
  if (volumeStrength === 'strong' || volumeStrength === 'very_strong') {
    signals.forEach(signal => {
      if (signal.action !== 'wait') {
        signal.strength *= 1.2;
        signal.description += ' (strong volume confirmation)';
      }
    });
  }

  // Trend confirmation
  if (trend && trend.includes('uptrend')) {
    signals.forEach(s => {
      if (s.action === 'buy') s.strength *= 1.15;
    });
  } else if (trend && trend.includes('downtrend')) {
    signals.forEach(s => {
      if (s.action === 'sell') s.strength *= 1.15;
    });
  }

  return signals;
}

module.exports = {
  calculateIndicators,
  calculateTechnicalIndicators,
  detectTrend,
  generateDetailedSignals,
  getRSISignal,
  getEMATrend,
  getBollingerPosition,
  getATRSignal,
  getVolumeStrength,
  formatPrice
}; 