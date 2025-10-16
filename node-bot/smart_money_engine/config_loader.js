// This file will handle loading environment variables and other configurations. 

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');

// Default configuration with more conservative values
const defaultConfig = {
  extreme_funding_threshold: 0.01,  // Increased from 0.005 to 1% 
  min_liquidations_usd: 2000000,    // Increased from 1M to 2M for stronger signals
  liquidation_bias_ratio: 2.5,      // Increased from 2.0 for clearer bias
  min_open_interest_usd: 10000000,  // Increased from 5M to 10M
  volume_dominance_threshold: 0.6,  // Increased from 0.5
  tp_ratio: 2.5,                    // Reduced from 3.0 for more achievable targets
  sl_ratio: 1.2,                    // Reduced from 1.5 for tighter stops
  entry_deviation_percent: 0.8      // Reduced from 1.0 for tighter entry zones
};

async function loadConfig() {
  const url = `${process.env.DJANGO_CONFIG_API_BASE}/api/smc/strategy/active/`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Token ${process.env.DJANGO_API_TOKEN}`
      }
    });

    console.log("✅ Конфигурация загружена из Django");
    return response.data;
  } catch (err) {
    console.error("❌ Ошибка загрузки конфигурации из Django:", err.message);
    console.log("🔄 Используется конфигурация по умолчанию");
    return {
      ...defaultConfig,
      run_interval_minutes: 5 // Добавляем интервал по умолчанию
    };
  }
}

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB подключено');
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  }
}

module.exports = {
  loadConfig,
  connectMongo
}; 