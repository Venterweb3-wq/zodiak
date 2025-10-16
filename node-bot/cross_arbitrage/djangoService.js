import axios from 'axios';
import 'dotenv/config';

const { DJANGO_API_URL, BOT_WORKER_TOKEN, BOT_NAME } = process.env;

if (!DJANGO_API_URL || !BOT_WORKER_TOKEN || !BOT_NAME) {
    throw new Error("Missing required environment variables: DJANGO_API_URL, BOT_WORKER_TOKEN, BOT_NAME");
}

const djangoApiClient = axios.create({
    baseURL: DJANGO_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Bot-Token': BOT_WORKER_TOKEN
    }
});

/**
 * Fetches the bot's configuration from the Django backend.
 * @returns {Promise<object>} A promise that resolves to the bot settings object.
 */
export async function getBotSettings() {
    try {
        const response = await djangoApiClient.get(`/api/internal/bot-gateway/settings/${BOT_NAME}/`);
        console.log('Successfully fetched settings from Django.');
        return response.data;
    } catch (error) {
        console.error('Error fetching settings from Django:', error.response?.data || error.message);
        throw new Error('Could not fetch settings from Django. Bot cannot start.');
    }
}

/**
 * Reports a simulated trade to the Django backend.
 * @param {object} tradeData - The details of the trade.
 * @returns {Promise<void>}
 */
export async function reportTrade(tradeData) {
    try {
        const payload = { ...tradeData, bot_name: BOT_NAME };
        await djangoApiClient.post('/api/internal/bot-gateway/report/trade/', payload);
        console.log(`Successfully reported trade: ${tradeData.side} ${tradeData.quantity} ${tradeData.coin_name} on ${tradeData.exchange}`);
    } catch (error) {
        console.error('Error reporting trade to Django:', error.response?.data || error.message);
        // In a real scenario, you might want to add this to a retry queue.
    }
}

/**
 * Reports a simulated rebalance to the Django backend.
 * @param {object} rebalanceData - The details of the rebalance.
 * @returns {Promise<void>}
 */
export async function reportRebalance(rebalanceData) {
    try {
        const payload = { ...rebalanceData, bot_name: BOT_NAME };
        await djangoApiClient.post('/api/internal/bot-gateway/report/rebalance/', payload);
        console.log(`Successfully reported rebalance of ${rebalanceData.quantity} ${rebalanceData.coin_name} from ${rebalanceData.from_exchange} to ${rebalanceData.to_exchange}`);
    } catch (error) {
        console.error('Error reporting rebalance to Django:', error.response?.data || error.message);
    }
} 