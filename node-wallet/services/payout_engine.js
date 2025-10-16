const BigNumber = require('bignumber.js');
const tronService = require('./tron');
const evmService = require('./evmService');

// --- Configuration for Payout Engine (should be from .env or defaults) ---
// MIN_USDT_BALANCE_MAIN_WALLET is used by logic, linter might be mistaken.
const MIN_USDT_BALANCE_MAIN_WALLET = parseFloat(process.env.MIN_USDT_BALANCE_MAIN_WALLET) || 50;
const MIN_TRX_BALANCE_MAIN_WALLET = parseFloat(process.env.MIN_TRX_BALANCE_MAIN_WALLET) || 100;
const MIN_ETH_ARBITRUM = parseFloat(process.env.MIN_ETH_BALANCE_MAIN_WALLET_ARBITRUM) || 0.01;
const MIN_BNB_BSC = parseFloat(process.env.MIN_BNB_BALANCE_MAIN_WALLET_BSC) || 0.02;

/**
 * Checks the main wallet's balance for sufficient funds before making a payout.
 * @param {string} amountToSend - The amount of USDT to be sent.
 * @param {string} networkInput - The network ('trc20', 'arbitrum', 'bep20').
 * @returns {Promise<{sufficient: boolean, message: string}>}
 */
async function checkMainWalletBalance(amountToSend, networkInput) {
  const amount = new BigNumber(amountToSend);
  const currentNetwork = networkInput.toLowerCase();
  let mainWalletAddress;

  try {
    if (currentNetwork === 'trc20') {
      mainWalletAddress = process.env.TRON_MAIN_WALLET_ADDRESS;
      if (!mainWalletAddress) return { sufficient: false, message: 'TRON_MAIN_WALLET_ADDRESS not configured.' };
      const usdtBalance = new BigNumber(await tronService.getTRC20USDTBalance(mainWalletAddress));
      const trxBalance = new BigNumber(await tronService.getTRXBalance(mainWalletAddress));
      if (usdtBalance.isLessThan(amount)) {
        return {
          sufficient: false,
          message: `Insufficient USDT in TRON main. Need: ${amount.toFixed()}, Have: ${usdtBalance.toFixed()}`,
        };
      }
      const remainingUsdtAfterSendTron = usdtBalance.minus(amount);
      if (remainingUsdtAfterSendTron.isLessThan(MIN_USDT_BALANCE_MAIN_WALLET)) {
        return {
          sufficient: false,
          message: `USDT balance after send would be too low in TRON main. Remaining: ${remainingUsdtAfterSendTron.toFixed()}, Min Required: ${MIN_USDT_BALANCE_MAIN_WALLET.toFixed()}`,
        };
      }
      if (trxBalance.isLessThan(MIN_TRX_BALANCE_MAIN_WALLET)) {
        return {
          sufficient: false,
          message: `Low TRX in TRON main. Have: ${trxBalance.toFixed()}, Min: ${MIN_TRX_BALANCE_MAIN_WALLET}`,
        };
      }
    } else if (currentNetwork === 'arbitrum') {
      mainWalletAddress = process.env.EVM_MAIN_WALLET_ADDRESS;
      if (!mainWalletAddress) return { sufficient: false, message: 'EVM_MAIN_WALLET_ADDRESS not for Arbitrum.' };
      const usdtBalance = new BigNumber(await evmService.getERC20USDTBalance(mainWalletAddress, 'arbitrum'));
      const ethBalance = new BigNumber(await evmService.getNativeBalance(mainWalletAddress, 'arbitrum'));
      if (usdtBalance.isLessThan(amount)) {
        return {
          sufficient: false,
          message: `Insufficient USDT in Arbitrum main. Need: ${amount.toFixed()}, Have: ${usdtBalance.toFixed()}`,
        };
      }
      const remainingUsdtAfterSendArbitrum = usdtBalance.minus(amount);
      if (remainingUsdtAfterSendArbitrum.isLessThan(MIN_USDT_BALANCE_MAIN_WALLET)) {
        return {
          sufficient: false,
          message: `USDT balance after send would be too low in Arbitrum main. Remaining: ${remainingUsdtAfterSendArbitrum.toFixed()}, Min Required: ${MIN_USDT_BALANCE_MAIN_WALLET.toFixed()}`,
        };
      }
      if (ethBalance.isLessThan(MIN_ETH_ARBITRUM)) {
        return {
          sufficient: false,
          message: `Low ETH in Arbitrum main. Have: ${ethBalance.toFixed()}, Min: ${MIN_ETH_ARBITRUM}`,
        };
      }
    } else if (currentNetwork === 'bep20' || currentNetwork === 'bsc') {
      mainWalletAddress = process.env.EVM_MAIN_WALLET_ADDRESS;
      if (!mainWalletAddress) return { sufficient: false, message: 'EVM_MAIN_WALLET_ADDRESS not for BSC.' };
      const usdtBalance = new BigNumber(await evmService.getERC20USDTBalance(mainWalletAddress, 'bsc'));
      const bnbBalance = new BigNumber(await evmService.getNativeBalance(mainWalletAddress, 'bsc'));
      if (usdtBalance.isLessThan(amount)) {
        return {
          sufficient: false,
          message: `Insufficient USDT in BSC main. Need: ${amount.toFixed()}, Have: ${usdtBalance.toFixed()}`,
        };
      }
      const remainingUsdtAfterSendBsc = usdtBalance.minus(amount);
      if (remainingUsdtAfterSendBsc.isLessThan(MIN_USDT_BALANCE_MAIN_WALLET)) {
        return {
          sufficient: false,
          message: `USDT balance after send would be too low in BSC main. Remaining: ${remainingUsdtAfterSendBsc.toFixed()}, Min Required: ${MIN_USDT_BALANCE_MAIN_WALLET.toFixed()}`,
        };
      }
      if (bnbBalance.isLessThan(MIN_BNB_BSC)) {
        return {
          sufficient: false,
          message: `Low BNB in BSC main. Have: ${bnbBalance.toFixed()}, Min: ${MIN_BNB_BSC}`,
        };
      }
    } else {
      return { sufficient: false, message: `Unsupported network for balance check: ${currentNetwork}` };
    }
    return { sufficient: true, message: 'Main wallet balance sufficient.' };
  } catch (error) {
    const addr = mainWalletAddress || 'N/A';
    console.error(`[payoutEngine] Error checking main wallet balance for ${currentNetwork} (${addr}):`, error);
    return { sufficient: false, message: `Error checking main wallet balance: ${error.message}` };
  }
}

