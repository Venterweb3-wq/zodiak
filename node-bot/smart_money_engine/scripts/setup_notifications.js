#!/usr/bin/env node

require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const NotificationService = require('../services/notification_service');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupNotifications() {
  console.log('🔧 Настройка уведомлений для Smart Money Engine\n');
  
  const config = {};
  
  // Telegram setup
  console.log('📱 Настройка Telegram:');
  const setupTelegram = await question('Настроить Telegram уведомления? (y/n): ');
  
  if (setupTelegram.toLowerCase() === 'y') {
    config.TELEGRAM_BOT_TOKEN = await question('Введите токен Telegram бота: ');
    config.TELEGRAM_CHAT_ID = await question('Введите Chat ID для уведомлений: ');
    
    console.log('\n💡 Подсказка: Чтобы получить Chat ID:');
    console.log('1. Отправьте сообщение вашему боту');
    console.log('2. Откройте https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates');
    console.log('3. Найдите "chat":{"id":YOUR_CHAT_ID}\n');
  }
  
  // Discord setup
  console.log('💬 Настройка Discord:');
  const setupDiscord = await question('Настроить Discord уведомления? (y/n): ');
  
  if (setupDiscord.toLowerCase() === 'y') {
    config.DISCORD_WEBHOOK_URL = await question('Введите Discord Webhook URL: ');
    
    console.log('\n💡 Подсказка: Чтобы создать webhook:');
    console.log('1. Откройте настройки канала Discord');
    console.log('2. Перейдите в "Интеграции" -> "Вебхуки"');
    console.log('3. Создайте новый вебхук и скопируйте URL\n');
  }
  
  // Save to .env file
  const envPath = path.join(__dirname, '../../.env');
  let envContent = '';
  
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (e) {
    console.log('📝 Создаем новый .env файл...');
  }
  
  // Update or add new variables
  Object.entries(config).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  console.log('\n✅ Настройки сохранены в .env файл');
  
  // Test notifications
  const testNotifications = await question('\n🧪 Отправить тестовое уведомление? (y/n): ');
  
  if (testNotifications.toLowerCase() === 'y') {
    console.log('\n📤 Отправка тестовых уведомлений...');
    
    const notificationService = new NotificationService(config);
    await notificationService.testNotification();
    
    // Test signal notification
    const testSignal = {
      symbol: 'BTC',
      type: 'buy',
      entryPrice: 106000,
      entryZone: { from: 105500, to: 106500 },
      stopLoss: 104000,
      takeProfit: 109000,
      confidence: 0.85,
      reasoning: [
        '💥 Перевес лонг-ликвидаций ($100M vs $20M)',
        '📊 Высокий OI ($600M) — институциональный интерес'
      ],
      marketConditions: {
        funding_rate: -0.005,
        long_liquidations: 100000000,
        short_liquidations: 20000000,
        open_interest: 600000000
      }
    };
    
    await notificationService.handleSignalEvent('created', testSignal);
  }
  
  console.log('\n✅ Настройка завершена!');
  console.log('Уведомления будут отправляться при создании новых сигналов.');
  
  rl.close();
}

// Run setup
setupNotifications().catch(console.error); 