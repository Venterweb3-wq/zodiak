const mongoose = require('mongoose');
const { loadConfig } = require('./config_loader');
const { getCacheManager } = require('./utils/cache');
const { getPriorityManager } = require('./utils/priority_queue');
const { analyzeCoin } = require('./utils/score');
const HistoricalDataService = require('./services/historical_data_service');
const SignalTracker = require('./services/signal_tracker');
const AnalysisSaver = require('./services/analysis_saver');
const appState = require('./utils/app_state');
const logger = require('./utils/logger');
const { normalizeMarketData } = require('./market_data_collector/market_collector');

// Импорт улучшенных компонентов
const TechnicalDashboard = require('./utils/technical_dashboard');
const SignalDeduplication = require('./services/signal_deduplication');
const SignalScoring = require('./services/signal_scoring');
const TopNSelector = require('./services/top_n_selector');
const EnhancedMonitoring = require('./services/enhanced_monitoring');
const SupportResistanceAnalyzer = require('./utils/support_resistance_analyzer');

// Модели данных
const CoinMarketDataSchema = new mongoose.Schema({
    symbol: String,
    timestamp: Date,
    cmc: mongoose.Schema.Types.Mixed,
    bybit: {
        kline: mongoose.Schema.Types.Mixed,
        markPriceKline: mongoose.Schema.Types.Mixed,
        fundingRateHistory: mongoose.Schema.Types.Mixed,
    },
    coinglass: {
        pairs_markets: mongoose.Schema.Types.Mixed,
    }
}, { strict: false, collection: 'coin_market_data' });

const AggregatedDataSchema = new mongoose.Schema({
    symbol: String,
    price: Number,
    avg_funding_rate: Number,
    best_funding_rate: {
        exchange: String,
        value: Number
    },
    sum_long_liquidations_usd: Number,
    sum_short_liquidations_usd: Number,
    avg_open_interest_usd: Number,
    top_volume_exchange: {
        exchange: String,
        volume_usd: Number
    },
    total_volume_usd: Number,
    technical_indicators: {
        rsi: Number,
        rsi_signal: String,
        ema_20: Number,
        ema_50: Number,
        ema_trend: String,
        bb_upper: Number,
        bb_middle: Number,
        bb_lower: Number,
        bb_position: String,
        atr: Number,
        atr_signal: String,
        volume_ma: Number,
        volume_strength: String,
        overall_signal: String,
        macd: mongoose.Schema.Types.Mixed,
        bollingerBands: mongoose.Schema.Types.Mixed,
        sma: { type: Number, default: 0 },
        stochastic: mongoose.Schema.Types.Mixed,
        adx: { type: Number, default: 0 },
        parabolicSar: mongoose.Schema.Types.Mixed,
        ichimokuCloud: mongoose.Schema.Types.Mixed,
        forceIndex: { type: Number, default: 0 },
        kst: mongoose.Schema.Types.Mixed
    }
}, { strict: false, collection: 'coin_market_aggregated' });

const CoinMarketData = mongoose.models.CoinMarketData || mongoose.model('CoinMarketData', CoinMarketDataSchema);
const AggregatedCoinData = mongoose.models.AggregatedCoinData || mongoose.model('AggregatedCoinData', AggregatedDataSchema);

/**
 * Улучшенный анализ всех монет с сохранением в analysis_results
 * @param {object} config - Конфигурация
 * @param {object} services - Инициализированные сервисы
 */
