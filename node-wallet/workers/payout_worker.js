const { createClient } = require('redis');
const axios = require('axios'); // Используем axios для единообразия
const payoutEngine = require('../services/payout_engine'); // Добавляем payoutEngine

// --- Configuration ---
const REDIS_URL = `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
const DJANGO_API_BASE = process.env.DJANGO_API_BASE_URL || 'http://localhost:8000';
const AUTH_TOKEN = process.env.NODE_WORKER_API_TOKEN || '';

let strategyMap = {}; // Кэш для хранения данных о стратегиях

const djangoApi = axios.create({
  baseURL: DJANGO_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
  },
});

// --- Redis Client Setup ---
const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.error('[PayoutWorker] Redis Client Error:', err));
redisClient.on('connect', () => console.log('[PayoutWorker] Connected to Redis'));
redisClient.on('reconnecting', () => console.log('[PayoutWorker] Reconnecting to Redis...'));

async function fetchActiveStrategies() {
  try {
    console.log('[PayoutWorker] Fetching active strategies from Django...');
    const response = await djangoApi.get('/api/auth/strategies/list/');
    const strategies = response.data;

    // Build a map for easy lookup by strategy_key using a pure function approach
    strategyMap = strategies.reduce((acc, strategy) => ({
      ...acc,
      [strategy.strategy_key]: strategy,
    }), {});

    const channels = strategies
      .map((strategy) => strategy.redis_channel)
      .filter((channel) => channel);
    return channels;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[PayoutWorker] CRITICAL: Could not fetch strategies from Django: ${errorMsg}`);
    return [];
  }
}

// --- Main Logic ---
async function processDailyPayout(messageData) {
  const {
    payout_id: payoutId,
    user_id: userId,
    target_wallet: toAddress, // Django отправляет target_wallet, используем как toAddress
    amount,
    network, // Ожидаем network от Django для ежедневных выплат тоже
    payout_app: strategyKey,
  } = messageData;

  if (!payoutId || !strategyKey) {
    console.error('[PayoutWorker] Received daily_payout message without payout_id or payout_app:', messageData);
    return;
  }

  const strategy = strategyMap[strategyKey];
  if (!strategy || !strategy.api_prefix) {
    console.error(`[PayoutWorker] Unknown or misconfigured strategy '${strategyKey}' for Daily Payout #${payoutId}.`);
    return;
  }

  // --- Проверка идемпотентности ---
  try {
    const response = await djangoApi.get(`${strategy.api_prefix}payouts/${payoutId}/status/`);
    if (response.data.success === true) {
      console.log(`[PayoutWorker] Daily Payout #${payoutId} уже обработан (success=true). Пропускаем.`);
      return;
    }
  } catch (e) {
    console.error(`[PayoutWorker] Не удалось проверить статус Daily Payout #${payoutId}. Ошибка: ${e.message}. Обработка будет продолжена.`);
  }
  // --- Конец проверки ---

  const recipientAddress = toAddress || 'N/A';
  const payoutNetwork = network || 'unknown'; // Используем network из сообщения

  console.log(
    `[PayoutWorker] 💸 Processing Daily Payout #${payoutId} for user ${userId}`,
    `→ ${recipientAddress} (${amount}) on network: ${payoutNetwork}`,
  );

  if (payoutNetwork === 'unknown' || !recipientAddress || recipientAddress === 'N/A') {
    console.error(`[PayoutWorker] Invalid data for Daily Payout #${payoutId}: network or recipientAddress missing.`);
    // Отправляем ошибку в Django
    const errorPatchUrl = `${strategy.api_prefix}payouts/${payoutId}/update/`;
    const errorPatchBody = { success: false, error_message: 'Invalid payout data: network or recipient missing' };
    try {
      await djangoApi.patch(errorPatchUrl, errorPatchBody);
      console.log(`[PayoutWorker] Notified Django about error for Daily Payout #${payoutId}`);
    } catch (e) { console.error(`[PayoutWorker] Failed to notify Django about error for Payout #${payoutId}:`, e); }
    return;
  }

  // Вызов payoutEngine для реальной транзакции
  const payoutResult = await payoutEngine.handlePayoutRequest({
    recipientAddress,
    amount: amount.toString(), // Убедимся, что amount это строка
    network: payoutNetwork,
    payoutId,
    payoutType: messageData.type,
  });

  const patchUrl = `${strategy.api_prefix}payouts/${payoutId}/update/`;
  const patchBody = {
    tx_hash: payoutResult.txHash || payoutResult.txID || null,
    success: payoutResult.success,
    error_message: payoutResult.error || null,
  };

  console.log(`[PayoutWorker] Sending PATCH to ${patchUrl} for payout:`, JSON.stringify(patchBody));

  try {
    const response = await djangoApi.patch(patchUrl, patchBody);

    if (response.status >= 300) { // Проверяем статус ответа axios
      console.error(
        `[PayoutWorker] ❌ PATCH error for payout [${response.status}] for #${payoutId}:`,
        response.data,
      );
      return;
    }
    const responseData = await response.data;
    console.log(`[PayoutWorker] ✅ Daily Payout #${payoutId} updated:`, responseData);
  } catch (err) {
    console.error(`[PayoutWorker] ❌ Network error for Daily Payout #${payoutId}:`, err.message);
  }
}

