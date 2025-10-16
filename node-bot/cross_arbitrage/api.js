// A map of base prices for our supported tokens.
const basePrices = {
    'ETH/USDT': 2900,
    'BNB/USDT': 550,
    'SOL/USDT': 150,
    'LTC/USDT': 70,
    'TON/USDT': 6.5,
    'NEAR/USDT': 5.2,
    'TRX/USDT': 0.11,
    'XLM/USDT': 0.09,
};

// Supported exchanges
const exchanges = ['OKX', 'MEXC', 'Bybit'];

/**
 * Generates a slightly randomized price based on a base price.
 * @param {number} basePrice The base price for a token.
 * @returns {number} A randomized price.
 */
function getRandomizedPrice(basePrice) {
    // Creates a random fluctuation, e.g., between -0.5% and +0.5%
    const fluctuation = (Math.random() - 0.5) / 100; 
    return basePrice * (1 + fluctuation);
}


/**
 * MOCK: Simulates fetching tickers from a single exchange.
 * @param {string} exchangeName The name of the exchange.
 * @returns {Promise<object>} A promise that resolves to a map of tickers, e.g., { 'ETH/USDT': { bid: 2899, ask: 2901 }, ... }
 */
async function fetchTickersFromExchange(exchangeName) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    
    const tickers = {};
    for (const pair in basePrices) {
        const price = getRandomizedPrice(basePrices[pair]);
        tickers[pair] = {
            // Simulate bid-ask spread
            bid: price * 0.9995, // Price to sell
            ask: price * 1.0005, // Price to buy
            exchange: exchangeName,
        };
    }
    return tickers;
}


/**
 * Fetches tickers from all supported exchanges simultaneously.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of ticker results from all exchanges.
 */
export async function fetchAllTickers() {
    try {
        console.log("Fetching tickers from all exchanges...");
        // Use Promise.all to make requests concurrently
        const promises = exchanges.map(exchange => fetchTickersFromExchange(exchange));
        const results = await Promise.all(promises);
        console.log("Successfully fetched all tickers.");
        return results;
    } catch (error) {
        console.error("Error fetching tickers:", error);
        // Return an empty array to prevent the bot from crashing
        return [];
    }
} 