const { ethers } = require('ethers');
const BigNumber = require('bignumber.js'); // Already used in tron.js, good to reuse

// --- Configuration (should be loaded from .env or a config file) ---
const { EVM_MAIN_WALLET_PRIVATE_KEY } = process.env;
const { EVM_MAIN_WALLET_ADDRESS } = process.env; // Can be derived from PK,
// but good to have for verification

const { ARBITRUM_NODE_URL } = process.env;
const { BSC_NODE_URL } = process.env;

// Standard USDT contract addresses (verify these for your specific needs/networks)
const ARBITRUM_USDT_CONTRACT_ADDRESS = process.env.ARBITRUM_USDT_CONTRACT_ADDRESS || '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
const BSC_USDT_CONTRACT_ADDRESS = process.env.BSC_USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955';

const NATIVE_AMOUNT_FOR_SWEEP_FEE_ARBITRUM = process.env.NATIVE_AMOUNT_FOR_SWEEP_FEE_ARBITRUM || '0.001'; // in ETH
const NATIVE_AMOUNT_FOR_SWEEP_FEE_BSC = process.env.NATIVE_AMOUNT_FOR_SWEEP_FEE_BSC || '0.002'; // in BNB

const EVM_SWEEP_DESTINATION_ADDRESS = process.env.EVM_SWEEP_DESTINATION_ADDRESS || EVM_MAIN_WALLET_ADDRESS;

if (!EVM_MAIN_WALLET_PRIVATE_KEY) {
  console.error('[evmService] CRITICAL: EVM_MAIN_WALLET_PRIVATE_KEY is not set in environment.');
  // throw new Error('Missing EVM main wallet private key');
}
if (!ARBITRUM_NODE_URL && !BSC_NODE_URL) {
  console.warn('[evmService] WARNING: Neither ARBITRUM_NODE_URL nor BSC_NODE_URL is set. EVM service may not function for these networks.');
}

const erc20Abi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint amount) returns (bool)',
];

const getProviderAndSigner = (network, privateKey) => {
  let providerUrl;
  if (network.toLowerCase() === 'arbitrum') {
    providerUrl = ARBITRUM_NODE_URL;
  } else if (network.toLowerCase() === 'bep20' || network.toLowerCase() === 'bsc') {
    providerUrl = BSC_NODE_URL;
  } else {
    throw new Error(`[evmService] Unsupported EVM network: ${network}`);
  }

  if (!providerUrl) {
    throw new Error(`[evmService] Node URL for network ${network} is not configured.`);
  }

  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const signer = new ethers.Wallet(privateKey || EVM_MAIN_WALLET_PRIVATE_KEY, provider);
  return { provider, signer };
};

/**
 * Get native token balance (ETH for Arbitrum, BNB for BSC).
 * @param {string} address - The EVM address.
 * @param {string} network - 'arbitrum' or 'bsc'/'bep20'.
 * @returns {Promise<string>} Balance in native token (e.g., "0.5" ETH).
 */
async function getNativeBalance(address, network) {
  try {
    const { provider } = getProviderAndSigner(network);
    const balanceWei = await provider.getBalance(address);
    return ethers.utils.formatEther(balanceWei); // Converts Wei to ETH/BNB string
  } catch (error) {
    console.error(`[evmService] Error getting native balance for ${address} on ${network}:`, error);
    throw error;
  }
}

/**
 * Get ERC20 USDT balance of an address on a given EVM network.
 * @param {string} address - The EVM address.
 * @param {string} network - 'arbitrum' or 'bsc'/'bep20'.
 * @returns {Promise<string>} USDT balance (human-readable).
 */
async function getERC20USDTBalance(address, network) {
  try {
    const { provider } = getProviderAndSigner(network);
    const usdtContractAddress = network.toLowerCase() === 'arbitrum' ? ARBITRUM_USDT_CONTRACT_ADDRESS : BSC_USDT_CONTRACT_ADDRESS;
    if (!usdtContractAddress) throw new Error(`[evmService] USDT contract address for ${network} not configured.`);

    const contract = new ethers.Contract(usdtContractAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`[evmService] Error getting ERC20 USDT balance for ${address} on ${network}:`, error);
    throw error;
  }
}

/**
 * Send ERC20 USDT from the main EVM wallet.
 * @param {string} recipientAddress - The address to send USDT to.
 * @param {string} amount - The amount of USDT to send (human-readable, e.g., "10.5").
 * @param {string} network - 'arbitrum' or 'bsc'/'bep20'.
 * @returns {Promise<object>} Transaction result.
 */
