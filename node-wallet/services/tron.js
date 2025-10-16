const TronWeb = require('tronweb');
const BigNumber = require('bignumber.js');

// --- Configuration (should be loaded from .env or a config file) ---
const TRON_NODE_URL = process.env.TRON_NODE_URL || 'https://api.trongrid.io'; // Example, use your own or a reliable public one
const { TRON_MAIN_WALLET_PRIVATE_KEY } = process.env;
const { TRON_MAIN_WALLET_ADDRESS } = process.env;
const TRC20_USDT_CONTRACT_ADDRESS = process.env.TRC20_USDT_CONTRACT_ADDRESS || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 address
const TRX_AMOUNT_FOR_SWEEP_FEE = process.env.TRX_AMOUNT_FOR_SWEEP_FEE || '5000000'; // 5 TRX in SUN (1 TRX = 1,000,000 SUN)
const SWEEP_DESTINATION_ADDRESS_TRON = process.env.SWEEP_DESTINATION_ADDRESS_TRON || TRON_MAIN_WALLET_ADDRESS;

if (!TRON_MAIN_WALLET_PRIVATE_KEY || !TRON_MAIN_WALLET_ADDRESS) {
  console.error('[tronService] CRITICAL: TRON_MAIN_WALLET_PRIVATE_KEY or TRON_MAIN_WALLET_ADDRESS is not set in environment.');
  // Optionally, throw an error to prevent the application from running without critical config
  // throw new Error('Missing Tron main wallet configuration');
}

let tronWeb;
try {
  tronWeb = new TronWeb(
    TRON_NODE_URL,
    TRON_NODE_URL, // fullHost can be the same as fullNode for TronGrid
    TRON_NODE_URL, // eventServer can be the same for TronGrid
    TRON_MAIN_WALLET_PRIVATE_KEY,
  );
  console.log('[tronService] TronWeb initialized successfully.');
} catch (error) {
  console.error('[tronService] Failed to initialize TronWeb:', error);
  // Handle initialization error, maybe retry or exit
}

/**
 * Get TRX balance of an address.
 * @param {string} address - The TRON address.
 * @returns {Promise<string>} Balance in TRX.
 */
