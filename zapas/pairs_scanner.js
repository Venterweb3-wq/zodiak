const mongoose = require('mongoose');

// This schema must be kept in sync with the one in market_data_collector
const marketOverviewSchema = new mongoose.Schema({
    symbol: { type: String, required: true, unique: true },
    cmc_data: { type: Object },
    coinglass_liquidation: { type: Object },
    coinglass_open_interest: { type: Object },
    coinglass_funding_rate: { type: Object },
    coinglass_long_short: { type: Object },
}, { strict: false, timestamps: true });

const MarketOverview = mongoose.model('MarketOverview', marketOverviewSchema, 'market_overviews');


/**
 * Transforms the coin-centric data from the database into a list of specific pairs 
 * on exchanges, which is the format expected by the scoring logic.
 * @param {Array<Object>} overviews - The array of market overview documents from MongoDB.
 * @returns {Array<Object>} A flattened array of pair-like objects.
 */
function transformOverviewsToPairs(overviews) {
    const allPairs = [];

    for (const overview of overviews) {
        if (!overview.coinglass_open_interest || !Array.isArray(overview.coinglass_open_interest.list)) {
            continue;
        }

        // The list of pairs exists in the open_interest data
        for (const pairData of overview.coinglass_open_interest.list) {
            
            // Reconstruct a pair object that resembles the old structure
            // This is necessary to reuse the scoring logic
            const reconstructedPair = {
                exchange_name: pairData.exchangeName,
                instrument_id: pairData.instrumentId,
                base_asset: overview.symbol,
                quote_asset: pairData.quote, // Assuming the quote asset is available
                funding_rate: pairData.fundingRate,
                open_interest: pairData.openInterest,
                open_interest_change_percent_24h: pairData.h24Change, // Map h24Change to the name the scoring logic expects
                
                // We need to find the matching liquidation data for this specific exchange
                long_liquidation_usd_24h: 0,
                short_liquidation_usd_24h: 0,
            };

            // Find and attach liquidation data for the same exchange
            if (overview.coinglass_liquidation && Array.isArray(overview.coinglass_liquidation.list)) {
                const liqData = overview.coinglass_liquidation.list.find(l => l.exchangeName === pairData.exchangeName);
                if (liqData) {
                    reconstructedPair.long_liquidation_usd_24h = liqData.longVolUsd;
                    reconstructedPair.short_liquidation_usd_24h = liqData.shortVolUsd;
                }
            }

            allPairs.push(reconstructedPair);
        }
    }
    return allPairs;
}


/**
 * Applies a scoring logic to find "hot" pairs based on various metrics.
 * @param {Array<Object>} pairs - The array of reconstructed pair objects.
 * @param {Object} config - The application configuration object.
 * @returns {Array<Object>} A filtered and sorted array of the most interesting pairs.
 */
function scoreAndFilterPairs(pairs, config) {
    const { HOT_PAIRS_CRITERIA } = config;
    const {
        MIN_ABS_FUNDING_RATE,
        MIN_ABS_OI_CHANGE_PERCENT_24H,
        MIN_LIQUIDATION_USD_24H,
        MIN_HOT_SCORE,
    } = HOT_PAIRS_CRITERIA;
    
    const scoredPairs = pairs.map(pair => {
        let score = 0;
        if (Math.abs(pair.funding_rate) >= MIN_ABS_FUNDING_RATE) score++;
        if (Math.abs(pair.open_interest_change_percent_24h) >= MIN_ABS_OI_CHANGE_PERCENT_24H) score++;
        if (pair.long_liquidation_usd_24h > MIN_LIQUIDATION_USD_24H || pair.short_liquidation_usd_24h > MIN_LIQUIDATION_USD_24H) score++;
        
        return { ...pair, hot_score: score };
    }).filter(pair => pair.hot_score >= MIN_HOT_SCORE);

    // Sort by score descending to get the "hottest" pairs first
    return scoredPairs.sort((a, b) => b.hot_score - a.hot_score);
}


/**
 * The main function of the scanner. It fetches pre-collected market overviews from the DB,
 * transforms them, and filters them to find the "hot" or "interesting" ones.
 * @param {Object} config - The application configuration object.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of interesting pair objects.
 */
async function scanAndFilterPairs(config) {
    console.log('[PairsScanner] Fetching market overviews from database...');
    
    // Fetch all fresh data. Stale data should be handled by the collector's update cycle.
    const overviews = await MarketOverview.find({}).lean();

    if (!overviews || overviews.length === 0) {
        console.warn('[PairsScanner] No market overviews found in the database.');
        return [];
    }
    console.log(`[PairsScanner] Found ${overviews.length} market overviews. Transforming to pairs list...`);

    const allPairs = transformOverviewsToPairs(overviews);
    console.log(`[PairsScanner] Transformed into ${allPairs.length} unique pairs. Scoring and filtering...`);

    const interestingPairs = scoreAndFilterPairs(allPairs, config);
    console.log(`[PairsScanner] Found ${interestingPairs.length} interesting pairs.`);
    
    // We only need the exchange name and instrument ID for the next steps
    // But we pass more data for context and potential use in later stages.
    return interestingPairs.map(pair => ({
        exchange_name: pair.exchange_name,
        instrument_id: pair.instrument_id,
        base_asset: pair.base_asset,
        funding_rate: pair.funding_rate,
        oi_change_24h: pair.open_interest_change_percent_24h,
        long_liq_24h: pair.long_liquidation_usd_24h,
        short_liq_24h: pair.short_liquidation_usd_24h,
        hot_score: pair.hot_score,
    }));
}

module.exports = {
    scanAndFilterPairs,
}; 