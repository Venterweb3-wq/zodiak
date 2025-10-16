const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const axios = require('axios');

// --- Configuration ---
let djangoApiBaseUrl = process.env.DJANGO_API_BASE_URL || 'http://127.0.0.1:8000/api/internal/bot-gateway';
if (djangoApiBaseUrl.includes('#')) {
    djangoApiBaseUrl = djangoApiBaseUrl.split('#')[0].trim();
}
const DJANGO_API_BASE_URL = djangoApiBaseUrl;
const BOT_WORKER_TOKEN = process.env.BOT_WORKER_TOKEN;
const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
const FETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

console.log('DEBUG: DJANGO_API_BASE_URL =', DJANGO_API_BASE_URL);
console.log('DEBUG: BOT_WORKER_TOKEN set =', !!BOT_WORKER_TOKEN);

// --- API Clients ---

const djangoApi = axios.create({
    baseURL: DJANGO_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Bot-Token': BOT_WORKER_TOKEN,
    }
});

const coingeckoApi = axios.create({
    baseURL: COINGECKO_API_BASE_URL,
    headers: {
        'Accept': 'application/json',
    }
});

// --- API Call Functions ---

async function fetchGlobalMarketData() {
    try {
        console.log('Fetching global market data from CoinGecko...');
        const response = await coingeckoApi.get('/global');
        console.log('Successfully fetched market data.');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching global market data from CoinGecko:', error.message);
        return null;
    }
}

async function fetchTrendingCoins() {
    try {
        console.log('Fetching trending coins from CoinGecko...');
        const trendingResponse = await coingeckoApi.get('/search/trending');
        const trendingCoinIds = trendingResponse.data.coins.map(c => c.item.id);

        const marketDataResponse = await coingeckoApi.get('/coins/markets', {
            params: {
                vs_currency: 'usd',
                ids: trendingCoinIds.join(','),
                order: 'market_cap_desc',
                per_page: 250,
                page: 1,
                sparkline: false,
            }
        });
        console.log('Successfully fetched trending coins.');
        return marketDataResponse.data;
    } catch (error) {
        console.error('Error fetching trending coins from CoinGecko:', error.message);
        return null;
    }
}

// --- Reporting Functions ---

async function reportMarketSummary(summaryData) {
    if (!summaryData) {
        console.log('Skipping market summary report due to no data.');
        return;
    }

    const payload = {
        total_market_cap: Number(summaryData.total_market_cap.usd).toFixed(2),
        total_volume_24h: Number(summaryData.total_volume.usd).toFixed(2),
        btc_dominance: Number(summaryData.market_cap_percentage.btc).toFixed(2),
        eth_dominance: Number(summaryData.market_cap_percentage.eth).toFixed(2),
        market_cap_change_24h: Number(summaryData.market_cap_change_percentage_24h_usd || 0).toFixed(2),
    };

    try {
        console.log('Sending market summary to Django:', JSON.stringify(payload, null, 2));
        await djangoApi.post('/report/market-summary/', payload);
        console.log('Successfully sent market summary.');
    } catch (error) {
        console.error('Error sending market summary:', JSON.stringify(error.response?.data, null, 2) || error.message);
    }
}

async function reportTrendingCoins(coinsData) {
    if (!coinsData || coinsData.length === 0) {
        console.log('Skipping trending coins report due to no data.');
        return;
    }

    const payload = coinsData.map(coin => ({
        coingecko_id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        price: Number(coin.current_price).toFixed(8),
        market_cap: coin.market_cap || 0,
        volume_24h: Math.round(coin.total_volume),
        price_change_24h: coin.price_change_percentage_24h || 0,
        image_url: coin.image,
    }));

    try {
        console.log(`Sending ${payload.length} trending coins to Django...`);
        await djangoApi.post('/report/trending-coins/', payload);
        console.log('Successfully sent trending coins.');
    } catch (error) {
        console.error('Error sending trending coins:', JSON.stringify(error.response?.data, null, 2) || error.message);
    }
}

// --- Main Execution Logic ---

async function main() {
    console.log('Bot started. First run will be immediate.');
    console.log(`Data will be fetched every ${FETCH_INTERVAL_MS / 1000 / 60} minutes.\n`);

    const runCycle = async () => {
        console.log(`--- Starting new cycle at ${new Date().toISOString()} ---`);
        const marketData = await fetchGlobalMarketData();
        const trendingCoins = await fetchTrendingCoins();

        if (marketData) {
            await reportMarketSummary(marketData);
        }

        if (trendingCoins) {
            await reportTrendingCoins(trendingCoins);
        }
    };

    await runCycle();
    setInterval(runCycle, FETCH_INTERVAL_MS);
}

main().catch(error => {
    console.error("An unexpected error occurred in the main execution block:", error);
}); 