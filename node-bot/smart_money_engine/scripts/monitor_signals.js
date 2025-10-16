#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const SignalTracker = require('../services/signal_tracker');
const BybitAPI = require('../../market_data_collector/bybit_api');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartmoney';

class SignalMonitor {
  constructor() {
    this.signalTracker = new SignalTracker();
    this.bybit = new BybitAPI();
    this.prices = new Map();
    this.updateInterval = null;
  }

  async start() {
    console.log('🚀 Starting Signal Monitor...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load active signals
    await this.displayActiveSignals();
    
    // Start price updates
    this.startPriceUpdates();
    
    // Start monitoring
    const priceGetter = async (symbol) => {
      return this.prices.get(symbol);
    };
    
    this.signalTracker.startMonitoring(priceGetter, 30000); // Check every 30 seconds
    
    console.log('\n📊 Monitoring active signals...');
    console.log('Press Ctrl+C to stop\n');
  }

  setupEventListeners() {
    this.signalTracker.on('signal:activated', (signal) => {
      console.log(`\n✅ ACTIVATED: ${signal.symbol} ${signal.type.toUpperCase()} @ $${signal.entryPrice}`);
      console.log(`   Target: $${signal.takeProfit} | Stop: $${signal.stopLoss}`);
    });
    
    this.signalTracker.on('signal:closed', (signal) => {
      const emoji = signal.status === 'hit_tp' ? '🎯' : '❌';
      const pnl = signal.result?.pnlPercent || 0;
      const pnlStr = pnl > 0 ? `+${pnl.toFixed(2)}%` : `${pnl.toFixed(2)}%`;
      
      console.log(`\n${emoji} CLOSED: ${signal.symbol} ${signal.status.toUpperCase()}`);
      console.log(`   PnL: ${pnlStr} | Exit: $${signal.result?.actualExitPrice}`);
    });
    
    this.signalTracker.on('signal:expired', (signal) => {
      console.log(`\n⏰ EXPIRED: ${signal.symbol} - Signal not triggered within time limit`);
    });
  }

  async displayActiveSignals() {
    const signals = await this.signalTracker.getActiveSignals();
    
    if (signals.length === 0) {
      console.log('📭 No active signals at the moment');
      return;
    }
    
    console.log(`\n📊 Active Signals (${signals.length}):\n`);
    console.log('Symbol  | Type | Status  | Entry Zone      | TP       | SL       | Age');
    console.log('--------|------|---------|-----------------|----------|----------|-------');
    
    signals.forEach(signal => {
      const age = this.formatAge(signal.createdAt);
      const status = signal.status === 'active' ? '✅ Active' : '⏳ Pending';
      const type = signal.type.toUpperCase().padEnd(4);
      
      console.log(
        `${signal.symbol.padEnd(7)} | ${type} | ${status} | ` +
        `$${signal.entryZone.from}-${signal.entryZone.to} | ` +
        `$${signal.takeProfit.toFixed(2).padEnd(8)} | ` +
        `$${signal.stopLoss.toFixed(2).padEnd(8)} | ${age}`
      );
    });
  }

  formatAge(createdAt) {
    const age = Date.now() - new Date(createdAt).getTime();
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  async startPriceUpdates() {
    const updatePrices = async () => {
      const signals = await this.signalTracker.getActiveSignals();
      const symbols = [...new Set(signals.map(s => s.symbol))];
      
      for (const symbol of symbols) {
        try {
          const ticker = await this.bybit.getTicker(`${symbol}USDT`);
          if (ticker.result && ticker.result.list && ticker.result.list[0]) {
            const price = parseFloat(ticker.result.list[0].lastPrice);
            this.prices.set(symbol, price);
            
            // Display price updates for active signals
            const activeSignal = signals.find(s => s.symbol === symbol && s.status === 'active');
            if (activeSignal) {
              const distance = activeSignal.type === 'buy' 
                ? ((activeSignal.takeProfit - price) / price * 100)
                : ((price - activeSignal.takeProfit) / price * 100);
              
              console.log(
                `💹 ${symbol}: $${price.toFixed(2)} ` +
                `(${distance > 0 ? '+' : ''}${distance.toFixed(2)}% to TP)`
              );
            }
          }
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error.message);
        }
      }
    };
    
    // Initial update
    await updatePrices();
    
    // Update every 10 seconds
    this.updateInterval = setInterval(updatePrices, 10000);
  }

  async showStats() {
    console.log('\n📊 Performance Statistics:\n');
    
    const stats7d = await this.signalTracker.getPerformanceStats(7);
    const stats30d = await this.signalTracker.getPerformanceStats(30);
    
    console.log('Last 7 Days:');
    console.log(`  Total Signals: ${stats7d.totalSignals}`);
    console.log(`  Win Rate: ${stats7d.winRate.toFixed(1)}%`);
    console.log(`  Avg Win: ${stats7d.avgWin.toFixed(2)}%`);
    console.log(`  Avg Loss: ${stats7d.avgLoss.toFixed(2)}%`);
    console.log(`  Profit Factor: ${stats7d.profitFactor.toFixed(2)}`);
    console.log(`  Total PnL: ${stats7d.totalPnL > 0 ? '+' : ''}${stats7d.totalPnL.toFixed(2)}%`);
    
    console.log('\nLast 30 Days:');
    console.log(`  Total Signals: ${stats30d.totalSignals}`);
    console.log(`  Win Rate: ${stats30d.winRate.toFixed(1)}%`);
    console.log(`  Avg Win: ${stats30d.avgWin.toFixed(2)}%`);
    console.log(`  Avg Loss: ${stats30d.avgLoss.toFixed(2)}%`);
    console.log(`  Profit Factor: ${stats30d.profitFactor.toFixed(2)}`);
    console.log(`  Total PnL: ${stats30d.totalPnL > 0 ? '+' : ''}${stats30d.totalPnL.toFixed(2)}%`);
  }

  async stop() {
    console.log('\n⏹️ Stopping monitor...');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    this.signalTracker.stopMonitoring();
    await mongoose.disconnect();
    
    console.log('✅ Monitor stopped');
    process.exit(0);
  }
}

// Main execution
const monitor = new SignalMonitor();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await monitor.showStats();
  await monitor.stop();
});

// Start monitoring
monitor.start().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
}); 