/**
 * Handles a payout request.
 * @param {object} payoutData - { recipientAddress, amount, network, payoutId, payoutType }
 * @returns {Promise<object>} { success: boolean, txHash?: string, error?: string,
 *   network: string, payoutId: string }
 */
async function handlePayoutRequest(payoutData) {
  const {
    recipientAddress, amount, network, payoutId, payoutType,
  } = payoutData;
  const lowerCaseNetwork = network.toLowerCase();

  console.log(`[payoutEngine] ID ${payoutId} (${payoutType}): Send ${amount} USDT to ${recipientAddress} on ${lowerCaseNetwork}`);

  const balanceCheck = await checkMainWalletBalance(amount, lowerCaseNetwork);
  if (!balanceCheck.sufficient) {
    console.error(`[payoutEngine] ID ${payoutId} FAILED balance check: ${balanceCheck.message}`);
    return {
      success: false, error: balanceCheck.message, network: lowerCaseNetwork, payoutId,
    };
  }

  try {
    let result;
    if (lowerCaseNetwork === 'trc20') {
      result = await tronService.sendTRC20(recipientAddress, amount);
    } else if (lowerCaseNetwork === 'arbitrum' || lowerCaseNetwork === 'bep20' || lowerCaseNetwork === 'bsc') {
      const evmNetworkParam = lowerCaseNetwork === 'bep20' ? 'bsc' : lowerCaseNetwork;
      result = await evmService.sendERC20(recipientAddress, amount, evmNetworkParam);
    } else {
      console.error(`[payoutEngine] ID ${payoutId} FAILED: Unsupported network ${network}`);
      return {
        success: false, error: `Unsupported network: ${network}`, network, payoutId,
      };
    }

    const finalResult = { ...result, payoutId };
    if (result.success) {
      console.log(`[payoutEngine] ID ${payoutId} SUCCEEDED on ${result.network}. Tx: ${result.txHash || result.txID}`);
    } else {
      console.error(`[payoutEngine] ID ${payoutId} FAILED on ${result.network}: ${result.error}`);
    }
    return finalResult;
  } catch (error) {
    console.error(`[payoutEngine] ID ${payoutId} CRITICAL error during tx on ${network}:`, error);
    return {
      success: false, error: error.message || 'Critical transaction error', network, payoutId,
    };
  }
}

