const axios = require('axios');
const EventEmitter = require('events');
const logger = require('../utils/logger');

class NotificationService extends EventEmitter {
  constructor(config = {}) {
    super();
    this.telegramBotToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID;
    this.discordWebhookUrl = config.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;
    this.enabled = config.enabled !== false;
  }

  /**
   * Format signal for notification
   * @param {Object} signal - Signal object
   * @param {string} event - Event type
   */
  formatSignalMessage(signal, event) {
    let title = '';
    let emoji = '';
    
    switch (event) {
      case 'created':
        emoji = signal.type === 'buy' ? '🟢' : '🔴';
        title = `${emoji} Новый сигнал: ${signal.type.toUpperCase()} ${signal.symbol}`;
        break;
      case 'activated':
        emoji = '✅';
        title = `${emoji} Сигнал активирован: ${signal.symbol}`;
        break;
      case 'closed':
        emoji = signal.status === 'hit_tp' ? '🎯' : '❌';
        title = `${emoji} Сигнал закрыт: ${signal.symbol}`;
        break;
      case 'expired':
        emoji = '⏰';
        title = `${emoji} Сигнал истёк: ${signal.symbol}`;
        break;
      default:
        return null;
    }

    let message = `${title}\n\n`;
    
    if (event === 'created') {
      message += `💰 Цена входа: $${signal.entryPrice}\n`;
      message += `📊 Зона входа: $${signal.entryZone.from} - $${signal.entryZone.to}\n`;
      message += `🎯 Take Profit: $${signal.takeProfit}\n`;
      message += `🛑 Stop Loss: $${signal.stopLoss}\n`;
      message += `📈 Уверенность: ${(signal.confidence * 100).toFixed(0)}%\n\n`;
      
      message += `💡 Обоснование:\n`;
      signal.reasoning.forEach(reason => {
        message += `${reason}\n`;
      });
      
      message += `\n📊 Рыночные условия:\n`;
      message += `• Funding Rate: ${signal.marketConditions.funding_rate.toFixed(4)}\n`;
      message += `• Long Liqs: $${(signal.marketConditions.long_liquidations / 1e6).toFixed(2)}M\n`;
      message += `• Short Liqs: $${(signal.marketConditions.short_liquidations / 1e6).toFixed(2)}M\n`;
      message += `• Open Interest: $${(signal.marketConditions.open_interest / 1e6).toFixed(2)}M`;
    }
    
    if (event === 'closed' && signal.result) {
      message += `💵 PnL: ${signal.result.pnlPercent > 0 ? '+' : ''}${signal.result.pnlPercent.toFixed(2)}%\n`;
      message += `📊 Цена выхода: $${signal.result.actualExitPrice}\n`;
      message += `⏱️ Длительность: ${this.formatDuration(signal.activatedAt, signal.closedAt)}`;
    }
    
    return message;
  }

  /**
   * Format duration between two dates
   * @param {Date} start - Start date
   * @param {Date} end - End date
   */
  formatDuration(start, end) {
    if (!start || !end) return 'N/A';
    
    const duration = end - start;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  }

  /**
   * Send notification via Telegram
   * @param {string} message - Message to send
   */
  async sendTelegramNotification(message) {
    if (!this.telegramBotToken || !this.telegramChatId) {
      logger.info('[Notification] Telegram not configured, skipping');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await axios.post(url, {
        chat_id: this.telegramChatId,
        text: message,
        disable_web_page_preview: true
      });
      
      logger.info('[Notification] Telegram message sent successfully');
      return true;
    } catch (error) {
      logger.error('[Notification] Failed to send Telegram message:', error.message);
      this.emit('error', { service: 'telegram', error: error.message });
      return false;
    }
  }

  /**
   * Send notification via Discord
   * @param {string} message - Message to send
   * @param {string} color - Embed color (optional)
   */
  async sendDiscordNotification(message, color = null) {
    if (!this.discordWebhookUrl) {
      logger.info('[Notification] Discord not configured, skipping');
      return false;
    }

    try {
      // Convert message to Discord embed format
      const lines = message.split('\n');
      const title = lines[0];
      const description = lines.slice(2).join('\n');
      
      const embed = {
        title: title,
        description: description,
        color: color || this.getColorForMessage(message),
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(this.discordWebhookUrl, {
        embeds: [embed]
      });
      
      logger.info('[Notification] Discord message sent successfully');
      return true;
    } catch (error) {
      logger.error('[Notification] Failed to send Discord message:', error.message);
      this.emit('error', { service: 'discord', error: error.message });
      return false;
    }
  }

  /**
   * Get color for Discord embed based on message content
   * @param {string} message - Message content
   */
  getColorForMessage(message) {
    if (message.includes('🟢') || message.includes('BUY')) return 0x00ff00; // Green
    if (message.includes('🔴') || message.includes('SELL')) return 0xff0000; // Red
    if (message.includes('🎯')) return 0x00ff00; // Green for TP hit
    if (message.includes('❌')) return 0xff0000; // Red for SL hit
    if (message.includes('⏰')) return 0xffff00; // Yellow for expired
    return 0x0099ff; // Default blue
  }

  /**
   * Send notification to all configured services
   * @param {string} message - Message to send
   */
  async sendNotification(message) {
    if (!this.enabled) {
      logger.info('[Notification] Service is disabled');
      return;
    }

    const results = await Promise.allSettled([
      this.sendTelegramNotification(message),
      this.sendDiscordNotification(message)
    ]);
    
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value).length;
    logger.info(`[Notification] Sent to ${succeeded} service(s)`);
    
    this.emit('sent', { message, services: succeeded });
  }

  /**
   * Handle signal events
   * @param {string} event - Event type
   * @param {Object} signal - Signal object
   */
  async handleSignalEvent(event, signal) {
    const message = this.formatSignalMessage(signal, event);
    if (message) {
      await this.sendNotification(message);
    }
  }

  /**
   * Send market summary notification
   * @param {Object} summary - Market summary data
   */
  async sendMarketSummary(summary) {
    let message = `📊 Ежедневная сводка рынка\n\n`;
    
    message += `📈 Топ лонг сигналы:\n`;
    summary.topLongs.forEach(coin => {
      message += `• ${coin.symbol}: +${coin.confidence}% уверенность\n`;
    });
    
    message += `\n📉 Топ шорт сигналы:\n`;
    summary.topShorts.forEach(coin => {
      message += `• ${coin.symbol}: +${coin.confidence}% уверенность\n`;
    });
    
    message += `\n💥 Топ ликвидации:\n`;
    summary.topLiquidations.forEach(coin => {
      message += `• ${coin.symbol}: $${(coin.totalLiquidations / 1e6).toFixed(2)}M\n`;
    });
    
    message += `\n📊 Статистика за день:\n`;
    message += `• Всего сигналов: ${summary.totalSignals}\n`;
    message += `• Win Rate: ${summary.winRate}%\n`;
    message += `• Средний PnL: ${summary.avgPnL > 0 ? '+' : ''}${summary.avgPnL}%`;
    
    await this.sendNotification(message);
  }

  /**
   * Test notification service
   */
  async testNotification() {
    const testMessage = `🧪 Тестовое сообщение\n\nЕсли вы видите это сообщение, значит уведомления настроены правильно! 🎉`;
    await this.sendNotification(testMessage);
  }
}

module.exports = NotificationService; 