const axios = require('axios');
const { log } = require('./logger');

class TaapiIoAPI {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('TAAPI.IO API key is required.');
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: 'https://api.taapi.io',
            headers: {
                'accept': 'application/json'
            },
            timeout: 30000
        });
        // Track rate limits
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000; // Reset every minute
    }

    async checkRateLimit() {
        if (Date.now() > this.resetTime) {
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        // TAAPI.IO rate limits depend on the plan, assuming 100 requests per minute for safety
        if (this.requestCount >= 90) { // Leave some buffer
            const waitTime = this.resetTime - Date.now();
            log(`[TAAPI.IO] Rate limit approaching, waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        this.requestCount++;
    }

    /**
     * Get RSI (Relative Strength Index) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for RSI calculation, default 14
     */
    async getRSI(symbol, interval, period = 14) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching RSI for ${symbol} on ${interval}`);
        const response = await this.client.get('/rsi', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period
            }
        });
        return response.data;
    }

    /**
     * Get MACD (Moving Average Convergence Divergence) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} fastPeriod - Fast EMA period, default 12
     * @param {number} slowPeriod - Slow EMA period, default 26
     * @param {number} signalPeriod - Signal line period, default 9
     */
    async getMACD(symbol, interval, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching MACD for ${symbol} on ${interval}`);
        const response = await this.client.get('/macd', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                fastPeriod: fastPeriod,
                slowPeriod: slowPeriod,
                signalPeriod: signalPeriod
            }
        });
        return response.data;
    }

    /**
     * Get Bollinger Bands for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for calculation, default 20
     * @param {number} stds - Standard deviations, default 2
     */
    async getBollingerBands(symbol, interval, period = 20, stds = 2) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching Bollinger Bands for ${symbol} on ${interval}`);
        const response = await this.client.get('/bbands', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period,
                stds: stds
            }
        });
        return response.data;
    }

    /**
     * Get Moving Average (MA) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for calculation, default 20
     * @param {string} maType - Type of moving average (sma, ema, wma, hma), default sma
     */
    async getMovingAverage(symbol, interval, period = 20, maType = 'sma') {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching ${maType.toUpperCase()} for ${symbol} on ${interval}`);
        const response = await this.client.get(`/${maType}`, {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period
            }
        });
        return response.data;
    }

    /**
     * Get ATR (Average True Range) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for calculation, default 14
     */
    async getATR(symbol, interval, period = 14) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching ATR for ${symbol} on ${interval}`);
        const response = await this.client.get('/atr', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period
            }
        });
        return response.data;
    }

    /**
     * Get Stochastic Oscillator for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} kPeriod - K period, default 14
     * @param {number} kSmooth - K smoothing, default 3
     * @param {number} dPeriod - D period, default 3
     */
    async getStochastic(symbol, interval, kPeriod = 14, kSmooth = 3, dPeriod = 3) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching Stochastic Oscillator for ${symbol} on ${interval}`);
        const response = await this.client.get('/stoch', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                kPeriod: kPeriod,
                kSmooth: kSmooth,
                dPeriod: dPeriod
            }
        });
        return response.data;
    }

    /**
     * Get ADX (Average Directional Index) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for calculation, default 14
     */
    async getADX(symbol, interval, period = 14) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching ADX for ${symbol} on ${interval}`);
        const response = await this.client.get('/adx', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period
            }
        });
        return response.data;
    }

    /**
     * Get Parabolic SAR for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} step - Step value, default 0.02
     * @param {number} max - Maximum value, default 0.2
     */
    async getParabolicSAR(symbol, interval, step = 0.02, max = 0.2) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching Parabolic SAR for ${symbol} on ${interval}`);
        const response = await this.client.get('/sar', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                step: step,
                max: max
            }
        });
        return response.data;
    }

    /**
     * Get Ichimoku Cloud for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} conversionPeriod - Conversion line period, default 9
     * @param {number} basePeriod - Base line period, default 26
     * @param {number} spanPeriod - Span period, default 52
     * @param {number} displacement - Displacement, default 26
     */
    async getIchimokuCloud(symbol, interval, conversionPeriod = 9, basePeriod = 26, spanPeriod = 52, displacement = 26) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching Ichimoku Cloud for ${symbol} on ${interval}`);
        const response = await this.client.get('/ichimoku', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                conversionPeriod: conversionPeriod,
                basePeriod: basePeriod,
                spanPeriod: spanPeriod,
                displacement: displacement
            }
        });
        return response.data;
    }

    /**
     * Get Force Index for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} period - Period for calculation, default 13
     */
    async getForceIndex(symbol, interval, period = 13) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching Force Index for ${symbol} on ${interval}`);
        const response = await this.client.get('/fi', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                period: period
            }
        });
        return response.data;
    }

    /**
     * Get Know Sure Thing (KST) for a symbol
     * @param {string} symbol - Trading symbol (e.g., "BTC")
     * @param {string} interval - Timeframe (e.g., "1h", "4h", "1d")
     * @param {number} roc1 - Rate of change 1, default 10
     * @param {number} roc2 - Rate of change 2, default 15
     * @param {number} roc3 - Rate of change 3, default 20
     * @param {number} roc4 - Rate of change 4, default 30
     * @param {number} signal - Signal line period, default 9
     */
    async getKST(symbol, interval, roc1 = 10, roc2 = 15, roc3 = 20, roc4 = 30, signal = 9) {
        await this.checkRateLimit();
        log(`[TAAPI.IO] Fetching KST for ${symbol} on ${interval}`);
        const response = await this.client.get('/kst', {
            params: {
                secret: this.apiKey,
                exchange: 'bybit',
                symbol: `${symbol}/USDT`,
                interval: interval,
                roc1: roc1,
                roc2: roc2,
                roc3: roc3,
                roc4: roc4,
                signal: signal
            }
        });
        return response.data;
    }
}

module.exports = TaapiIoAPI;
