const mongoose = require('mongoose');

// Схема для агрегированных рыночных данных
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
    },
    // Метаданные
    updated_at: { type: Date, default: Date.now },
    data_sources: {
        cmc: Boolean,
        bybit: Boolean,
        coinglass: Boolean
    }
}, { 
    strict: false, 
    collection: 'coin_market_aggregated',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Индексы для оптимизации
AggregatedDataSchema.index({ symbol: 1 });
AggregatedDataSchema.index({ total_volume_usd: -1 });
AggregatedDataSchema.index({ sum_long_liquidations_usd: -1 });
AggregatedDataSchema.index({ sum_short_liquidations_usd: -1 });
AggregatedDataSchema.index({ updated_at: -1 });

// Виртуальные поля
AggregatedDataSchema.virtual('total_liquidations_usd').get(function() {
    return (this.sum_long_liquidations_usd || 0) + (this.sum_short_liquidations_usd || 0);
});

AggregatedDataSchema.virtual('liquidation_bias').get(function() {
    const longLiq = this.sum_long_liquidations_usd || 0;
    const shortLiq = this.sum_short_liquidations_usd || 0;
    const totalLiq = longLiq + shortLiq;
    
    if (totalLiq === 0) return 'no_data';
    if (longLiq > shortLiq * 2) return 'long_heavy';
    if (shortLiq > longLiq * 2) return 'short_heavy';
    return 'balanced';
});

// Методы экземпляра
AggregatedDataSchema.methods.getFormattedPrice = function() {
    if (!this.price) return 'N/A';
    if (this.price < 0.01) return this.price.toFixed(8);
    if (this.price < 1) return this.price.toFixed(6);
    if (this.price < 100) return this.price.toFixed(4);
    return this.price.toFixed(2);
};

AggregatedDataSchema.methods.getFormattedVolume = function() {
    if (!this.total_volume_usd) return 'N/A';
    const volume = this.total_volume_usd;
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(2)}`;
};

// Статические методы
AggregatedDataSchema.statics.getTopByVolume = function(limit = 10) {
    return this.find({})
        .sort({ total_volume_usd: -1 })
        .limit(limit);
};

AggregatedDataSchema.statics.getTopByLiquidations = function(limit = 10) {
    return this.aggregate([
        {
            $addFields: {
                total_liquidations: {
                    $add: ['$sum_long_liquidations_usd', '$sum_short_liquidations_usd']
                }
            }
        },
        { $sort: { total_liquidations: -1 } },
        { $limit: limit }
    ]);
};

AggregatedDataSchema.statics.getBySymbol = function(symbol) {
    return this.findOne({ symbol: symbol.toUpperCase() });
};

// Обеспечиваем что виртуальные поля включаются в JSON
AggregatedDataSchema.set('toJSON', { virtuals: true });
AggregatedDataSchema.set('toObject', { virtuals: true });

const AggregatedCoinData = mongoose.model('AggregatedCoinData', AggregatedDataSchema);

module.exports = AggregatedCoinData; 