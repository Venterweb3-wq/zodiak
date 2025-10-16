const axios = require('axios');
const { log } = require('./logger');

class BybitAPI {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://api.bybit.com',
            headers: {
                'accept': 'application/json',
            },
            timeout: 30000,
        });
        
        // Track rate limits
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
    }

    async checkRateLimit() {
        if (Date.now() > this.resetTime) {
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        
        // Bybit public API allows 120 requests per minute
        if (this.requestCount >= 110) { // Leave some buffer
            const waitTime = this.resetTime - Date.now();
            log(`[Bybit] Rate limit approaching, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        
        this.requestCount++;
    }

    /**
     * Get ticker information for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     */
    async getTicker(symbol) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching ticker for ${symbol}`);
        const response = await this.client.get('/v5/market/tickers', {
            params: {
                category: 'linear',
                symbol: symbol
            }
        });
        return response.data;
    }

    /**
     * Get open interest for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     * @param {string} interval - Interval (5min, 15min, 30min, 1h, 4h, 1d)
     */
    async getOpenInterest(symbol, interval = '1h') {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching open interest for ${symbol}`);
        const response = await this.client.get('/v5/market/open-interest', {
            params: {
                category: 'linear',
                symbol: symbol,
                intervalTime: interval,
                limit: 200
            }
        });
        return response.data;
    }

    /**
     * Get funding rate history
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     */
    async getFundingHistory(symbol) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching funding history for ${symbol}`);
        const response = await this.client.get('/v5/market/funding/history', {
            params: {
                category: 'linear',
                symbol: symbol,
                limit: 200
            }
        });
        return response.data;
    }

    /**
     * Get 24hr statistics
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     */
    async get24hrStats(symbol) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching 24hr stats for ${symbol}`);
        const response = await this.client.get('/v5/market/tickers', {
            params: {
                category: 'linear',
                symbol: symbol
            }
        });
        return response.data;
    }

    /**
     * Get order book (market depth)
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     * @param {number} limit - Depth limit (1-200)
     */
    async getOrderBook(symbol, limit = 50) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching order book for ${symbol}`);
        const response = await this.client.get('/v5/market/orderbook', {
            params: {
                category: 'linear',
                symbol: symbol,
                limit: limit
            }
        });
        return response.data;
    }

    /**
     * Get recent trades
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     * @param {number} limit - Number of trades (1-1000)
     */
    async getRecentTrades(symbol, limit = 100) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching recent trades for ${symbol}`);
        const response = await this.client.get('/v5/market/recent-trade', {
            params: {
                category: 'linear',
                symbol: symbol,
                limit: limit
            }
        });
        return response.data;
    }

    /**
     * Get kline/candlestick data
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     * @param {string} interval - Interval (1,3,5,15,30,60,120,240,360,720,D,M,W)
     * @param {number} limit - Number of candles (1-1000)
     */
    async getKline(symbol, interval = '60', limit = 200) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching kline for ${symbol}`);
        const response = await this.client.get('/v5/market/kline', {
            params: {
                category: 'linear',
                symbol: symbol,
                interval: interval,
                limit: limit
            }
        });
        return response.data;
    }

    /**
     * Get mark price kline/candlestick data
     * @param {string} symbol - Trading symbol (e.g., "BTCUSDT")
     * @param {string} interval - Interval (1,3,5,15,30,60,120,240,360,720,D,M,W)
     * @param {number} limit - Number of candles (1-1000)
     */
    async getMarkPriceKline(symbol, interval = '60', limit = 200) {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching mark price kline for ${symbol}`);
        const response = await this.client.get('/v5/market/mark-price-kline', {
            params: {
                category: 'linear',
                symbol: symbol,
                interval: interval,
                limit: limit
            }
        });
        return response.data;
    }

    /**
     * Get instrument info
     * @param {string} category - Product type. linear,inverse,option
     */
    async getInstrumentsInfo(category = 'linear') {
        await this.checkRateLimit();
        log(`[Bybit API] Fetching instruments info for ${category}`);
        const response = await this.client.get('/v5/market/instruments-info', {
            params: {
                category: category,
                status: 'Trading'
            }
        });
        return response.data;
    }
}

module.exports = BybitAPI; 