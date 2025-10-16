# Smart Money Engine v3.1

Продвинутая система анализа криптовалютного рынка на основе концепции Smart Money с интегрированными техническими индикаторами, прямой работой с данными и автоматической нормализацией.

## 🚀 Новые возможности v3.1

- **Прямая интеграция с market_data_collector**: Работа напрямую с коллекцией `coin_market_data`
- **Встроенные технические индикаторы**: RSI, EMA, Bollinger Bands, ATR, Volume MA
- **Автоматическая нормализация**: Данные обрабатываются автоматически при анализе
- **Улучшенная логика анализа**: Комбинация Smart Money + технических индикаторов
- **Адаптивные TP/SL**: Корректировка целей на основе волатильности (ATR)
- **Исключен smart_money_service**: Больше не требуется промежуточный сервис

## 📊 Технические индикаторы

### RSI (Relative Strength Index)
- **Период**: 14
- **Сигналы**: oversold (<30), overbought (>70), bullish (>60), bearish (<40)
- **Применение**: Определение силы рынка и точек разворота

### EMA (Exponential Moving Average)
- **Периоды**: 20 и 50
- **Тренды**: strong_uptrend, uptrend, sideways, downtrend, strong_downtrend
- **Применение**: Определение направления тренда

### Bollinger Bands
- **Период**: 20, отклонение: 2
- **Позиции**: above_upper, below_lower, upper_middle, lower_middle, middle
- **Применение**: Анализ волатильности и потенциальных пробоев

### ATR (Average True Range)
- **Период**: 14
- **Сигналы**: high_volatility (>5%), low_volatility (<1%), elevated_volatility (>3%)
- **Применение**: Корректировка TP/SL под текущую волатильность

### Volume MA (Moving Average на объёме)
- **Период**: 20
- **Сила**: very_strong (>2x), strong (>1.5x), above_average (>1.2x), normal, weak (<0.8x), very_weak (<0.5x)
- **Применение**: Подтверждение силы движения цены

## 🔧 Архитектура системы

```
market_data_collector → coin_market_data (MongoDB)
                              ↓
smart_money_engine → нормализация + технические индикаторы
                              ↓
coin_market_aggregated → анализ → signals → уведомления
```

## 📦 Установка

```bash
# Перейти в директорию
cd node-bot/smart_money_engine

# Установить зависимости (technicalindicators уже включен)
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл
```

## 🔧 Конфигурация

### Обязательные переменные окружения:

```env
MONGO_URI=mongodb://localhost:27017/smartmoney
REDIS_URL=redis://localhost:6379
DJANGO_API_URL=http://localhost:8000/api/smart-money-configs/

# Для уведомлений (опционально)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
DISCORD_WEBHOOK_URL=your_webhook_url
```

## 🎯 Использование

### Основной анализ:

```bash
# Запустить полный анализ с автоматической нормализацией
npm start

# Режим разработки с автоперезапуском
npm run dev
```

### Тестирование новой системы:

```bash
# Тестировать технические индикаторы и новую логику
node test_new_system.js

# Проверить миграцию от старого сервиса
node scripts/cleanup_old_service.js
```

### Мониторинг сигналов:

```bash
# Отслеживать активные сигналы в реальном времени
npm run signals:monitor
```

## 📊 Структура данных

### Коллекции MongoDB:

1. **coin_market_data** - Сырые данные от market_data_collector
2. **coin_market_aggregated** - Нормализованные данные с техническими индикаторами
3. **analysis_results** - Результаты анализа
4. **signals** - Торговые сигналы
5. **pricehistories** - Исторические цены

### Новая структура агрегированных данных:

```javascript
{
  symbol: "BTC",
  price: 106000,
  avg_funding_rate: 0.0001,
  sum_long_liquidations_usd: 50000000,
  sum_short_liquidations_usd: 20000000,
  avg_open_interest_usd: 600000000,
  technical_indicators: {
    rsi: 45.2,
    rsi_signal: "neutral",
    ema_20: 105500,
    ema_50: 104000,
    ema_trend: "uptrend",
    bb_upper: 107000,
    bb_lower: 103000,
    bb_position: "middle",
    atr: 2500,
    atr_signal: "normal",
    volume_ma: 1500000000,
    volume_strength: "strong",
    overall_signal: "bullish"
  }
}
```

