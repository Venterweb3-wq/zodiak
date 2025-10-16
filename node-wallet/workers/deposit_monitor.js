const axios = require('axios'); // Для HTTP запросов
const delay = require('delay'); // Для безопасного управления задержками и циклами
const tronService = require('../services/tron');
const evmService = require('../services/evmService');
const payoutEngine = require('../services/payout_engine');
const { decrypt } = require('../utils/crypto');

// --- Configuration (из .env) ---
// DJANGO_API_BASE_URL должен указывать на корень вашего Django API, например, 'http://localhost:8000'
// Пути к эндпоинтам будут строиться относительно него.
const DJANGO_API_BASE_URL = process.env.DJANGO_API_BASE_URL || 'http://localhost:8000';
const NODE_WORKER_API_TOKEN = process.env.NODE_WORKER_API_TOKEN || '';
const MONITOR_INTERVAL_MS = parseInt(process.env.DEPOSIT_MONITOR_INTERVAL_MS, 10) || 30000;
const MIN_USDT_DEPOSIT_TO_PROCESS = parseFloat(process.env.MIN_USDT_DEPOSIT_TO_PROCESS) || 0.01;

let keepMonitorRunning = true; // Флаг для управления циклом мониторинга

if (!DJANGO_API_BASE_URL || !NODE_WORKER_API_TOKEN) {
  console.error('CRITICAL: Missing one or more Django API configuration variables. Deposit monitor cannot start.');
  process.exit(1);
}

const djangoApi = axios.create({
  baseURL: DJANGO_API_BASE_URL, // Базовый URL для всех запросов
  headers: {
    Authorization: `Bearer ${NODE_WORKER_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

async function fetchActiveStrategies() {
  try {
    console.log('[Monitor] Fetching active strategies from Django...');
    const response = await djangoApi.get('/api/auth/strategies/list/');
    return response.data;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] CRITICAL: Could not fetch strategies from Django: ${errorMsg}`);
    return [];
  }
}

async function fetchPendingDepositWallets(strategy) {
  const url = `${strategy.api_prefix}temp-wallets/pending-deposit/`;
  try {
    console.log(`[Monitor] Fetching pending wallets for ${strategy.strategy_key} from: ${url}`);
    const response = await djangoApi.get(url);
    // Добавляем appType к каждому кошельку для дальнейшей идентификации
    return response.data.map(wallet => ({ ...wallet, appType: strategy.strategy_key, apiPrefix: strategy.api_prefix }));
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] Error fetching pending wallets for ${strategy.strategy_key} from Django (${url}): ${errorMsg}`);
    if (error.response && error.response.status === 401) {
      console.error(`[Monitor] CRITICAL: Unauthorized fetching pending wallets for ${strategy.strategy_key}. Check NODE_WORKER_API_TOKEN.`);
    }
    return [];
  }
}

async function getWalletUsdtBalance(address, network) {
  try {
    let balanceStr;
    if (network === 'TRC20') {
      balanceStr = await tronService.getTRC20USDTBalance(address);
    } else if (network === 'ARBITRUM' || network === 'BEP20') { // ARBITRUM - это Arbitrum One как в Django моделях
      const evmNetwork = network === 'BEP20' ? 'bsc' : network.toLowerCase();
      balanceStr = await evmService.getERC20USDTBalance(address, evmNetwork);
    } else {
      console.warn(`[Monitor] Unsupported network for balance check: ${network} for address ${address}`);
      return 0;
    }
    const balance = parseFloat(balanceStr);
    return Number.isNaN(balance) ? 0 : balance;
  } catch (error) {
    console.error(`[Monitor] Error fetching balance for ${address} (${network}):`, error.message);
    return 0;
  }
}

async function notifyDjangoOfDeposit(walletAddress, network, amount, apiPrefix, txHash = null) {
  const url = `${apiPrefix}temp-wallets/notify-deposit/`;
  try {
    console.log(`[Monitor] Notifying Django of deposit: ${amount} USDT to ${walletAddress} (${network}) via ${url}`);
    const payload = {
      address: walletAddress,
      wallet_address: walletAddress,
      network,
      amount: amount.toString(),
      tx_hash: txHash,
      transaction_id: txHash,
    };
    const response = await djangoApi.post(url, payload);
    console.log(`[Monitor] Django notified for ${walletAddress}. Response:`, response.data.message || response.status);
    return true;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] Error notifying Django for deposit ${walletAddress} (${url}): ${errorMsg}`);
    return false;
  }
}

