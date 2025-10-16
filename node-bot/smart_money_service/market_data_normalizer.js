require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000
}).then(() => {
    console.log('Connected to MongoDB for normalization');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Schema for raw data (input)
const RawCoinMarketDataSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now },
    bybit: {
        kline: mongoose.Schema.Types.Mixed,
        markPriceKline: mongoose.Schema.Types.Mixed,
        fundingRateHistory: mongoose.Schema.Types.Mixed,
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

const RawCoinMarketData = mongoose.model('RawCoinMarketData', RawCoinMarketDataSchema, 'coin_market_data');

// Schema for aggregated data (output)
const AggregatedSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now },
    avgFundingRate: { type: Number, default: 0 },
    totalLiquidations: { type: Number, default: 0 },
    avgOpenInterest: { type: Number, default: 0 },
    volume24h: { type: Number, default: 0 },
    priceChange24h: { type: Number, default: 0 },
    bidAskSpread: { type: Number, default: 0 },
    technical_indicators: {
        rsi: { type: Number, default: 0 },
        macd: mongoose.Schema.Types.Mixed,
        bollingerBands: mongoose.Schema.Types.Mixed,
        sma: { type: Number, default: 0 },
        atr: { type: Number, default: 0 },
        stochastic: mongoose.Schema.Types.Mixed,
        adx: { type: Number, default: 0 },
        parabolicSar: mongoose.Schema.Types.Mixed,
        ichimokuCloud: mongoose.Schema.Types.Mixed,
        forceIndex: { type: Number, default: 0 },
        kst: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true, strict: false });

const AggregatedCoinMarketData = mongoose.model('AggregatedCoinMarketData', AggregatedSchema, 'coin_market_aggregated');

async function normalizeData() {
    try {
        console.log('Starting data normalization process...');
        const rawDataList = await RawCoinMarketData.find();
        console.log(`Found ${rawDataList.length} coins to normalize.`);

        for (const rawData of rawDataList) {
            try {
                const { symbol, bybit, taapi_io } = rawData;
                console.log(`Normalizing data for ${symbol}...`);

                let avgFundingRate = 0;
                if (bybit.fundingRateHistory && bybit.fundingRateHistory.result && bybit.fundingRateHistory.result.list && bybit.fundingRateHistory.result.list.length > 0) {
                    const fundingRates = bybit.fundingRateHistory.result.list.map(item => parseFloat(item.fundingRate || 0));
                    avgFundingRate = fundingRates.reduce((a, b) => a + b, 0) / fundingRates.length;
                }

                let totalLiquidations = 0;
                if (bybit.recentTrades && bybit.recentTrades.result && bybit.recentTrades.result.list) {
                    const trades = bybit.recentTrades.result.list;
                    totalLiquidations = trades.filter(t => t.execType === 'BustTrade').reduce((sum, t) => sum + parseFloat(t.size || 0), 0);
                }

                let avgOpenInterest = 0;
                if (bybit.ticker && bybit.ticker.result && bybit.ticker.result.list && bybit.ticker.result.list.length > 0) {
                    avgOpenInterest = parseFloat(bybit.ticker.result.list[0].openInterest || 0);
                }

                let volume24h = 0;
                let priceChange24h = 0;
                if (bybit.ticker && bybit.ticker.result && bybit.ticker.result.list && bybit.ticker.result.list.length > 0) {
                    volume24h = parseFloat(bybit.ticker.result.list[0].turnover24h || 0);
                    priceChange24h = parseFloat(bybit.ticker.result.list[0].price24hPcnt || 0) * 100;
                }

                let bidAskSpread = 0;
                if (bybit.orderBook && bybit.orderBook.result && bybit.orderBook.result.b && bybit.orderBook.result.a && bybit.orderBook.result.b.length > 0 && bybit.orderBook.result.a.length > 0) {
                    const bestBid = parseFloat(bybit.orderBook.result.b[0][0] || 0);
                    const bestAsk = parseFloat(bybit.orderBook.result.a[0][0] || 0);
                    bidAskSpread = bestAsk > 0 && bestBid > 0 ? ((bestAsk - bestBid) / bestAsk) * 100 : 0;
                }

                // Extract technical indicators from TAAPI.IO data
                let rsi = 0;
                let macd = { valueMACD: 0, valueMACDSignal: 0, valueMACDHist: 0 };
                let bollingerBands = { valueUpperBand: 0, valueMiddleBand: 0, valueLowerBand: 0 };
                let sma = 0;
                let atr = 0;
                let stochastic = { valueK: 0, valueD: 0 };
                let adx = 0;
                let parabolicSar = { value: 0 };
                let ichimokuCloud = { conversionLine: 0, baseLine: 0, spanA: 0, spanB: 0 };
                let forceIndex = 0;
                let kst = { valueKST: 0, valueSignal: 0 };

                if (taapi_io) {
                    rsi = taapi_io.rsi && taapi_io.rsi.value ? parseFloat(taapi_io.rsi.value) : 0;
                    macd = taapi_io.macd || macd;
                    bollingerBands = taapi_io.bollingerBands || bollingerBands;
                    sma = taapi_io.movingAverage && taapi_io.movingAverage.value ? parseFloat(taapi_io.movingAverage.value) : 0;
                    atr = taapi_io.atr && taapi_io.atr.value ? parseFloat(taapi_io.atr.value) : 0;
                    stochastic = taapi_io.stochastic || stochastic;
                    adx = taapi_io.adx && taapi_io.adx.value ? parseFloat(taapi_io.adx.value) : 0;
                    parabolicSar = taapi_io.parabolicSar || parabolicSar;
                    ichimokuCloud = taapi_io.ichimokuCloud || ichimokuCloud;
                    forceIndex = taapi_io.forceIndex && taapi_io.forceIndex.value ? parseFloat(taapi_io.forceIndex.value) : 0;
                    kst = taapi_io.kst || kst;
                }

                const aggregatedData = {
                    symbol: symbol,
                    avgFundingRate: avgFundingRate,
                    totalLiquidations: totalLiquidations,
                    avgOpenInterest: avgOpenInterest,
                    volume24h: volume24h,
                    priceChange24h: priceChange24h,
                    bidAskSpread: bidAskSpread,
                    technical_indicators: {
                        rsi: rsi,
                        macd: macd,
                        bollingerBands: bollingerBands,
                        sma: sma,
                        atr: atr,
                        stochastic: stochastic,
                        adx: adx,
                        parabolicSar: parabolicSar,
                        ichimokuCloud: ichimokuCloud,
                        forceIndex: forceIndex,
                        kst: kst
                    }
                };

                await AggregatedCoinMarketData.findOneAndUpdate(
                    { symbol: symbol },
                    { $set: aggregatedData },
                    { upsert: true, new: true }
                );
                console.log(`Normalized and saved aggregated data for ${symbol}`);
            } catch (error) {
                console.error(`Error normalizing data for ${rawData.symbol}:`, error);
            }
        }
        console.log('Data normalization completed.');
    } catch (error) {
        console.error('Error during normalization process:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

normalizeData();