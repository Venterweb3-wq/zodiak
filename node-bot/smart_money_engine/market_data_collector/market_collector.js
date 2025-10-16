const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { calculateTechnicalIndicators } = require('../utils/indicators');

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
        overall_signal: String
    }
}, { strict: false, collection: 'coin_market_aggregated' });

// Создание или получение моделей
const CoinMarketData = mongoose.models.CoinMarketData || mongoose.model('CoinMarketData', CoinMarketDataSchema);
const AggregatedCoinData = mongoose.models.AggregatedCoinData || mongoose.model('AggregatedCoinData', AggregatedDataSchema);

/**
 * Основная функция нормализации рыночных данных
 * @param {Object} cache - Redis кэш (опционально)
 */
async function normalizeMarketData(cache = null) {
    logger.info('🔄 Запуск нормализации рыночных данных...');
    
    try {
        // Получаем сырые данные из coin_market_data
        const rawDataList = await CoinMarketData.find({}).lean();
        logger.info(`🔎 Найдено ${rawDataList.length} документов для нормализации`);
        
        if (rawDataList.length === 0) {
            logger.warn('⚠️ Нет данных для нормализации в коллекции coin_market_data');
            return;
        }
        
        let processed = 0;
        let errors = 0;
        
        for (const doc of rawDataList) {
            try {
                const normalizedData = await normalizeDocument(doc);
                
                if (normalizedData) {
                    // Сохраняем нормализованные данные
                    await AggregatedCoinData.findOneAndUpdate(
                        { symbol: normalizedData.symbol },
                        normalizedData,
                        { upsert: true, new: true }
                    );
                    processed++;
                    
                    // Кэшируем если доступен Redis
                    if (cache) {
                        const cacheKey = `normalized:${normalizedData.symbol}`;
                        await cache.set(cacheKey, normalizedData, 300); // 5 минут TTL
                    }
                } else {
                    errors++;
                    logger.warn(`⚠️ Пропущен ${doc.symbol}: недостаточно данных для нормализации`);
                }
                
            } catch (error) {
                errors++;
                logger.error(`❌ Ошибка нормализации ${doc.symbol}:`, error.message);
                logger.error(`Stack trace: ${error.stack}`);
            }
        }
        
        logger.info(`✅ Нормализация завершена: ${processed} обработано, ${errors} ошибок`);
        
        return {
            processed,
            errors,
            total: rawDataList.length
        };
        
    } catch (error) {
        logger.error('❌ Критическая ошибка нормализации:', error.message);
        throw error;
    }
}

/**
 * Нормализация одного документа
 * @param {Object} doc - Сырой документ из coin_market_data
 * @returns {Object} Нормализованный документ
 */
async function normalizeDocument(doc) {
    if (!doc.symbol) {
        return null;
    }
    
    const symbol = doc.symbol;
    
    try {
        // 1. Извлекаем цену
        const price = extractPrice(doc);
        if (!price || price <= 0) {
            logger.warn(`⚠️ ${symbol}: не удалось извлечь цену`);
            return null;
        }
        
        // 2. Обрабатываем данные CoinGlass (ликвидации, фандинг, OI)
        const smartMoneyData = extractSmartMoneyData(doc);
        
        // 3. Вычисляем технические индикаторы из Bybit данных
        const technicalIndicators = extractTechnicalIndicators(doc);
        
        // 4. Собираем финальный документ
        const normalizedDoc = {
            symbol: symbol,
            price: price,
            
            // Smart Money данные
            avg_funding_rate: smartMoneyData.avg_funding_rate,
            best_funding_rate: smartMoneyData.best_funding_rate,
            sum_long_liquidations_usd: smartMoneyData.sum_long_liquidations_usd,
            sum_short_liquidations_usd: smartMoneyData.sum_short_liquidations_usd,
            avg_open_interest_usd: smartMoneyData.avg_open_interest_usd,
            top_volume_exchange: smartMoneyData.top_volume_exchange,
            total_volume_usd: smartMoneyData.total_volume_usd,
            
            // Технические индикаторы
            technical_indicators: technicalIndicators,
            
            // Метаданные
            updated_at: new Date(),
            data_sources: {
                cmc: !!doc.cmc,
                bybit: !!doc.bybit,
                coinglass: !!doc.coinglass
            },
            kline_data_bybit: doc.bybit && doc.bybit.kline ? doc.bybit.kline.map(candle => ({
                timestamp: parseInt(candle[0]),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]) || 0
            })) : [],
            smart_money_indicators: {
                // ... (тут может быть логика по смарт мани)
            }
        };
        
        return normalizedDoc;
        
    } catch (error) {
        logger.error(`❌ Ошибка обработки документа ${symbol}:`, error.message);
        return null;
    }
}

/**
 * Извлечение цены из различных источников
 */
function extractPrice(doc) {
    // Приоритет: CMC -> Bybit -> CoinGlass
    if (doc.cmc && doc.cmc.quote && doc.cmc.quote.USD && doc.cmc.quote.USD.price) {
        return parseFloat(doc.cmc.quote.USD.price);
    }
    
    if (doc.bybit && doc.bybit.kline && doc.bybit.kline.length > 0) {
        const lastCandle = doc.bybit.kline[doc.bybit.kline.length - 1];
        if (lastCandle && lastCandle.close) {
            return parseFloat(lastCandle.close);
        }
    }
    
    if (doc.coinglass && doc.coinglass.pairs_markets && doc.coinglass.pairs_markets.length > 0) {
        const firstMarket = doc.coinglass.pairs_markets[0];
        if (firstMarket && firstMarket.current_price) {
            return parseFloat(firstMarket.current_price);
        }
    }
    
    return null;
}

/**
 * Извлечение Smart Money данных из CoinGlass
 */