async function fetchEncryptedKeyFromDjango(walletId, apiPrefix) {
  const url = `${apiPrefix}temp-wallets/${walletId}/encrypted-key/`;
  try {
    console.log(`[Monitor] Fetching encrypted key for wallet ID ${walletId} from Django: ${url}`);
    const response = await djangoApi.get(url);
    if (response.data && response.data.encrypted_private_key) {
      return response.data.encrypted_private_key;
    }
    console.error(`[Monitor] Encrypted key not found in Django response for wallet ${walletId}. Response:`, response.data);
    return null;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] Error fetching encrypted key for wallet ${walletId} from Django (${url}): ${errorMsg}`);
    if (error.response && error.response.status === 404) {
      console.warn(`[Monitor] Wallet ID ${walletId} not found in Django when fetching key, or no key available.`);
    }
    return null;
  }
}

async function notifyDjangoOfSweepStatus(walletAddress, sweepResult, apiPrefix, appType, detectedAmount = null) {
  const url = `${apiPrefix}temp-wallets/notify-sweep/`;

  try {
    console.log(`[Monitor] Notifying Django of sweep status for ${walletAddress}. Success: ${sweepResult.success} via ${url}`);
    
    let payloadStatus;
    // Логика статусов должна быть унифицирована или передаваться из Django.
    // Пока что упростим, предполагая общую логику.
    if (sweepResult.success) {
        payloadStatus = 'sweep_success';
    } else if (sweepResult.error && sweepResult.error.includes('Insufficient native token')) {
        payloadStatus = 'sweep_prep_failed';
    } else {
        payloadStatus = 'sweep_failed';
    }

    const payload = {
      address: walletAddress,
      wallet_address: walletAddress,
      status: payloadStatus,
      network: sweepResult.network,
      sweep_tx_id: sweepResult.txHash || sweepResult.txID || null,
      sweep_tx_hash: sweepResult.txHash || sweepResult.txID || null,
      sweep_preparation_tx_hash: sweepResult.preparationTxHash || null,
      error_message: sweepResult.error || null,
    };

    if (sweepResult.success && detectedAmount) {
      payload.amount_swept = detectedAmount.toString();
      payload.detected_amount = detectedAmount.toString();
    }

    const response = await djangoApi.post(url, payload);
    console.log(`[Monitor] Django notified of sweep status for ${walletAddress}. Response:`, response.data.message || response.status);
    return true;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] Error notifying Django of sweep status for ${walletAddress} (${url}): ${errorMsg}`);
    return false;
  }
}

