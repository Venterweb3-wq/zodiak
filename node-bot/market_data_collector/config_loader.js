const axios = require('axios');

const { DJANGO_CONFIG_API_BASE, DJANGO_API_TOKEN } = process.env;

/**
 * Loads the market collector configuration from the Django API.
 * If the API is not configured or the request fails, the process will exit.
 * @returns {Promise<Object>} The configuration object.
 */
async function loadCollectorConfig() {
    if (!DJANGO_CONFIG_API_BASE || !DJANGO_API_TOKEN) {
        console.error('[ConfigLoader] DJANGO_CONFIG_API_BASE and DJANGO_API_TOKEN must be set in .env file.');
        process.exit(1);
    }

    const apiUrl = `${DJANGO_CONFIG_API_BASE}/api/smc/cmc-filters/active/`;
    console.log(`[ConfigLoader] Fetching config from Django API: ${apiUrl}`);

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Token ${DJANGO_API_TOKEN}`
            }
        });

        if (response.data && response.status === 200) {
            console.log('[ConfigLoader] Collector configuration loaded successfully from Django API.');
            // The API returns the filter object directly
            return response.data;
        } else {
             console.error(`[ConfigLoader] Failed to load config. API responded with status: ${response.status}`);
             process.exit(1);
        }
    } catch (error) {
        console.error('[ConfigLoader] Error loading config from Django API.');
        if (error.response) {
            console.error(`[ConfigLoader] API responded with status ${error.response.status}:`, error.response.data);
        } else {
            console.error('[ConfigLoader] Error details:', error.message);
        }
        process.exit(1);
    }
}

module.exports = { loadCollectorConfig }; 