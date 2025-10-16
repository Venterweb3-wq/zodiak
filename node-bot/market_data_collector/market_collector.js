require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const BybitAPI = require('./bybit_api');
const TaapiIoAPI = require('./taapi_io_api');
const { loadCollectorConfig } = require('./config_loader');
const { log } = require('./logger');

log('Скрипт market_collector.js запущен.');
log('Проверка переменной окружения MONGO_URI: ' + (process.env.MONGO_URI || 'не установлена'));

// --- Configuration ---
const COLLECTION_NAME = 'coin_market_data';
const REQUEST_DELAY_MS = 2100; // 2.1 seconds delay
const MAX_COINS_TO_PROCESS = 5; // Уменьшено до 5 для теста TAAPI.IO
const ENABLE_TAAPI_IO = true; // Включено для теста с новым API ключом
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
const CMC_API_KEY = process.env.COINMARKETCAP_API_KEY;
const DJANGO_API_URL = process.env.DJANGO_CONFIG_API_BASE ? `${process.env.DJANGO_CONFIG_API_BASE}/api/smc/cmc-filters/active/` : 'http://127.0.0.1:8000/api/smc/cmc-filters/active/';
const DJANGO_API_TOKEN = process.env.DJANGO_API_TOKEN;
const CMC_REQUEST_LIMIT_FILE = path.join(__dirname, 'logs', 'cmc_request_count.json');
const CMC_REQUEST_LIMIT = 10; // 10 requests per day
const MIN_24H_VOLUME_USD = 25000000; // Minimum 24h volume threshold

// --- Helper to manage CMC request limit ---
function getCmcRequestCount() {
  if (!fs.existsSync(CMC_REQUEST_LIMIT_FILE)) {
    return { date: new Date().toISOString().split('T')[0], count: 0 };
  }
  const data = JSON.parse(fs.readFileSync(CMC_REQUEST_LIMIT_FILE, 'utf8'));
  const currentDate = new Date().toISOString().split('T')[0];
  if (data.date !== currentDate) {
    return { date: currentDate, count: 0 };
  }
  return data;
}

function updateCmcRequestCount() {
  const current = getCmcRequestCount();
  current.count += 1;
  fs.writeFileSync(CMC_REQUEST_LIMIT_FILE, JSON.stringify(current, null, 2), 'utf8');
  return current;
}

// --- Mongoose Schema ---
const CoinMarketDataSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now },
    bybit: {
        kline: mongoose.Schema.Types.Mixed,
        markPriceKline: mongoose.Schema.Types.Mixed,
        fundingRate: mongoose.Schema.Types.Mixed,
        ticker: mongoose.Schema.Types.Mixed,
        orderBook: mongoose.Schema.Types.Mixed,
        recentTrades: mongoose.Schema.Types.Mixed,
    },
    taapi_io: {
        rsi: mongoose.Schema.Types.Mixed,
        macd: mongoose.Schema.Types.Mixed,
        bollingerBands: mongoose.Schema.Types.Mixed,
        movingAverage: mongoose.Schema.Types.Mixed,
        atr: mongoose.Schema.Types.Mixed,
        stochastic: mongoose.Schema.Types.Mixed,
        adx: mongoose.Schema.Types.Mixed,
        parabolicSar: mongoose.Schema.Types.Mixed,
        ichimokuCloud: mongoose.Schema.Types.Mixed,
        forceIndex: mongoose.Schema.Types.Mixed,
        kst: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true, strict: false });

const CoinMarketData = mongoose.model(COLLECTION_NAME, CoinMarketDataSchema, COLLECTION_NAME);

