import { getBotSettings, reportTrade, reportRebalance } from './djangoService.js';
import { fetchAllTickers } from './api.js';

// Global state for the bot
let botState = {
    settings: null,
    isPaused: false,
    pauseUntil: null,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * A simple delay function.
 * @param {number} ms - The number of milliseconds to wait.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Converts a string percentage from settings to a decimal.
 * @param {string} percentString - e.g., "2.50"
 * @returns {number} e.g., 0.025
 */
const percentToDecimal = (percentString) => parseFloat(percentString) / 100;

// =============================================================================
// Core Bot Logic
// =============================================================================

/**
 * Finds the best buy (lowest ask) and sell (highest bid) prices from all tickers.
 * @param {Array<object>} allTickers - Ticker data from all exchanges.
 * @param {string} pair - The trading pair to check, e.g., 'ETH/USDT'.
 * @returns {{bestBuy: object, bestSell: object}}
 */
function findBestPrices(allTickers, pair) {
    let bestBuy = null; // Lowest ask price
    let bestSell = null; // Highest bid price

    for (const exchangeTickers of allTickers) {
        const ticker = exchangeTickers[pair];
        if (!ticker) continue;

        if (!bestBuy || ticker.ask < bestBuy.ask) {
            bestBuy = ticker;
        }
        if (!bestSell || ticker.bid > bestSell.bid) {
            bestSell = ticker;
        }
    }

    return { bestBuy, bestSell };
}

/**
 * The main logic function that runs in a loop.
 */
async function runArbitrageCycle() {
    if (botState.isPaused) {
        if (new Date() < botState.pauseUntil) {
            console.log(`Bot is paused for rebalancing. Resuming at ${botState.pauseUntil.toLocaleTimeString()}`);
            return;
        }
        console.log("Resuming bot after rebalance pause.");
        botState.isPaused = false;
        botState.pauseUntil = null;
    }
    
    console.log(`\n--- Running new arbitrage cycle at ${new Date().toLocaleTimeString()} ---`);

    const allTickers = await fetchAllTickers();
    if (allTickers.length === 0) {
        console.log("Could not fetch tickers, skipping cycle.");
        return;
    }

    const { min_spread, trade_commission_percentage } = botState.settings;

    // Iterate over all pairs supported by the mock API
    for (const pair of Object.keys(allTickers[0])) { 
        const { bestBuy, bestSell } = findBestPrices(allTickers, pair);

        if (!bestBuy || !bestSell || bestBuy.exchange === bestSell.exchange) {
            continue; // Not enough data or same exchange
        }

        const spread = bestSell.bid - bestBuy.ask;

        if (spread > parseFloat(min_spread)) {
            console.log(`✅ Arbitrage opportunity found for ${pair}!`);
            console.log(`   - Buy on ${bestBuy.exchange} at ${bestBuy.ask}`);
            console.log(`   - Sell on ${bestSell.exchange} at ${bestSell.bid}`);
            console.log(`   - Spread: ${spread.toFixed(4)} USDT`);
            
            // For now, we just log the opportunity. Reporting is next.
            // Let's simulate the trade and report it.
            const tradeAmount = 100; // Mock trade amount for now
            const commissionRate = percentToDecimal(trade_commission_percentage);
            
            const buyCost = tradeAmount * bestBuy.ask;
            const sellRevenue = tradeAmount * bestSell.bid;

            const buyCommission = buyCost * commissionRate;
            const sellCommission = sellRevenue * commissionRate;
            const totalCommission = buyCommission + sellCommission;

            const profit = sellRevenue - buyCost - totalCommission;

            console.log(`   - Estimated Profit: ${profit.toFixed(4)} USDT (after commissions)`);

            // Report the two trades (buy and sell)
            await reportTrade({
                exchange: bestBuy.exchange,
                coin_name: pair,
                side: 'BUY',
                quantity: tradeAmount,
                price: bestBuy.ask,
                total: buyCost,
            });
            await reportTrade({
                exchange: bestSell.exchange,
                coin_name: pair,
                side: 'SELL',
                quantity: tradeAmount,
                price: bestSell.bid,
                total: sellRevenue,
                profit: profit, // Report profit on the closing trade
            });

            // We found one, let's stop for this cycle to not over-complicate
            return;
        }
    }
}

/**
 * Periodically fetches updated settings from Django.
 */
async function settingsUpdateLoop() {
    while (true) {
        await sleep(5 * 60 * 1000); // Wait for 5 minutes
        try {
            console.log("Updating settings from Django...");
            botState.settings = await getBotSettings();
        } catch (error) {
            console.error("Could not update settings. Using old settings.", error.message);
        }
    }
}


/**
 * The main entry point for the bot.
 */
async function main() {
    console.log("🚀 Starting Cross-Arbitrage Bot...");

    try {
        botState.settings = await getBotSettings();
    } catch (error) {
        console.error("Bot failed to start. Exiting.");
        process.exit(1);
    }
    
    // Start the settings update loop in the background (no await)
    settingsUpdateLoop();

    // Start the main arbitrage loop
    while (true) {
        try {
            await runArbitrageCycle();
        } catch (error) {
            console.error("An error occurred in the main loop:", error);
        }
        const interval = botState.settings.fetch_interval_seconds * 1000;
        await sleep(interval);
    }
}

main(); 