async function processWithdrawalRequest(messageData) {
  const {
    request_id: requestId,
    user_id: userId,
    target_wallet: targetWallet,
    amount,
    network, // network уже должен быть здесь
    payout_app: strategyKey,
  } = messageData;

  if (!requestId || !strategyKey) {
    console.error('[PayoutWorker] Received withdrawal message without request_id or payout_app:', messageData);
    return;
  }

  const strategy = strategyMap[strategyKey];
  if (!strategy || !strategy.api_prefix) {
    console.error(`[PayoutWorker] Unknown or misconfigured strategy '${strategyKey}' for Withdrawal #${requestId}.`);
    return;
  }

  // --- Проверка идемпотентности ---
  try {
    const response = await djangoApi.get(`${strategy.api_prefix}withdrawals/${requestId}/status/`);
    if (response.data.status !== 'pending') {
      console.log(`[PayoutWorker] Withdrawal #${requestId} уже в обработке (статус: ${response.data.status}). Пропускаем.`);
      return;
    }
  } catch (e) {
    console.error(`[PayoutWorker] Не удалось проверить статус Withdrawal #${requestId}. Ошибка: ${e.message}. Обработка будет продолжена.`);
  }
  // --- Конец проверки ---

  const networkInfo = network || 'unknown'; // Уже есть
  console.log(
    `[PayoutWorker] 💳 Processing Withdrawal #${requestId} for user ${userId}`,
    `to ${targetWallet} (${amount}) [Network: ${networkInfo}]`,
  );

  if (networkInfo === 'unknown' || !targetWallet) {
    console.error(`[PayoutWorker] Invalid data for Withdrawal #${requestId}: network or targetWallet missing.`);
    const errorPatchUrl = `${strategy.api_prefix}withdrawals/${requestId}/update_status/`;
    const errorPatchBody = { status: 'failed', error_message: 'Invalid withdrawal data: network or target missing' };
    try {
      await djangoApi.patch(errorPatchUrl, errorPatchBody);
      console.log(`[PayoutWorker] Notified Django about error for Withdrawal #${requestId}`);
    } catch (e) { console.error(`[PayoutWorker] Failed to notify Django about error for Withdrawal #${requestId}:`, e); }
    return;
  }

  // Вызов payoutEngine для реальной транзакции
  const withdrawalResult = await payoutEngine.handlePayoutRequest({
    recipientAddress: targetWallet,
    amount: amount.toString(), // Убедимся, что amount это строка
    network: networkInfo,
    payoutId: requestId,
    payoutType: messageData.type,
  });

  const patchUrl = `${strategy.api_prefix}withdrawals/${requestId}/update_status/`;
  const patchBody = {
    tx_hash: withdrawalResult.txHash || withdrawalResult.txID || null,
    status: withdrawalResult.success ? 'success' : 'failed',
    error_message: withdrawalResult.error || null,
  };

  console.log(
    `[PayoutWorker] Sending PATCH to ${patchUrl} for withdrawal request:`,
    JSON.stringify(patchBody),
  );

  try {
    const response = await djangoApi.patch(patchUrl, patchBody);

    if (response.status >= 300) {
      console.error(
        `[PayoutWorker] ❌ PATCH error for withdrawal [${response.status}] for #${requestId}:`,
        response.data,
      );
      return;
    }
    const responseData = await response.data;
    console.log(`[PayoutWorker] ✅ Withdrawal Request #${requestId} updated:`, responseData);
  } catch (err) {
    console.error(
      `[PayoutWorker] ❌ Network error for Withdrawal Request #${requestId}:`,
      err.message,
    );
  }
}

async function handleMessage(message, channel) {
  try {
    const data = JSON.parse(message);
    console.log(`[PayoutWorker] Msg from '${channel}':`, data);

    // Логика маршрутизации теперь может быть более общей, если понадобится
    if (data.type && data.type.startsWith('daily_payout')) {
      await processDailyPayout(data);
    } else if (data.type && data.type.startsWith('withdraw')) { // withdraw_full_balance_cross_arbitrage, withdraw_flexible_...
      await processWithdrawalRequest(data);
    } else {
      const typeInfo = data.type ? data.type : 'unknown_type';
      console.log(`[PayoutWorker] Skip msg from channel ${channel}, type ${typeInfo}`);
    }
  } catch (err) {
    console.error('[PayoutWorker] ❌ Error processing message:', message, 'Error:', err);
  }
}

async function startWorker() {
  try {
    await redisClient.connect();

    const channelsToSubscribe = await fetchActiveStrategies();

    if (channelsToSubscribe.length === 0) {
      console.error('[PayoutWorker] No Redis channels to subscribe to. Worker will not process any messages. Please check Django InvestmentStrategy config.');
      return;
    }

    console.log(`[PayoutWorker] 📡 Subscribing to Redis channels: ${channelsToSubscribe.join(', ')}`);
    // redis.subscribe может принимать массив каналов
    await redisClient.subscribe(channelsToSubscribe, handleMessage);
  } catch (err) {
    console.error('[PayoutWorker] Failed to connect to Redis or subscribe:', err);
    process.exit(1);
  }
}

startWorker();

process.on('SIGINT', async () => {
  console.log('[PayoutWorker] SIGINT received, unsubscribing and disconnecting Redis...');
  if (redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('[PayoutWorker] Redis client disconnected.');
    } catch (err) {
      console.error('[PayoutWorker] Error during Redis disconnection:', err);
    }
  }
  process.exit(0);
});