async function sendERC20(recipientAddress, amount, network) {
  console.log(`[evmService] Attempting to send ${amount} USDT to ${recipientAddress} on ${network} from ${EVM_MAIN_WALLET_ADDRESS}`);
  try {
    const { signer } = getProviderAndSigner(network);
    const usdtContractAddress = network.toLowerCase() === 'arbitrum' ? ARBITRUM_USDT_CONTRACT_ADDRESS : BSC_USDT_CONTRACT_ADDRESS;
    if (!usdtContractAddress) throw new Error(`[evmService] USDT contract address for ${network} not configured.`);

    const contract = new ethers.Contract(usdtContractAddress, erc20Abi, signer);
    const decimals = await contract.decimals();
    const amountInSmallestUnit = ethers.utils.parseUnits(amount, decimals);

    const tx = await contract.transfer(recipientAddress, amountInSmallestUnit);
    await tx.wait(); // Wait for transaction to be mined

    console.log(`[evmService] USDT sent successfully on ${network}. TX Hash: ${tx.hash}`);
    return { success: true, txHash: tx.hash, network: network.toLowerCase() };
  } catch (error) {
    console.error(`[evmService] Error sending ERC20 USDT to ${recipientAddress} on ${network}:`, error);
    return { success: false, error: error.message || error, network: network.toLowerCase() };
  }
}

/**
 * Prepare a temporary EVM wallet for sweeping by sending native currency for fees.
 * @param {string} tempWalletAddress - The address of the temporary wallet.
 * @param {string} network - 'arbitrum' or 'bsc'/'bep20'.
 * @returns {Promise<object>} Transaction result or status.
 */
async function prepareWalletForSweepERC20(tempWalletAddress, network) {
  const nativeAmountForFee = network.toLowerCase() === 'arbitrum' ? NATIVE_AMOUNT_FOR_SWEEP_FEE_ARBITRUM : NATIVE_AMOUNT_FOR_SWEEP_FEE_BSC;
  console.log(`[evmService] Preparing wallet ${tempWalletAddress} on ${network} for sweep by sending ${nativeAmountForFee} native token.`);

  try {
    const { signer } = getProviderAndSigner(network);
    const currentNativeBalance = await getNativeBalance(tempWalletAddress, network);
    if (
      new BigNumber(currentNativeBalance).isGreaterThanOrEqualTo(
        new BigNumber(nativeAmountForFee),
      )
    ) {
      console.log(
        `[evmService] Wallet ${tempWalletAddress} on ${network} already has sufficient native token for fees.`,
      );
      return { success: true, message: 'Sufficient native token already present', network: network.toLowerCase() };
    }

    const tx = await signer.sendTransaction({
      to: tempWalletAddress,
      value: ethers.utils.parseEther(nativeAmountForFee), // Amount in ETH/BNB
    });
    await tx.wait();

    console.log(`[evmService] Native token sent to ${tempWalletAddress} on ${network} for fees. TX Hash: ${tx.hash}`);
    return { success: true, txHash: tx.hash, network: network.toLowerCase() };
  } catch (error) {
    console.error(`[evmService] Error sending native token to ${tempWalletAddress} on ${network}:`, error);
    return { success: false, error: error.message || error, network: network.toLowerCase() };
  }
}

/**
 * Sweep (transfer) all ERC20 USDT from a temporary EVM wallet
 * to the main sweep destination address.
 * @param {string} tempWalletPrivateKey - The private key of the temporary wallet.
 * @param {string} tempWalletAddress - The address of the temporary wallet.
 * @param {string} network - 'arbitrum' or 'bsc'/'bep20'.
 * @returns {Promise<object>} Transaction result.
 */
async function sweepERC20(tempWalletPrivateKey, tempWalletAddress, network) {
  if (!EVM_SWEEP_DESTINATION_ADDRESS) throw new Error('[evmService] EVM_SWEEP_DESTINATION_ADDRESS is not initialized');
  if (!tempWalletPrivateKey || !tempWalletAddress) throw new Error('[evmService] Temporary wallet private key or address is missing for sweep.');

  console.log(`[evmService] Attempting to sweep USDT from ${tempWalletAddress} to ${EVM_SWEEP_DESTINATION_ADDRESS} on ${network}`);

  try {
    const { signer: tempSigner } = getProviderAndSigner(network, tempWalletPrivateKey);
    const usdtContractAddress = network.toLowerCase() === 'arbitrum' ? ARBITRUM_USDT_CONTRACT_ADDRESS : BSC_USDT_CONTRACT_ADDRESS;
    if (!usdtContractAddress) throw new Error(`[evmService] USDT contract address for ${network} not configured.`);

    const contract = new ethers.Contract(usdtContractAddress, erc20Abi, tempSigner);
    const balance = await contract.balanceOf(tempWalletAddress);
    const decimals = await contract.decimals();
    const usdtBalanceReadable = ethers.utils.formatUnits(balance, decimals);

    if (new BigNumber(usdtBalanceReadable).isLessThanOrEqualTo(0)) {
      console.log(`[evmService] No USDT to sweep from ${tempWalletAddress} on ${network}. Balance: ${usdtBalanceReadable}`);
      return { success: true, message: 'No USDT to sweep', network: network.toLowerCase() };
    }
    console.log(`[evmService] Sweeping ${usdtBalanceReadable} USDT from ${tempWalletAddress} on ${network}`);

    // Amount to sweep is the full balance in smallest unit
    const tx = await contract.transfer(EVM_SWEEP_DESTINATION_ADDRESS, balance);
    await tx.wait();

    console.log(`[evmService] USDT swept successfully from ${tempWalletAddress} on ${network}. TX Hash: ${tx.hash}`);
    return { success: true, txHash: tx.hash, network: network.toLowerCase() };
  } catch (error) {
    console.error(`[evmService] Error sweeping ERC20 USDT from ${tempWalletAddress} on ${network}:`, error);
    if (error.message && (error.message.includes('insufficient funds') || error.message.includes('gas required exceeds allowance'))) {
      return {
        success: false, error: `Insufficient native token for fees on temporary wallet (${network}).`, details: error.message, network: network.toLowerCase(),
      };
    }
    return { success: false, error: error.message || error, network: network.toLowerCase() };
  }
}

