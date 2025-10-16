const mongoose = require('mongoose');
const { analyzeCoin } = require('./utils/score');
require('dotenv').config();

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartmoney';

async function testAnalysis() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get aggregated data
    const AggregatedData = require('./models/AggregatedCoinData');
    const coins = await AggregatedData.find().sort({ total_volume_usd: -1 }).limit(10);
    
    console.log(`\nAnalyzing top ${coins.length} coins by volume:\n`);

    // Default config with updated values
    const config = {
      extreme_funding_threshold: 0.01,
      min_liquidations_usd: 2000000,
      liquidation_bias_ratio: 2.5,
      min_open_interest_usd: 10000000,
      volume_dominance_threshold: 0.6,
      tp_ratio: 2.5,
      sl_ratio: 1.2,
      entry_deviation_percent: 0.8
    };

    // Analyze each coin
    for (const coin of coins) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${coin.symbol} - $${coin.price}`);
      console.log(`${'='.repeat(60)}`);
      
      console.log(`📊 Metrics:`);
      console.log(`  - Volume: $${(coin.total_volume_usd / 1e6).toFixed(2)}M`);
      console.log(`  - OI: $${(coin.avg_open_interest_usd / 1e6).toFixed(2)}M`);
      console.log(`  - Long Liq: $${(coin.sum_long_liquidations_usd / 1e6).toFixed(2)}M`);
      console.log(`  - Short Liq: $${(coin.sum_short_liquidations_usd / 1e6).toFixed(2)}M`);
      console.log(`  - Funding: ${coin.avg_funding_rate?.toFixed(4) || 'N/A'}`);
      
      const result = analyzeCoin(coin, config);
      
      console.log(`\n📈 Analysis Result:`);
      console.log(`  - Recommendation: ${result.recommendation.toUpperCase()}`);
      console.log(`  - Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  - Bias: ${result.bias}`);
      
      if (result.entry_zone) {
        console.log(`  - Entry Zone: $${result.entry_zone.from} - $${result.entry_zone.to}`);
        console.log(`  - Stop Loss: $${result.stop_loss}`);
        console.log(`  - Take Profit: $${result.take_profit}`);
      }
      
      console.log(`\n💡 Reasoning:`);
      result.reasoning.forEach(reason => {
        console.log(`  ${reason}`);
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('Analysis complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testAnalysis(); 