async function getTRXBalance(address) {
  if (!tronWeb) throw new Error('TronWeb is not initialized');
  try {
    const balanceSun = await tronWeb.trx.getBalance(address);
    return tronWeb.fromSun(balanceSun); // Convert SUN to TRX
  } catch (error) {
    console.error(`[tronService] Error getting TRX balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Get TRC20 USDT balance of an address.
 * @param {string} address - The TRON address.
 * @returns {Promise<string>} USDT balance (already in human-readable format, considering decimals).
 */
async function getTRC20USDTBalance(address) {
  if (!tronWeb) throw new Error('TronWeb is not initialized');
  try {
    const contract = await tronWeb.contract().at(TRC20_USDT_CONTRACT_ADDRESS);
    const balance = await contract.methods.balanceOf(address).call();
    const decimals = await contract.methods.decimals().call();
    // Convert BigNumber to string with correct decimal places
    return new BigNumber(balance.toString()).shiftedBy(-decimals.toNumber()).toFixed();
  } catch (error) {
    console.error(`[tronService] Error getting TRC20 USDT balance for ${address}:`, error);
    throw error;
  }
}

/**
 * Send TRC20 USDT from the main wallet to a recipient.
 * @param {string} recipientAddress - The address to send USDT to.
 * @param {string} amount - The amount of USDT to send (human-readable, e.g., "10.5").
 * @returns {Promise<object>} Transaction result containing txID.
 */
async function sendTRC20(recipientAddress, amount) {
  if (!tronWeb || !TRON_MAIN_WALLET_ADDRESS) throw new Error('TronWeb or main wallet address is not initialized');
  console.log(`[tronService] Attempting to send ${amount} USDT to ${recipientAddress} from ${TRON_MAIN_WALLET_ADDRESS}`);

  try {
    const contract = await tronWeb.contract().at(TRC20_USDT_CONTRACT_ADDRESS);
    const decimals = await contract.methods.decimals().call();
    const amountInSmallestUnit = new BigNumber(amount).shiftedBy(decimals.toNumber()).toString();

    const tx = await contract.methods.transfer(
      recipientAddress,
      amountInSmallestUnit,
    ).send({
      feeLimit: 100000000, // 100 TRX in SUN, adjust as needed
      callValue: 0,
      shouldPollResponse: true, // Poll for transaction confirmation
    });

    console.log(`[tronService] USDT sent successfully. TX ID: ${tx}`);
    return { success: true, txID: tx, network: 'TRC20' };
  } catch (error) {
    console.error(`[tronService] Error sending TRC20 USDT to ${recipientAddress}:`, error);
    return { success: false, error: error.message || error, network: 'TRC20' };
  }
}

/**
 * Prepare a temporary wallet for sweeping TRC20 tokens by sending TRX for fees.
 * (Alternative: Delegate energy - more complex, requires specific setup)
 * @param {string} tempWalletAddress - The address of the temporary wallet.
 * @returns {Promise<object>} Transaction result or status.
 */
async function prepareWalletForSweepTRC20(tempWalletAddress) {
  if (!tronWeb || !TRON_MAIN_WALLET_ADDRESS) throw new Error('TronWeb or main wallet address is not initialized');
  console.log(`[tronService] Preparing wallet ${tempWalletAddress} for sweep by sending ${tronWeb.fromSun(TRX_AMOUNT_FOR_SWEEP_FEE)} TRX.`);

  try {
    // Check current TRX balance of temp wallet to avoid sending if already funded
    const currentTRXBalance = await getTRXBalance(tempWalletAddress);
    if (new BigNumber(currentTRXBalance).isGreaterThanOrEqualTo(new BigNumber(tronWeb.fromSun(TRX_AMOUNT_FOR_SWEEP_FEE)))) {
      console.log(`[tronService] Wallet ${tempWalletAddress} already has sufficient TRX for fees.`);
      return { success: true, message: 'Sufficient TRX already present', network: 'TRC20' };
    }

    const tx = await tronWeb.trx.sendTransaction(
      tempWalletAddress,
      TRX_AMOUNT_FOR_SWEEP_FEE, // Amount in SUN
      // No options needed for TRX transfer from default wallet usually
    );

    // tronWeb.trx.sendTransaction for TRX transfers typically returns an object like:
    // { result: true, txid: '...', transaction: { ... } }
    // For newer versions, it might directly return the transaction object or just the txid string.
    // We need to handle these variations carefully.

    let txID = null;
    if (tx && tx.result && tx.txid) { // Common case for older tronweb
      txID = tx.txid;
    } else if (tx && tx.transaction && tx.transaction.txID) { // If it returns the full transaction object
      txID = tx.transaction.txID;
    } else if (typeof tx === 'string' && tx.length === 64) { // If it returns just the txID string
      txID = tx;
    }

    if (txID) {
      console.log(`[tronService] TRX sent to ${tempWalletAddress} for fees. TX ID: ${txID}`);
      return { success: true, txID, network: 'TRC20' };
    }
    console.warn(`[tronService] TRX send to ${tempWalletAddress} might have failed or TX ID not found directly in response:`, tx);
    return {
      success: false, error: 'TRX send failed or TX ID not found in response', details: tx, network: 'TRC20',
    };
  } catch (error) {
    console.error(`[tronService] Error sending TRX to ${tempWalletAddress}:`, error);
    return { success: false, error: error.message || error, network: 'TRC20' };
  }
}

/**
 * Sweep (transfer) all TRC20 USDT from a temporary wallet to the main sweep destination address.
 * Assumes the temporary wallet has enough TRX for fees (use prepareWalletForSweepTRC20 first).
 * @param {string} tempWalletPrivateKey - The private key of the temporary wallet.
 * @param {string} tempWalletAddress - The address of the temporary wallet.
 * @returns {Promise<object>} Transaction result.
 */
async function sweepTRC20(tempWalletPrivateKey, tempWalletAddress) {
  if (!tronWeb || !SWEEP_DESTINATION_ADDRESS_TRON) throw new Error('TronWeb or sweep destination address is not initialized');
  if (!tempWalletPrivateKey || !tempWalletAddress) throw new Error('Temporary wallet private key or address is missing for sweep.');

  console.log(`[tronService] Attempting to sweep USDT from ${tempWalletAddress} to ${SWEEP_DESTINATION_ADDRESS_TRON}`);

  // Create a temporary TronWeb instance for the temporary wallet
  const tempTronWeb = new TronWeb(TRON_NODE_URL, TRON_NODE_URL, TRON_NODE_URL, tempWalletPrivateKey);

  try {
    // Get USDT balance using the tempTronWeb instance to ensure it's from the perspective of the temp wallet's connection if any diff
    const contractForBalance = await tempTronWeb.contract().at(TRC20_USDT_CONTRACT_ADDRESS);
    const balanceSmallestUnit = await contractForBalance.methods.balanceOf(tempWalletAddress).call();
    const decimals = await contractForBalance.methods.decimals().call();

    const usdtBalanceReadable = new BigNumber(balanceSmallestUnit.toString()).shiftedBy(-decimals.toNumber());

    if (usdtBalanceReadable.isLessThanOrEqualTo(0)) {
      console.log(`[tronService] No USDT to sweep from ${tempWalletAddress}. Balance: ${usdtBalanceReadable.toFixed()}`);
      return { success: true, message: 'No USDT to sweep', network: 'TRC20' };
    }
    console.log(`[tronService] Sweeping ${usdtBalanceReadable.toFixed()} USDT from ${tempWalletAddress}`);

    const contractToSweep = await tempTronWeb.contract().at(TRC20_USDT_CONTRACT_ADDRESS);
    // We use balanceSmallestUnit directly as it's already in the correct format
    const tx = await contractToSweep.methods.transfer(
      SWEEP_DESTINATION_ADDRESS_TRON,
      balanceSmallestUnit.toString(), // Ensure it's a string if BigNumber was used for calculation
    ).send({
      feeLimit: 100000000, // Max fee limit for the sweep
      callValue: 0,
      shouldPollResponse: true,
    });

    // tx for TRC20 transfers is usually the transaction ID string
    console.log(`[tronService] USDT swept successfully from ${tempWalletAddress}. TX ID: ${tx}`);
    return { success: true, txID: tx, network: 'TRC20' };
  } catch (error) {
    console.error(`[tronService] Error sweeping TRC20 USDT from ${tempWalletAddress}:`, error);
    if (error.message && (error.message.includes('balance is not enough') || error.message.includes('account resource insufficient'))) {
      return {
        success: false, error: 'Insufficient TRX for fees on temporary wallet.', details: error.message, network: 'TRC20',
      };
    }
    return { success: false, error: error.message || error, network: 'TRC20' };
  }
}

module.exports = {
  getTRXBalance,
  getTRC20USDTBalance,
  sendTRC20,
  prepareWalletForSweepTRC20,
  sweepTRC20,
};

// Basic test (uncomment and run with `node services/tron.js` for quick checks if needed)
/*
async function test() {
    if (!process.env.TRON_MAIN_WALLET_PRIVATE_KEY || !process.env.TRON_MAIN_WALLET_ADDRESS) {
        console.log("TRON_MAIN_WALLET_PRIVATE_KEY or TRON_MAIN_WALLET_ADDRESS not set in .env for testing.");
        return;
    }
    if (!tronWeb) {
        console.log("TronWeb is not initialized for test.");
        return;
    }
    try {
        console.log(`Main Wallet Address: ${TRON_MAIN_WALLET_ADDRESS}`);
        const trxBalance = await getTRXBalance(TRON_MAIN_WALLET_ADDRESS);
        console.log(`Main Wallet TRX Balance: ${trxBalance} TRX`);

        const usdtBalance = await getTRC20USDTBalance(TRON_MAIN_WALLET_ADDRESS);
        console.log(`Main Wallet USDT Balance: ${usdtBalance} USDT`);

        // --- Test sendTRC20 (BE VERY CAREFUL WITH REAL ASSETS) ---
        // const recipient = 'SOME_OTHER_TEST_ADDRESS'; // Replace with a test recipient under your control
        // const amountToSend = '0.01'; // Test amount
        // if (recipient !== 'SOME_OTHER_TEST_ADDRESS') {
        //     console.log(`\nAttempting to send ${amountToSend} USDT to ${recipient}...`);
        //     const sendResult = await sendTRC20(recipient, amountToSend);
        //     console.log('Send USDT Result:', sendResult);
        // } else {
        //     console.log('\nPlease set a recipient address to test sendTRC20.');
        // }

        // --- Test prepareWalletForSweepTRC20 and sweepTRC20 ---
        // This requires a temporary wallet with a known private key.
        // For testing, you might generate one, send some TRX and USDT to it manually first.
        // const tempWallet = TronWeb.createAccount(); // Creates a new account object
        // const tempWalletAddressToTest = tempWallet.address.base58;
        // const tempWalletPKToTest = tempWallet.privateKey;
        // console.log(`\nGenerated Temp Wallet for Sweep Test:\n  Address: ${tempWalletAddressToTest}\n  PK: ${tempWalletPKToTest}`);
        // console.log(`PLEASE SEND SOME TRX (e.g., 10) and USDT (e.g., 0.1) to ${tempWalletAddressToTest} for a full sweep test.`);

        // Or use a pre-existing temporary wallet you control:
        const tempWalletAddressToTest = process.env.TEST_TEMP_WALLET_ADDRESS; // Define in .env
        const tempWalletPKToTest = process.env.TEST_TEMP_WALLET_PRIVATE_KEY; // Define in .env

        if (tempWalletAddressToTest && tempWalletPKToTest) {
            console.log(`\nTesting sweep for ${tempWalletAddressToTest}:`);
            const tempTRXBefore = await getTRXBalance(tempWalletAddressToTest);
            const tempUSDTBefore = await getTRC20USDTBalance(tempWalletAddressToTest);
            console.log(`  Temp Wallet Balances Before: ${tempTRXBefore} TRX, ${tempUSDTBefore} USDT`);

            if (new BigNumber(tempUSDTBefore).isGreaterThan(0)) {
                 console.log('  Attempting to prepare wallet for sweep...');
                 const prepResult = await prepareWalletForSweepTRC20(tempWalletAddressToTest);
                 console.log('  Prepare Wallet Result:', prepResult);

                 console.log('  Attempting to sweep...');
                 const sweepResult = await sweepTRC20(tempWalletPKToTest, tempWalletAddressToTest);
                 console.log('  Sweep USDT Result:', sweepResult);
                 const tempUSDTAfter = await getTRC20USDTBalance(tempWalletAddressToTest);
                 console.log(`  Temp Wallet USDT After Sweep: ${tempUSDTAfter} USDT`);
            } else {
                console.log('  Skipping sweep test as temp wallet has no USDT.');
            }
        } else {
            console.log('\nPlease set TEST_TEMP_WALLET_ADDRESS and TEST_TEMP_WALLET_PRIVATE_KEY in .env to test sweep functionality.');
        }

    } catch (e) {
        console.error('Test function error:', e);
    }
}

// To run tests:
// 1. Make sure you have a .env file with TRON_MAIN_WALLET_PRIVATE_KEY, TRON_MAIN_WALLET_ADDRESS,
//    TEST_TEMP_WALLET_ADDRESS, TEST_TEMP_WALLET_PRIVATE_KEY (with some USDT and TRX on temp for sweep test)
// 2. Uncomment the line below
// require('dotenv').config(); // To load .env variables for the test
// test();
*/
