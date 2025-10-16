/**
 * @fileoverview Market Data Collector Service (Updated Implementation)
 *
 * @description
 * This service collects market data from multiple sources for cryptocurrency analysis.
 * 1. Connects to MongoDB for data storage.
 * 2. Loads configuration and filters from a Django API if available.
 * 3. Fetches coin data from CoinMarketCap with request limits.
 * 4. Filters coins using Django API or falls back to Bybit volume data.
 * 5. Collects detailed market data from Bybit (K-line, funding rates, etc.).
 * 6. Fetches technical indicators from TAAPI.IO (RSI, MACD, etc.).
 * 7. Stores all collected data in the `coin_market_data` collection in MongoDB.
 * 8. Implements rate limiting to respect API constraints.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const MarketCollector = require('./market_collector');

const { MONGO_URI } = process.env;

/**
 * Main application entry point.
 */
async function main() {
    if (!MONGO_URI) {
        console.error("MONGO_URI must be set in the .env file.");
        process.exit(1);
    }

    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }

    const collector = new MarketCollector();

    // The run method contains an indefinite loop, so we just call it once.
    await collector.run();

    // Since the collector runs in a long loop, you might not reach here
    // unless the loop finishes or an error is thrown and caught.
    console.log('Collector has finished its run. Disconnecting from MongoDB.');
    await mongoose.disconnect();
}

main().catch(error => {
    console.error("An unexpected error occurred in the main execution block:", error);
    process.exit(1);
}); 