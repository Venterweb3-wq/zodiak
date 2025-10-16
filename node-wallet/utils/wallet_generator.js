const { ethers } = require('ethers');
const TronWeb = require('tronweb');

/**
 * Генерирует кошелек для EVM-совместимых сетей (например, Arbitrum).
 * @returns {{address: string, privateKey: string}}
 */
function generateArbitrumWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Генерирует кошелек для сети TRC20 используя TronWeb.
 * @returns {{address: string, privateKey: string}}
 */
async function generateTRC20Wallet() {
  const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': process.env.TRON_API_KEY },
  });

  const account = await tronWeb.createAccount();
  return {
    address: account.address.base58,
    privateKey: account.privateKey,
  };
}

module.exports = {
  generateArbitrumWallet,
  generateTRC20Wallet,
};