// --- Helper function ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class MarketCollector {
    constructor() {
        log('Инициализация API-клиентов Bybit и TAAPI.IO...');
        this.bybit = new BybitAPI();
        this.taapi_io = new TaapiIoAPI(process.env.TAAPI_IO_API_KEY);
    }

    async run() {
        log(`[Collector] Starting data collection run...`);
        try {
            // Проверка доступности Django API
            log(`[Collector] Checking Django API availability...`);
            const isDjangoApiAvailable = await this.checkDjangoApiAvailability();
            if (isDjangoApiAvailable) {
                log(`[Collector] Django API is available. Will attempt to use it for filtering.`);
            }

            let coins = [];
            try {
                coins = await this.fetchCoinMarketCapData();
                log(`[Collector] Retrieved ${coins.length} coins from CoinMarketCap.`);
            } catch (error) {
                log(`[Collector] CoinMarketCap API request limit reached for today (${new Date().toISOString().split('T')[0]}). Skipping CMC data fetch.`);
                // Получаем список доступных базовых активов с Bybit
                const bybitInstruments = await this.bybitApi.getInstrumentsInfo('linear');
                coins = bybitInstruments.map(instrument => ({
                    symbol: instrument.baseCoin,
                    pair: instrument.symbol
                }));
                // Удаляем дубликаты по baseCoin
                coins = coins.filter((coin, index, self) => 
                    index === self.findIndex(c => c.symbol === coin.symbol)
                );
                log(`[Collector] Found ${coins.length} unique tradable base assets on Bybit.`);
            }

            // Попытка фильтрации через Django API, если доступен
            let filteredCoins = coins;
            if (isDjangoApiAvailable) {
                log(`[Collector] Attempting to filter coins via Django API...`);
                try {
                    const filters = await this.fetchDjangoFilters();
                    log(`[Collector] Received filters from Django API. Data structure: ${JSON.stringify(filters, null, 2).substring(0, 200)}...`);
                    filteredCoins = this._filterCoinsByDjangoConfig(coins, filters);
                    log(`[Collector] Filtering complete. Selected ${filteredCoins.length} coins for processing.`);
                } catch (error) {
                    log(`[Collector] Error filtering coins via Django API: ${error.message}`);
                    log(`[Collector] Falling back to Bybit volume filtering due to Django API error.`);
                    filteredCoins = await this._filterCoinsByVolume(coins);
                }
            } else {
                log(`[Collector] Django API is not available. Falling back to Bybit volume filtering.`);
                filteredCoins = await this._filterCoinsByVolume(coins);
            }

            // Ограничение количества монет для обработки
            filteredCoins = filteredCoins.slice(0, MAX_COINS_TO_PROCESS);
            log(`[Collector] Limited to ${filteredCoins.length} coins for processing due to MAX_COINS_TO_PROCESS setting.`);

            // Обработка каждой монеты
            for (const coin of filteredCoins) {
                await this.processCoin(coin);
                await sleep(REQUEST_DELAY_MS); // Задержка между обработкой монет
            }

            log(`[Collector] Data collection run complete.`);
        } catch (error) {
            log(`[Collector] Error during data collection run: ${error.message}`);
            log(`[Collector] Stack trace: ${error.stack}`);
            throw new Error(`[Collector] Error setting up request: ${error.message}`);
        }
    }

    _filterCoinsByDjangoConfig(coins, filters) {
        // Проверяем, что filters не undefined и является объектом
        if (!filters || typeof filters !== 'object') {
            log(`[Collector] Invalid filters received from Django API. Using all coins.`);
            return coins;
        }
        
        log(`[Collector] Applying Django filters: min_volume_24h=${filters.min_volume_24h}, min_market_cap=${filters.min_market_cap}, min_rank=${filters.min_rank}, max_rank=${filters.max_rank}`);
        
        return coins.filter(coin => {
            // Применяем фильтры на основе данных из CoinMarketCap или других источников
            // Если данных нет, считаем, что монета проходит фильтр
            if (coin.quoteVolume24h) {
                if (filters.min_volume_24h && coin.quoteVolume24h < parseFloat(filters.min_volume_24h)) return false;
            }
            if (coin.marketCap) {
                if (filters.min_market_cap && coin.marketCap < parseFloat(filters.min_market_cap)) return false;
            }
            if (coin.cmcRank) {
                if (filters.min_rank && coin.cmcRank < parseFloat(filters.min_rank)) return false;
                if (filters.max_rank && coin.cmcRank > parseFloat(filters.max_rank)) return false;
            }
            return true;
        });
    }

    async _filterCoinsByVolume(coins) {
        // Фильтрация по объему торгов с использованием данных Bybit
        log(`[Collector] Fetching volume data from Bybit for filtering...`);
        const filtered = [];
        for (let i = 0; i < coins.length; i += 50) {
            const batch = coins.slice(i, i + 50);
            log(`[Collector] Processing batch ${i/50 + 1} of ${Math.ceil(coins.length/50)} for volume filtering...`);
            for (const coin of batch) {
                try {
                    const ticker = await this.bybitApi.getTicker(coin.pair);
                    if (ticker && ticker.vol24h && parseFloat(ticker.vol24h) > 1000000) { // Фильтр по минимальному объему торгов
                        filtered.push(coin);
                    }
                } catch (error) {
                    log(`[Collector] Error fetching volume for ${coin.symbol}: ${error.message}`);
                }
                await sleep(100); // Небольшая задержка между запросами
            }
        }
        log(`[Collector] Volume filtering complete. Selected ${filtered.length} coins with high trading volume.`);
        return filtered;
    }

    async fetchCoinMarketCapData() {
        log(`[API] Calling CoinMarketCap API at ${CMC_API_URL}`);
        const cmcResponse = await axios.get(CMC_API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY },
            params: { start: 1, limit: 5000, convert: 'USD' }
        });
        updateCmcRequestCount();
        return cmcResponse.data.data;
    }

    async fetchDjangoFilters() {
        log(`[Collector] Fetching filters from Django API at ${DJANGO_API_URL}`);
        const djangoResponse = await axios.get(DJANGO_API_URL, {
            headers: { 'Authorization': `Token ${DJANGO_API_TOKEN}` },
            timeout: 10000
        });
        return djangoResponse.data;
    }

    async checkDjangoApiAvailability() {
        log(`[Collector] Checking availability of Django API at: ${DJANGO_API_URL}`);
        try {
            await axios.get(DJANGO_API_URL, {
                headers: { 'Authorization': `Token ${DJANGO_API_TOKEN}` },
                timeout: 5000
            });
            log(`[Collector] Django API at ${DJANGO_API_URL} is available.`);
            return true;
        } catch (error) {
            log(`[Collector] Django API at ${DJANGO_API_URL} is not available: ${error.message}`);
            return false;
        }
    }

    async processCoin(coin) {
        const { symbol, pair } = coin;
        log(`[Process] --- Processing ${symbol} (Pair: ${pair}) ---`);
        log(`Запрос данных для пары: ${pair} (символ: ${symbol}) с Bybit и TAAPI.IO`);
        try {
            // Fetch Bybit data in parallel
            const [kline, markPriceKline, fundingRate, ticker, orderBook, recentTrades] = await Promise.all([
                this.bybit.getKline(pair, '60', 200).catch(err => { log(`[Process] Error fetching Kline for ${pair}: ${err.message}`); return null; }),
                this.bybit.getMarkPriceKline(pair, '60', 200).catch(err => { log(`[Process] Error fetching Mark Price Kline for ${pair}: ${err.message}`); return null; }),
                this.bybit.getFundingHistory(pair).catch(err => { log(`[Process] Error fetching Funding Rate for ${pair}: ${err.message}`); return null; }),
                this.bybit.getTicker(pair).catch(err => { log(`[Process] Error fetching Ticker for ${pair}: ${err.message}`); return null; }),
                this.bybit.getOrderBook(pair).catch(err => { log(`[Process] Error fetching Order Book for ${pair}: ${err.message}`); return null; }),
                this.bybit.getRecentTrades(pair, 200).catch(err => { log(`[Process] Error fetching Recent Trades for ${pair}: ${err.message}`); return null; }),
            ]);

            // Fetch TAAPI.IO data sequentially to respect rate limits
            const indicators = {};
            
            if (ENABLE_TAAPI_IO) {
                log(`[TAAPI.IO] Fetching technical indicators for ${symbol}...`);
                
                // Функция для повторных попыток с экспоненциальной задержкой
                const fetchWithRetry = async (fetchFunction, name, maxRetries = 3) => {
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        try {
                            return await fetchFunction();
                        } catch (error) {
                            if (error.response?.status === 429 && attempt < maxRetries) {
                                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                                log(`[TAAPI.IO] Rate limit hit for ${name}. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                                await sleep(delay);
                                continue;
                            }
                            if (error.response?.status === 404) {
                                log(`[TAAPI.IO] ${name} indicator not available (404)`);
                                return null;
                            }
                            if (error.response?.status === 403) {
                                log(`[TAAPI.IO] Access denied for ${name} (403) - check API key or subscription`);
                                return null;
                            }
                            throw error;
                        }
                    }
                };
                
                // RSI
                try {
                    log(`[TAAPI.IO] Fetching RSI for ${symbol} on 1h`);
                    indicators.rsi = await fetchWithRetry(
                        () => this.taapi_io.getRSI(symbol, '1h'),
                        'RSI'
                    );
                    await sleep(500); // Увеличенная задержка
                } catch (error) {
                    log(`[Process] Error fetching RSI for ${symbol}: ${error.message}`);
                }
                // MACD
                try {
                    log(`[TAAPI.IO] Fetching MACD for ${symbol} on 1h`);
                    indicators.macd = await fetchWithRetry(
                        () => this.taapi_io.getMACD(symbol, '1h'),
                        'MACD'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching MACD for ${symbol}: ${error.message}`);
                }
                // Bollinger Bands
                try {
                    log(`[TAAPI.IO] Fetching Bollinger Bands for ${symbol} on 1h`);
                    indicators.bb = await fetchWithRetry(
                        () => this.taapi_io.getBollingerBands(symbol, '1h'),
                        'Bollinger Bands'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching Bollinger Bands for ${symbol}: ${error.message}`);
                }
                // Moving Average (SMA)
                try {
                    log(`[TAAPI.IO] Fetching SMA for ${symbol} on 1h`);
                    indicators.sma = await fetchWithRetry(
                        () => this.taapi_io.getMovingAverage(symbol, '1h', 20, 'sma'),
                        'SMA'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching SMA for ${symbol}: ${error.message}`);
                }
                // ATR
                try {
                    log(`[TAAPI.IO] Fetching ATR for ${symbol} on 1h`);
                    indicators.atr = await fetchWithRetry(
                        () => this.taapi_io.getATR(symbol, '1h'),
                        'ATR'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching ATR for ${symbol}: ${error.message}`);
                }
                // Stochastic Oscillator
                try {
                    log(`[TAAPI.IO] Fetching Stochastic Oscillator for ${symbol} on 1h`);
                    indicators.stoch = await fetchWithRetry(
                        () => this.taapi_io.getStochastic(symbol, '1h'),
                        'Stochastic'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching Stochastic for ${symbol}: ${error.message}`);
                }
                // ADX
                try {
                    log(`[TAAPI.IO] Fetching ADX for ${symbol} on 1h`);
                    indicators.adx = await fetchWithRetry(
                        () => this.taapi_io.getADX(symbol, '1h'),
                        'ADX'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching ADX for ${symbol}: ${error.message}`);
                }
                // Parabolic SAR
                try {
                    log(`[TAAPI.IO] Fetching Parabolic SAR for ${symbol} on 1h`);
                    indicators.sar = await fetchWithRetry(
                        () => this.taapi_io.getParabolicSAR(symbol, '1h'),
                        'Parabolic SAR'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching Parabolic SAR for ${symbol}: ${error.message}`);
                }
                // Ichimoku Cloud
                try {
                    log(`[TAAPI.IO] Fetching Ichimoku Cloud for ${symbol} on 1h`);
                    indicators.ichimoku = await fetchWithRetry(
                        () => this.taapi_io.getIchimokuCloud(symbol, '1h'),
                        'Ichimoku Cloud'
                    );
                    await sleep(500);
                } catch (error) {
                    log(`[Process] Error fetching Ichimoku Cloud for ${symbol}: ${error.message}`);
                }
                // Пропускаем Force Index и KST так как они возвращают 404
                log(`[TAAPI.IO] Skipping Force Index and KST (not available in current plan)`);
            } else {
                log(`[TAAPI.IO] Skipped - TAAPI.IO is temporarily disabled due to API issues`);
            }
            
            // Проверяем, были ли получены данные хотя бы частично
            if (!kline) {
                log(`[Process] Error processing ${symbol}: No data retrieved from Bybit`);
                console.log(`[Process] Error processing ${symbol}:`);
                return;
            }

            log(`Данные для ${symbol} успешно получены. Формируем объект для сохранения...`);
            const dataToSave = {
                symbol,
                bybit: {
                    kline: kline || [],
                    markPriceKline: markPriceKline || [],
                    fundingRate: fundingRate || {},
                    ticker: ticker || {},
                    orderBook: orderBook || {},
                    recentTrades: recentTrades || []
                },
                taapi_io: {
                    rsi: indicators.rsi || {},
                    macd: indicators.macd || {},
                    bollingerBands: indicators.bb || {},
                    sma: indicators.sma || [],
                    atr: indicators.atr || {},
                    stochastic: indicators.stoch || {},
                    adx: indicators.adx || {},
                    parabolicSar: indicators.sar || {},
                    ichimokuCloud: indicators.ichimoku || {},
                    forceIndex: null, // Не доступен в текущем плане
                    kst: null // Не доступен в текущем плане
                },
                timestamp: new Date()
            };

            log(`Сохранение данных для ${symbol} в MongoDB...`);
            try {
                await CoinMarketData.findOneAndUpdate(
                    { symbol },
                    { $set: dataToSave },
                    { upsert: true }
                );
                log(`Данные для ${symbol} успешно сохранены в MongoDB.`);
            } catch (error) {
                log(`Ошибка при сохранении данных для ${symbol} в MongoDB: ${error.message}`);
            }
        } catch (error) {
            log(`[Process] Unexpected error processing ${symbol}: ${error.message}`);
            log(`[Process] Stack trace for ${symbol}: ${error.stack || 'No stack trace available'}`);
            console.log(`[Process] Error processing ${symbol}:`);
        }
    }
}

module.exports = MarketCollector;