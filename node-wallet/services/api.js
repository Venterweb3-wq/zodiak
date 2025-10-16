const express = require('express');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { generateWallet } = require('./api_service');

const app = express();
const PORT = process.env.PORT || 3001;
const API_TOKEN = process.env.NODE_WALLET_INTERNAL_API_TOKEN;

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10, // 10 запросов в минуту
  message: { error: 'Too many requests, please try again later.' },
});

// Middleware
app.use(bodyParser.json());
app.use(limiter);

// Схема валидации
const walletSchema = Joi.object({
  network: Joi.string().valid('ARBITRUM', 'TRC20', 'BEP20').required(),
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// Generate wallet endpoint
app.post('/generate_wallet', async (req, res) => {
  try {
    // Проверка авторизации
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${API_TOKEN}`) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Валидация входных данных
    const { error, value } = walletSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await generateWallet(value.network);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Wallet generation failed:', err.message);
    return res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`🟢 Wallet API listening on port ${PORT}`);
});