## 📈 Улучшенная логика анализа

### Приоритет сигналов:

1. **Ликвидации** (основной драйвер) - 75% базовая уверенность
2. **Технические подтверждения** - до +25% уверенности
3. **Funding Rate** - вторичное подтверждение
4. **Open Interest** - фильтр качества
5. **Объём** - подтверждение силы

### Техническая интеграция:

```javascript
// Пример усиления сигнала:
if (liquidations_signal === 'buy' && rsi === 'oversold' && ema_trend === 'uptrend') {
  confidence += 0.25; // Максимальная уверенность
}

// Адаптивные TP/SL:
if (atr_signal === 'high_volatility') {
  tp_ratio *= 1.2; // Расширение целей
  sl_ratio *= 1.1; // Расширение стопов
}
```

### Чисто технические сигналы:

При отсутствии значительных ликвидаций система может генерировать сигналы на основе технических индикаторов:

```javascript
if (overall_signal === 'bullish' && 
    (rsi_signal === 'oversold' || bb_position === 'below_lower')) {
  recommendation = 'buy';
  confidence = 0.6;
}
```

## 🔔 Уведомления

### Расширенный формат уведомлений:

```
🟢 Новый сигнал: BUY BTC

💰 Цена входа: $106000
📊 Зона входа: $105500 - $106500
🎯 Take Profit: $109000 (скорректирован под волатильность)
🛑 Stop Loss: $104000

📈 Уверенность: 85%
🎯 Фаза рынка: bullish

💡 Обоснование:
💥 Перевес лонг-ликвидаций ($50M vs $20M)
📊 RSI oversold (28.5) — потенциал для отскока
✅ Восходящий тренд поддерживает лонг
📊 Сильный объем подтверждает сигнал

📊 Технические индикаторы:
  RSI: 28.5 (oversold)
  EMA Trend: uptrend
  Bollinger: below_lower
  ATR: normal volatility
  Volume: strong
```

## 🛠️ API Интеграции

### Источники данных:

1. **market_data_collector** → `coin_market_data`
   - CoinMarketCap (фильтрация монет)
   - Bybit (OHLCV данные для технических индикаторов)
   - CoinGlass (Smart Money метрики)

2. **smart_money_engine** → автоматическая обработка
   - Нормализация данных
   - Расчет технических индикаторов
   - Комплексный анализ
   - Генерация сигналов

## 🚨 Важные изменения

### Миграция от v3.0:

1. **Удален smart_money_service**: Нормализация теперь встроена
2. **Новый источник данных**: `coin_market_data` вместо `raw_coin_market_data`
3. **Технические индикаторы**: Встроены в процесс анализа
4. **Адаптивные параметры**: TP/SL корректируются под волатильность

### Команды миграции:

```bash
# Проверить статус миграции
node scripts/cleanup_old_service.js

# Тестировать новую систему
node test_new_system.js

# Создать резервную копию старых данных
mongodump --db smartmoney --collection raw_coin_market_data
```

## 🐛 Отладка

### Проверка технических индикаторов:
```bash
# Тестировать расчет индикаторов
node -e "
const { calculateTechnicalIndicators } = require('./utils/indicators');
const testData = [/* ваши OHLCV данные */];
console.log(calculateTechnicalIndicators(testData));
"
```

### Проверка нормализации:
```bash
# Проверить процесс нормализации
node -e "
const mongoose = require('mongoose');
const { normalizeMarketData } = require('./analysis_engine');
// Запустить тест нормализации
"
```

## 📝 Лицензия

ISC

## 🤝 Поддержка

При возникновении проблем:
1. Проверьте наличие данных в `coin_market_data`
2. Запустите `test_new_system.js` для диагностики
3. Используйте `cleanup_old_service.js` для миграции
4. Создайте issue в репозитории 