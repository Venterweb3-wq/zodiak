const { generateArbitrumWallet, generateTRC20Wallet } = require('../utils/wallet_generator');
const { encrypt } = require('../utils/crypto');

/**
 * Генерирует кошелек для указанной сети и шифрует его приватный ключ.
 * @param {string} network - Сеть для генерации ('ARBITRUM' или 'TRC20').
 * @returns {Promise<{address: string, encryptedPrivateKey: string, network: string}>}
 * @throws {Error} Если сеть не поддерживается или произошла ошибка при шифровании.
 */
async function generateWallet(network) {
  let wallet;

  if (network === 'ARBITRUM') {
    wallet = generateArbitrumWallet();
  } else if (network === 'TRC20') {
    wallet = await generateTRC20Wallet();
  } else if (network === 'BEP20') {
    wallet = generateArbitrumWallet();
  } else {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (!wallet || !wallet.privateKey) {
    // Дополнительная проверка на случай, если генераторы вернут что-то не то
    throw new Error(`Failed to generate wallet for network: ${network}`);
  }

  const encryptedKey = encrypt(wallet.privateKey);

  return {
    address: wallet.address,
    encryptedPrivateKey: encryptedKey,
    network,
  };
}

module.exports = { generateWallet };