module.exports = {
  getNativeBalance,
  getERC20USDTBalance,
  sendERC20,
  prepareWalletForSweepERC20,
  sweepERC20,
};

// Basic test function (example, uncomment and adapt for use)
/*
require('dotenv').config(); // Load .env file for testing

async function testEvmService() {
    const testNetwork = 'bsc'; // or 'arbitrum'
    const mainWalletAddress = EVM_MAIN_WALLET_ADDRESS;
    // For sweep test, you need a temporary wallet with PK and some USDT + native token
    const tempWalletAddressForTest = process.env.TEST_EVM_TEMP_WALLET_ADDRESS;
    const tempWalletPkForTest = process.env.TEST_EVM_TEMP_WALLET_PRIVATE_KEY;

    if (!mainWalletAddress) {
        console.log("EVM_MAIN_WALLET_ADDRESS not set in .env for testing.");
        return;
    }

    try {
        console.log(`\n--- Testing on ${testNetwork.toUpperCase()} ---`);
        console.log(`Main Wallet Address: ${mainWalletAddress}`);

        const nativeBalance = await getNativeBalance(mainWalletAddress, testNetwork);
        console.log(`Main Wallet Native Balance (${testNetwork.toUpperCase()}): ${nativeBalance}`);

        const usdtBalance = await getERC20USDTBalance(mainWalletAddress, testNetwork);
        console.log(`Main Wallet USDT Balance (${testNetwork.toUpperCase()}): ${usdtBalance} USDT`);

        // --- Test sendERC20 (BE VERY CAREFUL WITH REAL ASSETS) ---
        // const recipient = 'SOME_OTHER_TEST_EVM_ADDRESS';
        // const amountToSend = '0.01';
        // if (recipient !== 'SOME_OTHER_TEST_EVM_ADDRESS') {
        //     console.log(
        //         `\nAttempting to send ${amountToSend} USDT to ${recipient} on ${testNetwork}...`
        //     );
        //     const sendResult = await sendERC20(recipient, amountToSend, testNetwork);
        // } else {
        //     console.log('\nPlease set a recipient address to test sendERC20.');
        // }

        // --- Test prepareWalletForSweepERC20 and sweepERC20 ---
        if (tempWalletAddressForTest && tempWalletPkForTest) {
            console.log(`\nTesting sweep for ${tempWalletAddressForTest} on ${testNetwork}:`);
            const tempNativeBefore = await getNativeBalance(tempWalletAddressForTest, testNetwork);
            const tempUSDTBefore = await getERC20USDTBalance(tempWalletAddressForTest, testNetwork);
            console.log(
                `  Temp Wallet Balances Before: ${tempNativeBefore} Native, ${tempUSDTBefore} USDT`
            );

            if (new BigNumber(tempUSDTBefore).isGreaterThan(0)) {
                console.log('  Attempting to prepare wallet for sweep...');
                const prepResult = await prepareWalletForSweepERC20(
                    tempWalletAddressForTest, testNetwork
                );
                console.log('  Prepare Wallet Result:', prepResult);

                // Wait a bit for the native token transfer to confirm if needed,
                // or check balance again
                // await new Promise(resolve => setTimeout(resolve, 15000)); // 15s delay

                console.log('  Attempting to sweep...');
                const sweepResult = await sweepERC20(
                    tempWalletPkForTest,
                    tempWalletAddressForTest,
                    testNetwork
                );
                console.log('  Sweep USDT Result:', sweepResult);
                const tempUSDTAfter = await getERC20USDTBalance(
                    tempWalletAddressForTest,
                    testNetwork
                );
                console.log(`  Temp Wallet USDT After Sweep: ${tempUSDTAfter} USDT`);
            } else {
                console.log('  Skipping sweep test as temp wallet has no USDT.');
            }
        } else {
            console.log(
                '\nPlease set TEST_EVM_TEMP_WALLET_ADDRESS and ' +
                'TEST_EVM_TEMP_WALLET_PRIVATE_KEY in .env to test sweep functionality.'
            );
        }

    } catch (e) {
        console.error(`Test function error on ${testNetwork}:`, e);
    }
}

// testEvmService(); // Uncomment to run test function
*/
