const crypto = require('crypto');

const { createCipheriv, createDecipheriv, randomBytes } = crypto;

// Ключ шифрования должен быть 32-байтной (256-битной) hex-строкой (64 символа)
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY;
const IV_LENGTH = 16; // 16 байт (128 бит)

function encrypt(text) {
  if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error('WALLET_ENCRYPTION_KEY должен быть 32-байтной hex-строкой (64 символа).');
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
  if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
    throw new Error('WALLET_ENCRYPTION_KEY должен быть 32-байтной hex-строкой (64 символа).');
  }
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error("Неверный формат зашифрованного текста. Ожидается 'iv_hex:encrypted_hex'.");
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedContent = parts[1];
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
