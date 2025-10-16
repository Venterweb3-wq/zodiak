require('dotenv').config();
const mongoose = require('mongoose');
const { loadConfig } = require('./config_loader');
const { getCacheManager } = require('./utils/cache');
const { getPriorityManager } = require('./utils/priority_queue');
const HistoricalDataService = require('./services/historical_data_service');
const SignalTracker = require('./services/signal_tracker');
const NotificationService = require('./services/notification_service');
const AnalysisSaver = require('./services/analysis_saver');
const TechnicalDashboard = require('./utils/technical_dashboard');
const SignalDeduplication = require('./services/signal_deduplication');
const EnhancedMonitoring = require('./services/enhanced_monitoring');
const { analyzeAllCoins } = require('./analysis_engine');
const appState = require('./utils/app_state');
const logger = require('./utils/logger');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartmoney';

// Загрузка конфигурации
let config = null;

// Global references for cleanup
let globalCache = null;
let globalServices = null;

async function initializeServices() {
  if (globalServices) return globalServices;
  
  logger.info('🔧 Инициализация сервисов...');
  
  await mongoose.connect(MONGO_URI);
  logger.info('✅ MongoDB подключено');
  
  const cache = getCacheManager();
  globalCache = cache;
  
  globalServices = {
    cache,
    priorityManager: getPriorityManager(),
    historicalService: new HistoricalDataService(),
    signalTracker: new SignalTracker(),
    notificationService: new NotificationService(),
    analysisSaver: new AnalysisSaver(),
    technicalDashboard: new TechnicalDashboard(),
    signalDeduplication: new SignalDeduplication(),
    enhancedMonitoring: new EnhancedMonitoring()
  };
  
  logger.info('✅ Все сервисы инициализированы');
  return globalServices;
}

async function runAnalysisCycle() {
  const cycleId = new Date().toISOString();
  logger.info(`🔄 === ЦИКЛ АНАЛИЗА: ${cycleId} ===`);

  try {
    // Инициализация сервисов
    const services = await initializeServices();
    
    // Запуск основного цикла анализа
    const result = await analyzeAllCoins(config, services);

    const cycleTime = (new Date() - new Date(cycleId)) / 1000;
    const intervalMinutes = config.run_interval_minutes || 5;
    logger.info(`✅ Цикл завершен за ${cycleTime.toFixed(1)}с. Следующий запуск через ${intervalMinutes} минут.`);
    logger.info(`📊 Результат: обработано ${result.processed}, кандидатов ${result.candidates}, сигналов ${result.signals_created}`);
    
  } catch (error) {
    logger.error(`❌ Ошибка в цикле анализа: ${error.message}`, { stack: error.stack });
  }
}

async function main() {
  logger.info(`🚀 Старт Smart Money Engine: ${new Date().toISOString()}`);
  
  // Загружаем конфигурацию
  config = await loadConfig();
  if (!config) {
    logger.error('❌ Не удалось загрузить конфигурацию');
    process.exit(1);
  }
  
  // Устанавливаем значение интервала по умолчанию если не определено
  const intervalMinutes = config.run_interval_minutes || 5;
  logger.info(`⏰ Режим: циклический запуск каждые ${intervalMinutes} минут`);
  
  // Запуск первого цикла немедленно
  await runAnalysisCycle();
  
  // Функция для планирования следующего цикла
  const scheduleNextCycle = () => {
    if (!appState.isShutdownRequested()) {
      const timeout = setTimeout(async () => {
        await runAnalysisCycle();
        scheduleNextCycle(); // Планируем следующий цикл после завершения текущего
      }, intervalMinutes * 60 * 1000);
      appState.setMainInterval(timeout);
    }
  };
  
  // Запускаем планировщик
  scheduleNextCycle();

  logger.info(`🔄 Система запущена в циклическом режиме. Нажмите Ctrl+C для остановки.`);
}

/**
 * Generate daily market summary
 */
async function generateDailySummary() {
  const AnalysisResult = mongoose.model('AnalysisResult');
  const Signal = mongoose.model('Signal');
  
  // Get top signals
  const topLongs = await AnalysisResult
    .find({ recommendation: 'buy' })
    .sort({ confidence: -1 })
    .limit(5)
    .select('symbol confidence');
    
  const topShorts = await AnalysisResult
    .find({ recommendation: 'sell' })
    .sort({ confidence: -1 })
    .limit(5)
    .select('symbol confidence');
  
  // Get top liquidations
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
          overall_signal: String
      }
  }, { strict: false, collection: 'coin_market_aggregated' });
  
  const AggregatedData = mongoose.model('AggregatedDataSummary', AggregatedDataSchema);
  
  const topLiquidations = await AggregatedData
    .find({})
    .sort({ sum_liquidations_usd: -1 })
    .limit(5)
    .select('symbol sum_liquidations_usd');
  
  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySignals = await Signal.find({
    createdAt: { $gte: today }
  });
  
  const closedToday = todaySignals.filter(s => 
    s.status === 'hit_tp' || s.status === 'hit_sl'
  );
  
  const winRate = closedToday.length > 0 
    ? (closedToday.filter(s => s.status === 'hit_tp').length / closedToday.length) * 100
    : 0;
    
  const avgPnL = closedToday.length > 0
    ? closedToday.reduce((sum, s) => sum + (s.result?.pnlPercent || 0), 0) / closedToday.length
    : 0;
  
  return {
    topLongs: topLongs.map(s => ({ 
      symbol: s.symbol, 
      confidence: (s.confidence * 100).toFixed(0) 
    })),
    topShorts: topShorts.map(s => ({ 
      symbol: s.symbol, 
      confidence: (s.confidence * 100).toFixed(0) 
    })),
    topLiquidations: topLiquidations.map(s => ({ 
      symbol: s.symbol, 
      totalLiquidations: s.sum_liquidations_usd 
    })),
    totalSignals: todaySignals.length,
    winRate: winRate.toFixed(1),
    avgPnL: avgPnL.toFixed(2)
  };
}

async function gracefulShutdown() {
  logger.info('🚨 Получен сигнал SIGINT. Начинаю корректное завершение...');
  
  appState.setShuttingDown();
  const mainTimeout = appState.getMainInterval();
  if (mainTimeout) {
    clearTimeout(mainTimeout);
  }

  try {
    // Даем запущенным процессам немного времени на завершение
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Закрываем соединения
    logger.info('🛑 Остановка сервисов...');
    if (global.historicalDataCollector) {
      await global.historicalDataCollector.stop();
      logger.info('✅ Сбор истории остановлен.');
    }
    if (global.analysisSaver) {
      await global.analysisSaver.stop();
      logger.info('✅ Автосохранение анализа остановлено.');
    }
    if (global.redisClient && global.redisClient.isOpen) {
        await global.redisClient.quit();
        logger.info('✅ Redis отключен.');
    }
    if (global.mongoClient) {
        await global.mongoClient.close();
        logger.info('✅ MongoDB отключен.');
    }
    
    logger.info('👋 Процесс успешно завершен.');
    process.exit(0);

  } catch (error) {
    logger.error('❌ Ошибка при завершении работы:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Необработанная ошибка:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Необработанное отклонение промиса:', reason);
  gracefulShutdown();
});

// Run the main function
main().catch(err => {
  logger.error("❌ Критическая ошибка:", err);
  process.exit(1);
});