async function analyzeAllCoins(config, services) {
  const startTime = Date.now();
  logger.info('🚀 === УЛУЧШЕННЫЙ ЦИКЛ АНАЛИЗА: ' + new Date().toISOString() + ' ===');
  
  try {
    const {
      cache,
      priorityManager,
      signalTracker,
      analysisSaver,
      technicalDashboard,
      signalDeduplication,
      enhancedMonitoring
    } = services;
    
    // 1. Нормализация данных (существующая логика)
    logger.info('📊 Нормализация рыночных данных...');
    await normalizeMarketData(cache);
    
    // 2. Получение и фильтрация монет
    logger.info('🔍 Получение и фильтрация монет...');
    const coins = await AggregatedCoinData.find({}).lean();
    const analyzableCoins = filterAnalyzableCoins(coins);
    
    logger.info(`📊 К анализу: ${analyzableCoins.length} монет`);
    
    const candidateSignals = [];
    let processedCount = 0;
    
    // 3. Анализ каждой монеты с техническим скорингом
    for (const coin of analyzableCoins) {
      // Проверка остановки
      if (appState.isShutdownRequested()) {
        logger.info('🛑 Остановка анализа по запросу...');
        break;
      }
      
      const coinStartTime = Date.now();
      
      try {
        const srAnalyzer = new SupportResistanceAnalyzer(config.analyzer);
        
        // Рассчитываем уровни S/R, используя данные kline
        const srLevels = srAnalyzer.calculateSupportResistance({ kline: coin.kline_data_bybit });

        // Основной анализ с учетом S/R
        const analysisResult = analyzeCoin(coin, config, null, srLevels);
        
        // Расчет TP/SL только для сигналов BUY/SELL
        if (['buy', 'sell'].includes(analysisResult.decision)) {
            const entryPrice = parseFloat(coin.price);
            const { entry_zone, stop_loss, take_profit } = calculateTradeLevels(
                analysisResult.decision,
                entryPrice,
                srLevels
            );
            analysisResult.entry_zone = entry_zone;
            analysisResult.stop_loss = stop_loss;
            analysisResult.take_profit = take_profit;
        }
        
        // Расчет технического скора
        const technicalScore = TechnicalDashboard.getTechnicalScore(coin.technical_indicators);
        
        // Расчет финального скора
        const finalScore = SignalScoring.calculateFinalScore(
          analysisResult,
          coin,
          technicalScore,
          srLevels
        );
        
        const processingTime = Date.now() - coinStartTime;
        
        // Сохранение результата анализа в базу данных
        await analysisSaver.saveAnalysisResult(
          coin.symbol,
          analysisResult,
          coin,
          technicalScore,
          finalScore,
          processingTime
        );
        
        // Проверка на создание сигнала
        if (analysisResult.recommendation !== 'wait') {
          // Проверка дедупликации
          const isDuplicate = await signalDeduplication.isDuplicateSignal(
            coin.symbol,
            analysisResult.recommendation,
            analysisResult
          );
          
          if (!isDuplicate) {
            // Добавляем в кандидаты только если скор достаточно высокий
            if (finalScore >= 60) {
              candidateSignals.push({
                symbol: coin.symbol,
                analysisResult,
                marketData: coin,
                technicalScore,
                finalScore,
                technicalAnalysis: TechnicalDashboard.formatTechnicalAnalysis(coin),
                processingTime
              });
              
              logger.info(`✨ Кандидат: ${coin.symbol} ${analysisResult.recommendation.toUpperCase()} (Score: ${finalScore})`);
            } else {
              logger.info(`⚪ Низкий скор: ${coin.symbol} (Score: ${finalScore})`);
            }
          }
        }
        
        processedCount++;
        
        // Прогресс каждые 10 монет
        if (processedCount % 10 === 0) {
          logger.info(`📈 Обработано: ${processedCount}/${analyzableCoins.length} монет`);
        }
        
      } catch (error) {
        logger.error(`❌ Ошибка анализа ${coin.symbol}:`, error.message);
      }
    }
    
    logger.info(`\n🎯 Найдено кандидатов: ${candidateSignals.length}`);
    
    // 4. Отбор топ-N сигналов
    const maxSignals = 5; // Максимум 5 сигналов за цикл
    const selectedSignals = await TopNSelector.selectTopSignals(candidateSignals, maxSignals);
    
    // 5. Создание финальных сигналов
    logger.info(`\n🚀 Создание ${selectedSignals.length} финальных сигналов:`);
    
    for (const signal of selectedSignals) {
      try {
        await signalTracker.createSignal(signal.analysisResult, signal.marketData);
        
        logger.info(`\n🎯 СОЗДАН СИГНАЛ: ${signal.symbol} ${signal.analysisResult.recommendation.toUpperCase()}`);
        logger.info(`💯 Финальный скор: ${signal.finalScore}`);
        logger.info(`🎯 Confidence: ${(signal.analysisResult.confidence * 100).toFixed(1)}%`);
        logger.info(`⚡ Технический скор: ${signal.technicalScore}`);
        logger.info(`📊 Reasoning: ${signal.analysisResult.reasoning.slice(0, 2).join(', ')}`);
        logger.info(signal.technicalAnalysis);
        
        if (signal.analysisResult.entry_zone && signal.analysisResult.stop_loss && signal.analysisResult.take_profit) {
            logger.info(`\n📈 ТОРГОВЫЕ УРОВНИ:`);
            logger.info(`  🎯 Зона входа: ${signal.analysisResult.entry_zone[0]} - ${signal.analysisResult.entry_zone[1]}`);
            logger.info(`  🛡️ Стоп-лосс: ${signal.analysisResult.stop_loss}`);
            logger.info(`  💰 Тейк-профит: ${signal.analysisResult.take_profit}`);
        }

        logger.info(`\n🔬 ТЕХНИЧЕСКИЙ АНАЛИЗ:`);
        const techSummary = summarizeTechIndicators(signal.marketData.technical_indicators);
        Object.entries(techSummary).forEach(([key, value]) => {
            logger.info(`${key}: ${value}`);
        });
        
      } catch (error) {
        logger.error(`❌ Ошибка создания сигнала для ${signal.symbol}:`, error.message);
      }
    }
    
    // 6. Генерация сводки цикла
    const cycleTime = Date.now() - startTime;
    const summary = enhancedMonitoring.generateCycleSummary(
      analyzableCoins,
      selectedSignals,
      cycleTime
    );
    
    // 7. Статистика сохранения
    const saveStats = await analysisSaver.getStats();
    logger.info(`\n💾 Статистика сохранения:`);
    logger.info(`📊 Всего анализов: ${saveStats.total_analyses}`);
    logger.info(`📅 За последние 24ч: ${saveStats.last_24h}`);
    logger.info(`🏆 Высокий скор (80+): ${saveStats.high_score_signals}`);
    
    return {
      processed: processedCount,
      candidates: candidateSignals.length,
      signals_created: selectedSignals.length,
      cycle_time: cycleTime,
      summary
    };
    
  } catch (error) {
    logger.error('❌ Ошибка в улучшенном анализе:', error);
    throw error;
  }
}