/**
 * Handles a request to sweep funds from a temporary wallet.
 * @param {object} sweepData - { tempWalletAddress, tempWalletPrivateKey, network }
 * @returns {Promise<object>} { success: boolean, sweepTxHash?: string, error?: string,
 *   preparationTxHash?: string, step: string }
 */
async function handleSweepRequest(sweepData) {
  const { tempWalletAddress, tempWalletPrivateKey, network } = sweepData;
  const lowerCaseNetwork = network.toLowerCase();
  let preparationResult; let
    sweepResult;

  console.log(`[payoutEngine] SWEEP for ${tempWalletAddress} on ${lowerCaseNetwork}`);

  try {
    if (lowerCaseNetwork === 'trc20') {
      preparationResult = await tronService.prepareWalletForSweepTRC20(tempWalletAddress);
    } else if (lowerCaseNetwork === 'arbitrum' || lowerCaseNetwork === 'bep20' || lowerCaseNetwork === 'bsc') {
      const evmNetworkParam = lowerCaseNetwork === 'bep20' ? 'bsc' : lowerCaseNetwork;
      preparationResult = await evmService.prepareWalletForSweepERC20(
        tempWalletAddress,
        evmNetworkParam,
      );
    } else {
      return { success: false, error: `Unsupported network for sweep prep: ${network}`, step: 'preparation' };
    }

    if (!preparationResult.success && !preparationResult.message?.includes('Sufficient')) {
      console.error(`[payoutEngine] SWEEP ${tempWalletAddress} FAILED prep: ${preparationResult.error}`);
      return { ...preparationResult, step: 'preparation' };
    }
    const prepTx = preparationResult.txID || preparationResult.txHash;
    console.log(`[payoutEngine] SWEEP ${tempWalletAddress} prep on ${lowerCaseNetwork}: ${preparationResult.message || prepTx || 'OK'}`);

    if (lowerCaseNetwork === 'trc20') {
      sweepResult = await tronService.sweepTRC20(tempWalletPrivateKey, tempWalletAddress);
    } else if (lowerCaseNetwork === 'arbitrum' || lowerCaseNetwork === 'bep20' || lowerCaseNetwork === 'bsc') {
      const evmNetworkParam = lowerCaseNetwork === 'bep20' ? 'bsc' : lowerCaseNetwork;
      sweepResult = await evmService.sweepERC20(
        tempWalletPrivateKey,
        tempWalletAddress,
        evmNetworkParam,
      );
    } else {
      return { success: false, error: `Unsupported network for sweep: ${network}`, step: 'sweep' };
    }

    const finalSweepResult = {
      ...sweepResult,
      step: 'sweep',
      preparationTxHash: prepTx,
    };

    if (sweepResult.success) {
      const sweepTx = sweepResult.txHash || sweepResult.txID;
      console.log(`[payoutEngine] SWEEP ${tempWalletAddress} SUCCEEDED on ${sweepResult.network}. Tx: ${sweepTx}`);
    } else {
      console.error(`[payoutEngine] SWEEP ${tempWalletAddress} FAILED on ${sweepResult.network}: ${sweepResult.error}`);
    }
    return finalSweepResult;
  } catch (error) {
    console.error(`[payoutEngine] SWEEP ${tempWalletAddress} CRITICAL error on ${network}:`, error);
    return {
      success: false, error: error.message || 'Critical sweep error', network, step: 'critical',
    };
  }
}

