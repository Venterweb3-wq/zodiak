# Smart Money Service - Logic Overview

This document outlines the operational logic of the `smart_money_service`, a cyclical analysis engine designed to identify and act on market anomalies.

The service's architecture is built on a clear separation of concerns: it does not perform initial data gathering but instead operates on a pre-filtered, comprehensive market snapshot prepared by the `market_data_collector` service. Its sole purpose is to find anomalies within this curated dataset, conduct a deep-dive analysis, and generate actionable trading signals.

The entire process is orchestrated by the `analysisCycle` function within `index.js` and is broken down into the following sequential steps:

---

### Step 1: Market Consensus Scan (`pairs_scanner.js`)

This is the core of the system, designed to identify coins with a strong, market-wide consensus behind their anomalous behavior.

1.  **Database Read**: The scanner's first and only data-sourcing action is to query the MongoDB database, fetching all documents from the `market_overviews` collection.
2.  **Coin-Level Aggregation**: Instead of treating each exchange pair as an independent entity, the scanner performs an intelligent aggregation for each coin (e.g., LTC) to create a single, holistic "portrait" of its market sentiment.
3.  **Hot Coin Identification**: A scoring logic (`MIN_HOT_SCORE`) is applied to this aggregated portrait. A coin is flagged as "hot" only if its combined, market-wide metrics meet the strict criteria for an anomaly.
4.  **Champion Pair Selection**: If a coin is deemed hot, the scanner identifies its single most liquid pair (the one with the highest open interest) to act as its representative in the next stage.
5.  **Output**: The scanner produces a short but highly qualified list of pairs. Each pair is a "champion" representing a genuinely hot coin backed by a strong market consensus.

---
### Deeper Dive: Scoring and Aggregation

#### Scoring Logic (`MIN_HOT_SCORE`)

The "hotness" of a coin is determined by a simple scoring system. The `MIN_HOT_SCORE` (defined in the configuration) is the threshold a coin must meet or exceed to be considered for analysis.

The score is calculated by checking the aggregated metrics against predefined thresholds. For each criterion the coin meets, its score increases by 1.

*   **Criterion 1: Funding Rate**: `Math.abs(coin.weighted_avg_funding_rate) >= MIN_ABS_FUNDING_RATE`
*   **Criterion 2: Open Interest Change**: `Math.abs(coin.weighted_avg_oi_change_24h) >= MIN_ABS_OI_CHANGE_PERCENT_24H`
*   **Criterion 3: Liquidations**: `coin.total_long_liq_24h > MIN_LIQUIDATION_USD_24H || coin.total_short_liq_24h > MIN_LIQUIDATION_USD_24H`

**Example**: If `MIN_HOT_SCORE` is `3`, a coin must meet **all three** criteria to be considered hot. If it's `1`, meeting **any single criterion** is sufficient.

#### Example of an Aggregated Coin Profile

After aggregation in `pairs_scanner.js`, a coin object passed to the scoring function looks like this:

```json
{
  "symbol": "LTC",
  "total_open_interest_usd": 539959708.85,
  "weighted_avg_funding_rate": 0.00015,
  "weighted_avg_oi_change_24h": 3.54,
  "total_long_liq_24h": 99773.01,
  "total_short_liq_24h": 131178.49,
  "hot_score": 0,
  "all_pairs": [ /* Array of original pair data from all exchanges */ ]
}
```

---

### Step 2: Deep-Dive Data Collection (`data_collector.js`)

This module receives the "champion pairs" list and executes targeted, granular API calls to CoinGlass specifically for these pairs to fetch additional data needed for analysis.

### Step 3: Analytical Engine (`analytics_engine.js`)

The "brain" of the service. It applies a suite of algorithms to the enriched pairs to search for specific, predefined patterns (e.g., Price/OI Divergence, Liquidation Absorption).

### Step 4: Signal Generation (`signal_generator.js`)

This module translates identified patterns into concrete LONG or SHORT trading signals, each with a confidence score.

---
### Deeper Dive: Signal Structure & Notification

#### Example of a Generated Signal Object

Before being sent, a signal is structured as a JSON object:
```json
{
  "symbol": "LTC",
  "exchange": "Binance",
  "type": "LONG",
  "confidence": 0.75,
  "patterns": [
    "LIQUIDITY_ABSORPTION_DETECTED",
    "POSITIVE_FUNDING_RATE"
  ],
  "details": [
    "Liquidation absorption: Strong buy-side pressure absorbed $1.2M in short liquidations.",
    "Funding rate is positive, indicating bullish sentiment."
  ]
}
```
#### Telegram Notification

The `notifier.js` module formats this object into a human-readable message for Telegram:

> **New Signal: LONG LTC/USDT (Binance)**
> **Confidence:** 75%
>
> **Detected Patterns:**
> • LIQUIDITY_ABSORPTION_DETECTED
> • POSITIVE_FUNDING_RATE
>
> **Analysis:**
> - Liquidation absorption: Strong buy-side pressure absorbed $1.2M in short liquidations.
> - Funding rate is positive, indicating bullish sentiment.

---

### Step 5: State Management (`state_manager.js`)

The `state_manager` prevents duplicate alerts by checking if an identical signal has been sent recently. New, unique signals are saved to the database for historical analysis.

### Step 6: The Loop & Configuration

The service runs in a continuous loop, with the interval defined by `ANALYSIS_INTERVAL_MINUTES` in the configuration.

#### Centralized Configuration

**Crucially, the entire behavior of the service is controlled via a centralized configuration stored in MongoDB.** This configuration can be updated in real-time through a **Django admin panel**, without needing to restart the bot. This includes:
*   `ANALYSIS_INTERVAL_MINUTES`: The delay between analysis cycles.
*   `HOT_PAIRS_LIMIT`: The maximum number of hot pairs to analyze in detail.
*   `HOT_PAIRS_CRITERIA`: All thresholds for scoring, including `MIN_HOT_SCORE`.
*   `ANALYTICS_THRESHOLDS`: All parameters used by the analytical engine to detect patterns. 