/**
 * Фильтрация монет для анализа
 */
function filterAnalyzableCoins(coins) {
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD', 'USDe', 'TUSD', 'USDD'];
  
  return coins.filter(coin => {
    // Пропускаем стейблкоины
    if (stablecoins.some(s => coin.symbol.includes(s))) {
      return false;
    }
    
    // Проверяем наличие необходимых данных
    if (!coin.price || coin.price <= 0) {
      return false;
    }
    
    // Проверяем наличие технических индикаторов
    if (!coin.technical_indicators || !coin.technical_indicators.rsi) {
      return false;
    }
    
    // Проверяем наличие данных источников
    if (!coin.data_sources || !coin.data_sources.bybit) {
      return false;
    }
    
    // Минимальный объем торгов (если есть)
    if (coin.total_volume_usd && coin.total_volume_usd < 1000000) { // $1M минимум
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Сортировка по общим ликвидациям (убывание)
    const liqA = (a.sum_long_liquidations_usd || 0) + (a.sum_short_liquidations_usd || 0);
    const liqB = (b.sum_long_liquidations_usd || 0) + (b.sum_short_liquidations_usd || 0);
    return liqB - liqA;
  });
}

/**
 * Создание краткой сводки по техническим индикаторам
 */
function summarizeTechIndicators(indicators) {
    const summary = {};
    for (const key in indicators) {
        if (typeof indicators[key] === 'number') {
            summary[key] = indicators[key].toFixed(2);
        } else if (typeof indicators[key] === 'string') {
            summary[key] = indicators[key];
        }
    }
    return summary;
}

/**
 * Расчет TP/SL на основе уровней
 * @param {string} decision - 'buy' или 'sell'
 * @param {number} price - Текущая цена
 * @param {Array<object>} srLevels - Уровни поддержки и сопротивления
 * @returns {object} - Зоны входа, стоп-лосс и тейк-профит
 */
function calculateTradeLevels(decision, price, srLevels) {
    const supports = srLevels.filter(l => ['support', 'cluster'].includes(l.type)).map(l => l.price).sort((a, b) => b - a);
    const resistances = srLevels.filter(l => ['resistance', 'cluster'].includes(l.type)).map(l => l.price).sort((a, b) => a - b);

    let entry_zone, stop_loss, take_profit;

    if (decision === 'buy') {
        const nearest_support = supports.find(s => s < price) || price * 0.98;
        const nearest_resistance = resistances.find(r => r > price) || price * 1.04;
        
        entry_zone = [nearest_support, price].sort((a,b) => a-b);
        stop_loss = nearest_support * 0.99; // 1% ниже поддержки
        take_profit = nearest_resistance * 0.99; // 1% ниже сопротивления
    } else { // sell
        const nearest_resistance = resistances.find(r => r > price) || price * 1.02;
        const nearest_support = supports.find(s => s < price) || price * 0.96;

        entry_zone = [price, nearest_resistance].sort((a,b) => a-b);
        stop_loss = nearest_resistance * 1.01; // 1% выше сопротивления
        take_profit = nearest_support * 1.01; // 1% выше поддержки
    }

    return {
        entry_zone: entry_zone.map(p => parseFloat(p.toFixed(5))),
        stop_loss: parseFloat(stop_loss.toFixed(5)),
        take_profit: parseFloat(take_profit.toFixed(5)),
    };
}

async function saveAnalysisResult(analysisData) {
    try {
        await AnalysisResult.deleteOne({ symbol: analysisData.symbol, timeframe: analysisData.timeframe });

        // Явное создание объекта для сохранения в соответствии со схемой
        const analysisToSave = {
            symbol: analysisData.symbol,
            timeframe: analysisData.timeframe,
            price: analysisData.price,
            market_cap_usd: analysisData.market_cap_usd,
            technical_indicators: analysisData.technical_indicators,
            is_candidate: analysisData.is_candidate,
            // Вложенный объект analysis
            analysis: {
                decision: analysisData.decision,
                confidence: analysisData.confidence,
                reasoning: analysisData.reasoning,
                final_score: analysisData.final_score,
                technical_score: analysisData.technical_score,
                smart_money_score: analysisData.smart_money_score,
                // Явно передаем торговые уровни
                entry_zone: analysisData.entry_zone,
                stop_loss: analysisData.stop_loss,
                take_profit: analysisData.take_profit,
            }
        };

        const resultToSave = new AnalysisResult(analysisToSave);
        await resultToSave.save();

        logger.info(`💾 Анализ сохранен: ${analysisData.symbol} (${analysisData.decision}, score: ${analysisData.final_score})`);
    } catch (error) {
        logger.error(`❌ Ошибка сохранения анализа для ${analysisData.symbol}: ${error.message}`);
        // Для отладки можно раскомментировать:
        logger.error("Data that failed to save: ", JSON.stringify(analysisData, null, 2));
    }
}

/**
 * Финальный отбор лучших N кандидатов
 */
function createFinalSignals(candidates, signalTracker) {
    logger.info(`\n🚀 Создание ${candidates.length} финальных сигналов:`);
    
    candidates.forEach(c => {
        signalTracker.createSignal(c);

        logger.info(`\n🎯 СОЗДАН СИГНАЛ: ${c.symbol} ${c.decision.toUpperCase()}`);
        logger.info(`💯 Финальный скор: ${c.final_score}`);
        logger.info(`🎯 Confidence: ${c.confidence.toFixed(1)}%`);
        logger.info(`⚡ Технический скор: ${c.technical_score}`);
        if (c.reasoning) {
            logger.info(`📊 Reasoning: ${c.reasoning.join(', ')}`);
        }
        
        if (c.analysis.entry_zone && c.analysis.entry_zone.length === 2) {
            logger.info(`\n📈 ТОРГОВЫЕ УРОВНИ:`);
            logger.info(`  🎯 Зона входа: ${c.analysis.entry_zone[0]} - ${c.analysis.entry_zone[1]}`);
            logger.info(`  🛡️ Стоп-лосс: ${c.analysis.stop_loss}`);
            logger.info(`  💰 Тейк-профит: ${c.analysis.take_profit}`);
        }

        logger.info(`\n🔬 ТЕХНИЧЕСКИЙ АНАЛИЗ:`);
        const techSummary = summarizeTechIndicators(c.technical_indicators);
        Object.entries(techSummary).forEach(([key, value]) => {
            logger.info(`${key}: ${value}`);
        });
    });
}

module.exports = {
  analyzeAllCoins,
  normalizeMarketData,
  filterAnalyzableCoins,
  saveAnalysisResult,
  createFinalSignals
}; 