module.exports = {
  handlePayoutRequest,
  handleSweepRequest,
  checkMainWalletBalance,
};

// Example Usage (for testing - to be called from payout_worker.js or test script)
/*
require('dotenv').config();

async function testPayoutEngine() {
    // Ensure .env has:
    // TRON_MAIN_WALLET_PRIVATE_KEY, TRON_MAIN_WALLET_ADDRESS,
    // EVM_MAIN_WALLET_PRIVATE_KEY, EVM_MAIN_WALLET_ADDRESS,
    // ARBITRUM_NODE_URL, BSC_NODE_URL,
    // TEST_RECIPIENT_TRC20_ADDRESS, TEST_RECIPIENT_BSC_ADDRESS, TEST_RECIPIENT_ARBITRUM_ADDRESS
    // For sweep: TEST_TEMP_WALLET_ADDRESS, TEST_TEMP_WALLET_PRIVATE_KEY (for TRON)
    //            TEST_EVM_TEMP_WALLET_ADDRESS, TEST_EVM_TEMP_WALLET_PRIVATE_KEY (for EVM)

    // Test Case 1: Successful TRC20 Payout
    // const payout1 = {
    //     recipientAddress: process.env.TEST_RECIPIENT_TRC20_ADDRESS,
    //     amount: '0.01',
    //     network: 'trc20',
    //     payoutId: 'test-payout-trc20-001',
    //     payoutType: 'withdrawal_request'
    // };
    // if(payout1.recipientAddress) {
    //     console.log("\n--- Test Case: TRC20 Payout ---");
    //     const result1 = await handlePayoutRequest(payout1);
    //     console.log("TRC20 Payout Result:", result1);
    // }

    // Test Case 2: Successful BSC Payout
    // const payout2 = {
    //     recipientAddress: process.env.TEST_RECIPIENT_BSC_ADDRESS,
    //     amount: '0.01',
    //     network: 'bep20',
    //     payoutId: 'test-payout-bsc-001',
    //     payoutType: 'daily_payout'
    // };
    // if(payout2.recipientAddress) {
    //     console.log("\n--- Test Case: BSC Payout ---");
    //     const result2 = await handlePayoutRequest(payout2);
    //     console.log("BSC Payout Result:", result2);
    // }

    // Test Case 5: Sweep TRC20 Wallet
    // const sweepDataTRC20 = {
    //     tempWalletAddress: process.env.TEST_TEMP_WALLET_ADDRESS,
    //     tempWalletPrivateKey: process.env.TEST_TEMP_WALLET_PRIVATE_KEY,
    //     network: 'trc20'
    // };
    // if (sweepDataTRC20.tempWalletAddress && sweepDataTRC20.tempWalletPrivateKey) {
    //     console.log("\n--- Test Case: Sweep TRC20 Wallet ---");
    //     const resultSweepTRC20 = await handleSweepRequest(sweepDataTRC20);
    //     console.log("Sweep TRC20 Result:", resultSweepTRC20);
    // }

    // Test Case 6: Sweep BSC Wallet
    // const sweepDataBSC = {
    //     tempWalletAddress: process.env.TEST_EVM_TEMP_WALLET_ADDRESS,
    //     tempWalletPrivateKey: process.env.TEST_EVM_TEMP_WALLET_PRIVATE_KEY,
    //     network: 'bsc'
    // };
    // if (sweepDataBSC.tempWalletAddress && sweepDataBSC.tempWalletPrivateKey) {
    //     console.log("\n--- Test Case: Sweep BSC Wallet ---");
    //     const resultSweepBSC = await handleSweepRequest(sweepDataBSC);
    //     console.log("Sweep BSC Result:", resultSweepBSC);
    // }
}

// testPayoutEngine();
*/