async function updateWalletStatus(strategyKey, walletId, newStatus) {
  try {
    await djangoApi.post('/api/auth/wallets/update-status/', {
      strategy_key: strategyKey,
      wallet_id: walletId,
      status: newStatus,
    });
    console.log(`[Monitor] Status for wallet ${walletId} (${strategyKey}) updated to ${newStatus}`);
    return true;
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[Monitor] Failed to update status for wallet ${walletId} to ${newStatus}: ${errorMsg}`);
    return false;
  }
}

async function processWallet(wallet) {
  const {
    id: walletId, address, network, status, appType: strategyKey, apiPrefix,
  } = wallet;

  console.log(`[Monitor] Processing wallet ${walletId} for strategy ${strategyKey}, current status: ${status}`);

  try {
    // --- State 1: PENDING_DEPOSIT ---
    if (status === 'pending_deposit') {
      const balance = await getWalletUsdtBalance(address, network);
      if (balance >= MIN_USDT_DEPOSIT_TO_PROCESS) {
        console.log(`[Monitor] Deposit of ${balance} USDT found for wallet ${address}. Notifying Django.`);
        await notifyDjangoOfDeposit(address, network, balance, apiPrefix, null);
      }
      return; // End processing for this wallet in this cycle
    }

    // --- State 2: DEPOSIT_DETECTED / DEPOSIT_RECEIVED ---
    if (status === 'deposit_detected' || status === 'deposit_received') {
      console.log(`[Monitor] Wallet ${walletId} has a detected deposit. Initiating sweep.`);
      // Меняем статус ПЕРЕД началом операции
      const statusUpdated = await updateWalletStatus(strategyKey, walletId, 'sweep_initiated');
      if (!statusUpdated) return; // Не продолжаем, если не удалось обновить статус

      const encryptedKey = await fetchEncryptedKeyFromDjango(walletId, apiPrefix);
      if (!encryptedKey) {
        await updateWalletStatus(strategyKey, walletId, 'error'); // Статус ошибки
        return;
      }
      // ... (дальнейшая логика расшифровки и свипа) ...
      const privateKey = decrypt(encryptedKey);
      const sweepData = { tempWalletAddress: address, tempWalletPrivateKey: privateKey, network };
      const sweepResult = await payoutEngine.handleSweepRequest(sweepData);
      const detectedAmount = parseFloat(wallet.detected_amount) || 0;
      await notifyDjangoOfSweepStatus(address, sweepResult, apiPrefix, strategyKey, detectedAmount);

      return;
    }
    
    // --- State 3: SWEEP_INITIATED ---
    // Если воркер упал после смены статуса, но до завершения свипа.
    // В этом цикле мы ничего не делаем, просто ждем.
    // Более сложная логика могла бы проверять, как долго кошелек "завис" в этом статусе.
    if (status === 'sweep_initiated') {
      console.log(`[Monitor] Wallet ${walletId} is already being swept. Waiting for completion.`);
    }

  } catch (error) {
    console.error(`[Monitor] CRITICAL error processing wallet ${walletId}: ${error.message}`);
    // Помечаем кошелек как ошибочный в Django, чтобы не пытаться обработать его снова
    await updateWalletStatus(strategyKey, walletId, 'error');
  }
}

async function monitorDeposits() {
  console.log(`\n[Monitor] Starting new deposit monitoring cycle at ${new Date().toISOString()}`);
  const activeStrategies = await fetchActiveStrategies();

  if (activeStrategies.length === 0) {
    console.log('[Monitor] No active strategies found. Skipping cycle.');
    return;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const strategy of activeStrategies) {
    if (!strategy.api_prefix) continue;

    // eslint-disable-next-line no-await-in-loop
    const allPendingWallets = await fetchPendingDepositWallets(strategy);
    if (!allPendingWallets || allPendingWallets.length === 0) {
      // console.log(`[Monitor] No pending wallets to process for ${strategy.strategy_key}.`);
      continue;
    }

    console.log(`[Monitor] Found ${allPendingWallets.length} pending wallets for ${strategy.strategy_key}.`);

    // eslint-disable-next-line no-restricted-syntax
    for (const wallet of allPendingWallets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await processWallet(wallet);
        // eslint-disable-next-line no-await-in-loop
        await delay(500);
      } catch (e) {
        console.error(`[Monitor] Unhandled error in wallet processing loop for ${wallet.id}:`, e);
      }
    }
  }
}

async function main() {
  console.log('[Deposit Monitor] Service starting...');
  // Проверка зависимостей
  if (typeof tronService.getTRC20USDTBalance !== 'function') {
    console.error('CRITICAL: tronService.getTRC20USDTBalance is not a function.'); process.exit(1);
  }
  if (typeof evmService.getERC20USDTBalance !== 'function') {
    console.error('CRITICAL: evmService.getERC20USDTBalance is not a function.'); process.exit(1);
  }
  if (typeof payoutEngine.handleSweepRequest !== 'function') {
    console.error('CRITICAL: payoutEngine.handleSweepRequest is not a function.'); process.exit(1);
  }
  if (typeof decrypt !== 'function') { // Проверяем crypto.decrypt
    console.error('CRITICAL: decrypt function from crypto.js is not available.'); process.exit(1);
  }

  // Заменяем chimiques.Loop на кастомный цикл с delay
  async function runMonitorLoop() {
    while (keepMonitorRunning) {
      try {
        await monitorDeposits();
      } catch (loopError) {
        console.error('[Deposit Monitor] Error in monitorDeposits execution:', loopError);
      }
      if (keepMonitorRunning) {
        await delay(MONITOR_INTERVAL_MS);
      }
    }
    console.log('[Deposit Monitor] Monitor loop stopped.');
  }

  console.log(`[Deposit Monitor] Initializing with Django API Base URL: ${DJANGO_API_BASE_URL}`);
  runMonitorLoop().catch((err) => {
    console.error('[Deposit Monitor] Unhandled error in monitor loop:', err);
  });

  console.log(
    `[Deposit Monitor] Service started. Monitoring interval: ${MONITOR_INTERVAL_MS / 1000} seconds.`,
  );

  const shutdown = () => {
    console.log('[Deposit Monitor] Shutting down...');
    keepMonitorRunning = false;
    // Даем текущему циклу шанс завершиться, если он в середине + небольшой запас
    setTimeout(() => {
      console.log('[Deposit Monitor] Exited gracefully.');
      process.exit(0);
    }, MONITOR_INTERVAL_MS + 5000); 
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[Deposit Monitor] Failed to start:', err);
  process.exit(1);
});