function extractSmartMoneyData(doc) {
    const defaultData = {
        avg_funding_rate: 0,
        best_funding_rate: { exchange: null, value: 0 },
        sum_long_liquidations_usd: 0,
        sum_short_liquidations_usd: 0,
        avg_open_interest_usd: 0,
        top_volume_exchange: { exchange: null, volume_usd: 0 },
        total_volume_usd: 0
    };
    
    if (!doc.coinglass || !doc.coinglass.pairs_markets || doc.coinglass.pairs_markets.length === 0) {
        return defaultData;
    }
    
    const markets = doc.coinglass.pairs_markets;
    
    let sum_funding_rate = 0;
    let funding_count = 0;
    let best_funding_rate = { exchange: null, value: 0 };
    let sum_long_liquidations_usd = 0;
    let sum_short_liquidations_usd = 0;
    let sum_open_interest_usd = 0;
    let oi_count = 0;
    let top_volume_exchange = { exchange: null, volume_usd: 0 };
    let total_volume_usd = 0;
    
    for (const market of markets) {
        // Funding Rate
        const fundingRate = parseFloat(market.funding_rate);
        if (!isNaN(fundingRate)) {
            sum_funding_rate += fundingRate;
            funding_count++;
            
            if (Math.abs(fundingRate) > Math.abs(best_funding_rate.value)) {
                best_funding_rate = {
                    exchange: market.exchange_name || market.exchange,
                    value: fundingRate
                };
            }
        }
        
        // Liquidations
        sum_long_liquidations_usd += parseFloat(market.long_liquidation_usd_24h) || 0;
        sum_short_liquidations_usd += parseFloat(market.short_liquidation_usd_24h) || 0;
        
        // Open Interest
        const openInterest = parseFloat(market.open_interest_usd);
        if (!isNaN(openInterest)) {
            sum_open_interest_usd += openInterest;
            oi_count++;
        }
        
        // Volume
        const volume = parseFloat(market.volume_usd);
        if (!isNaN(volume)) {
            total_volume_usd += volume;
            
            if (volume > top_volume_exchange.volume_usd) {
                top_volume_exchange = {
                    exchange: market.exchange_name || market.exchange,
                    volume_usd: volume
                };
            }
        }
    }
    
    return {
        avg_funding_rate: funding_count > 0 ? sum_funding_rate / funding_count : 0,
        best_funding_rate: best_funding_rate,
        sum_long_liquidations_usd: sum_long_liquidations_usd,
        sum_short_liquidations_usd: sum_short_liquidations_usd,
        avg_open_interest_usd: oi_count > 0 ? sum_open_interest_usd / oi_count : 0,
        top_volume_exchange: top_volume_exchange,
        total_volume_usd: total_volume_usd
    };
}

/**
 * Извлечение и вычисление технических индикаторов
 */
function extractTechnicalIndicators(doc) {
    const defaultIndicators = {
        rsi: null,
        rsi_signal: 'unknown',
        ema_20: null,
        ema_50: null,
        ema_trend: 'unknown',
        bb_upper: null,
        bb_middle: null,
        bb_lower: null,
        bb_position: 'unknown',
        atr: null,
        atr_signal: 'unknown',
        volume_ma: null,
        volume_strength: 'unknown',
        overall_signal: 'neutral'
    };
    
    if (!doc.bybit || !doc.bybit.kline || doc.bybit.kline.length < 20) {
        return defaultIndicators;
    }
    
    try {
        // Преобразуем данные Bybit в формат для расчета индикаторов
        // Bybit kline формат: [timestamp, open, high, low, close, volume, quote_volume]
        const priceHistory = doc.bybit.kline.map(candle => ({
            timestamp: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]) || 0
        })).filter(candle => 
            !isNaN(candle.open) && !isNaN(candle.high) && 
            !isNaN(candle.low) && !isNaN(candle.close)
        );
        
        if (priceHistory.length < 20) {
            logger.warn(`⚠️ ${doc.symbol}: недостаточно валидных свечей для расчета индикаторов (${priceHistory.length})`);
            return defaultIndicators;
        }
        
        // Вычисляем технические индикаторы
        const indicators = calculateTechnicalIndicators(priceHistory);
        
        return {
            rsi: indicators.rsi ? parseFloat(indicators.rsi.toFixed(2)) : null,
            rsi_signal: indicators.rsi_signal || 'unknown',
            ema_20: indicators.ema_20 ? parseFloat(indicators.ema_20.toFixed(4)) : null,
            ema_50: indicators.ema_50 ? parseFloat(indicators.ema_50.toFixed(4)) : null,
            ema_trend: indicators.ema_trend || 'unknown',
            bb_upper: indicators.bb_upper ? parseFloat(indicators.bb_upper.toFixed(4)) : null,
            bb_middle: indicators.bb_middle ? parseFloat(indicators.bb_middle.toFixed(4)) : null,
            bb_lower: indicators.bb_lower ? parseFloat(indicators.bb_lower.toFixed(4)) : null,
            bb_position: indicators.bb_position || 'unknown',
            atr: indicators.atr ? parseFloat(indicators.atr.toFixed(4)) : null,
            atr_signal: indicators.atr_signal || 'unknown',
            volume_ma: indicators.volume_ma ? parseFloat(indicators.volume_ma.toFixed(0)) : null,
            volume_strength: indicators.volume_strength || 'unknown',
            overall_signal: indicators.overall_signal || 'neutral'
        };
        
    } catch (error) {
        logger.error(`❌ Ошибка расчета технических индикаторов для ${doc.symbol}:`, error.message);
        return defaultIndicators;
    }
}

// Экспорт функции
module.exports = {
    normalizeMarketData,
    normalizeDocument,
    extractPrice,
    extractSmartMoneyData,
    extractTechnicalIndicators
}; 