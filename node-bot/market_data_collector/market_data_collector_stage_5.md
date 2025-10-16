# 🧠 Этап 5 — Переработка логики `market_data_collector`

## 📌 Цель

Создать актуальный и стабильный сборщик рыночных данных, который:

- Загружает фильтры из Django (PostgreSQL)
- Использует CoinMarketCap для получения и фильтрации списка монет
- Делает 6 ключевых запросов к CoinGlass по каждой монете
- Обновляет коллекцию MongoDB `coin_market_data`
- Учитывает лимит 30 запросов в минуту (1800/ч)
- Использует остаток лимита на `pairs-markets` и другие вспомогательные метрики
- Готов к масштабированию и интеграции в основной Smart Money сервис

---

## 🗂 Источники данных

### CoinMarketCap

**Эндпоинт:** `getLatestListings` (до 5000 монет)

Фильтрация по условиям:
- `volume_24h ≥ 30M`
- `market_cap ≥ 300M`
- `num_market_pairs ≥ 20`
- `percent_change_7d ≤ ±30%`
- `date_added ≥ 90 дней назад`
- `tags` не содержат: `"memes", "gambling", "ai"`
- `slug` не входит в blacklist
- `cmc_rank ≤ 150`
- `num_exchanges ≥ 5`
- `is_active == true`

Фильтры загружаются с API Django: `/api/smc/cmc-filters/active/`необходимо проверить 

---

### CoinGlass (на каждую монету)

| Эндпоинт                                                       | Описание                                            | Время запроса            |
|----------------------------------------------------------------|-----------------------------------------------------|---------------------------|
| `/api/futures/pairs-markets`                                   | Общие метрики по парам                              | Один раз, либо из остатка |
| `/api/futures/funding-rate/vol-weight-history`                | История взвешенной ставки фандинга (30 дней)        | По `last_updated`         |
| `/api/futures/open-interest/aggregated-history`               | История открытого интереса (OHLC, 30 дней)          | По `last_updated`         |
| `/api/futures/liquidation/history`                            | Ликвидации за 24 часа                               | Каждый цикл               |
| `/api/futures/taker-buy-sell-volume/exchange-list`           | Объёмы тейкеров за 4 часа                           | Каждый цикл               |
| `/api/price/ohlc-history`                                     | Исторические цены (OHLC)                            | По `last_updated`         |

---

## ✅ Требования

- [x] Загрузка фильтров из Django API
- [x] Фильтрация до 5000 монет по CMC
- [x] Запросы к CoinGlass по каждому symbol
- [x] Обработка ошибок и пропуск некорректных монет
- [x] Обновление документов в `coin_market_data`
- [x] Использование MongoDB
- [x] Уважение лимитов API
- [x] Очередь запросов
- [x] Автозавершение
- [x] `.env` конфигурация

---

## 🔁 Очередь и лимиты

- Максимум: 30 запросов в минуту = 1800/ч
- 250 монет × 6 эндпоинтов = 1500 запросов
- Остаток: 300 запросов на `pairs-markets` и аналитику

```js
const BATCH_SIZE = 5; // 5 монет × 6 запросов = 30 запросов/мин

for (let i = 0; i < coins.length; i += BATCH_SIZE) {
  const batch = coins.slice(i, i + BATCH_SIZE);

  for (const coin of batch) {
    try {
      await fetchAllEndpoints(coin);
      await sleep(500);
    } catch (err) {
      console.error(`[Ошибка] ${coin.symbol}: ${err.message}`);
    }
  }

  console.log(`✅ Batch ${i / BATCH_SIZE + 1} завершён`);
  await sleep(60_000); // ожидание 60 сек
}
```

---

## 🔍 Параметры вызовов

### 1. `/api/futures/pairs-markets`
- symbol: `BTC`
- Используется 1 раз (либо периодически из остатка)

### 2. `/api/futures/funding-rate/vol-weight-history`
- interval: `'1d'`
- `start_time`: now - 30d (первый запуск)
- затем: `last_updated + 1d`

### 3. `/api/futures/open-interest/aggregated-history`
- symbol: `BTCUSDT`
- unit: `'usd'`
- interval: `'1d'`
- аналогично funding rate

### 4. `/api/futures/liquidation/history`
- всегда за последние 24 часа

### 5. `/api/futures/taker-buy-sell-volume/exchange-list`
- последние 4 часа

### 6. `/api/price/ohlc-history`
- аналогично funding rate

---

## 🗄 MongoDB: `coin_market_data`

### Структура документа:

```json
{
  "symbol": "BTC",
  "symbol_pair": "BTCUSDT",
  "data": {
    "pairs_markets": {...},
    "funding_rate_vol_weight": [...],
    "open_interest_aggregated": [...],
    "liquidation": {...},
    "taker_volume": {...},
    "price_ohlc": [...]
  },
  "timestamps": {
    "funding_rate_vol_weight": "2025-06-23T12:00:00Z",
    "open_interest_aggregated": "2025-06-23T12:00:00Z",
    "price_ohlc": "2025-06-23T12:00:00Z"
  }
}
```

---

## 🔄 Обновления по времени (last_updated)

| Метрика                    | Способ обновления                        |
|---------------------------|------------------------------------------|
| `funding_rate_vol_weight` | По `timestamps.funding_rate_vol_weight` |
| `open_interest_aggregated`| По `timestamps.open_interest_aggregated`|
| `price_ohlc`              | По `timestamps.price_ohlc`              |
| `liquidation`             | Обновляется всегда                       |
| `taker_volume`            | Обновляется всегда                       |
| `pairs_markets`           | По расписанию или вручную                |

---

## 💡 Дополнительно

Ты можешь добавлять данные из других источников, просто расширяя поле `data`. Например:

```json
"data": {
  ...
  "defillama_tvl": {...},
  "glassnode_metrics": {...}
}
```

И добавлять метки времени аналогично в `"timestamps"`.
