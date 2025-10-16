"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'coinglass-api/3.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Check the supported coins in this API documentation
     *
     * @summary Supported Coins
     */
    SDK.prototype.coins = function () {
        return this.core.fetch('/api/futures/supported-coins', 'get');
    };
    /**
     * Check the supported exchange and trading pairs in the API documentation
     *
     * @summary Suported Exchange and Pairs
     */
    SDK.prototype.instruments = function () {
        return this.core.fetch('/api/futures/supported-exchange-pairs', 'get');
    };
    /**
     * This API retrieves liquidation data for all coins on the exchange
     *
     * @summary Liquidation Coin List
     * @throws FetchError<400, types.LiquidationCoinListResponse400> 400
     */
    SDK.prototype.liquidationCoinList = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/coin-list', 'get', metadata);
    };
    /**
     * This API retrieves liquidation data for coins across all exchanges
     *
     * @summary Liquidation Exchange List
     * @throws FetchError<400, types.LiquidationExchangeListResponse400> 400
     */
    SDK.prototype.liquidationExchangeList = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/exchange-list', 'get', metadata);
    };
    /**
     * This API retrieves liquidation orders within the past 7 days, including details about
     * the specific exchange, trading pairs, and liquidation amounts
     *
     * @summary Liquidation Order
     * @throws FetchError<400, types.LiquidationOrderResponse400> 400
     */
    SDK.prototype.liquidationOrder = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/order', 'get', metadata);
    };
    /**
     * This API presents and maps liquidation events based on market data and diverse leverage
     * amounts
     *
     * @summary Liquidation Map
     * @throws FetchError<400, types.LiquidationMapResponse400> 400
     */
    SDK.prototype.liquidationMap = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/map', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell History
     * @throws FetchError<400, types.AggregatedTakerBuysellVolumeRatioResponse400> 400
     */
    SDK.prototype.aggregatedTakerBuysellVolumeRatio = function (metadata) {
        return this.core.fetch('/api/futures/aggregatedTakerBuySellVolumeRatio/history', 'get', metadata);
    };
    /**
     * This API retrieves whale positions on Hyperliquid with a value over $1M.
     *
     * @summary Hyperliquid Whale Position
     * @throws FetchError<400, types.HyperliquidWhalePositionResponse400> 400
     */
    SDK.prototype.hyperliquidWhalePosition = function () {
        return this.core.fetch('/api/hyperliquid/whale-position', 'get');
    };
    /**
     * This API retrieves real-time whale alerts on Hyperliquid, and position value over $1M.
     *
     * @summary Hyperliquid Whale Alert
     * @throws FetchError<400, types.HyperliquidWhaleAlertResponse400> 400
     */
    SDK.prototype.hyperliquidWhaleAlert = function () {
        return this.core.fetch('/api/hyperliquid/whale-alert', 'get');
    };
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Coins Markets
     * @throws FetchError<400, types.CoinsMarketsResponse400> 400
     */
    SDK.prototype.coinsMarkets = function (metadata) {
        return this.core.fetch('/api/futures/coins-markets', 'get', metadata);
    };
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Pairs Markets
     * @throws FetchError<400, types.PairsMarketsResponse400> 400
     */
    SDK.prototype.pairsMarkets = function (metadata) {
        return this.core.fetch('/api/futures/pairs-markets', 'get', metadata);
    };
    /**
     * This API retrieves information about price change percentages and price amplitude
     * percentages for all coins.
     *
     * @summary Coins Price Change
     * @throws FetchError<400, types.CoinsPriceChangeResponse400> 400
     */
    SDK.prototype.coinsPriceChange = function () {
        return this.core.fetch('/api/futures/coins-price-change', 'get');
    };
    /**
     * The API retrieves Relative Strength Index (RSI) values for multiple cryptocurrencies
     * over different timeframes
     *
     * @summary RSI List
     * @throws FetchError<400, types.FuturesRsiListResponse400> 400
     */
    SDK.prototype.futuresRsiList = function () {
        return this.core.fetch('/api/futures/rsi/list', 'get');
    };
    /**
     * Check the supported coins in this API documentation
     *
     * @summary Supported Coins
     * @throws FetchError<400, types.SpotSupportedCoinsResponse400> 400
     */
    SDK.prototype.spotSupportedCoins = function () {
        return this.core.fetch('/api/spot/supported-coins', 'get');
    };
    /**
     * Check the supported exchange and trading pairs in the API documentation
     *
     * @summary Suported Exchange and Pairs
     * @throws FetchError<400, types.SpotSuportedExchangePairsResponse400> 400
     */
    SDK.prototype.spotSuportedExchangePairs = function () {
        return this.core.fetch('/api/spot/supported-exchange-pairs', 'get');
    };
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Coins Markets
     * @throws FetchError<400, types.SpotCoinsMarketsResponse400> 400
     */
    SDK.prototype.spotCoinsMarkets = function (metadata) {
        return this.core.fetch('/api/spot/coins-markets', 'get', metadata);
    };
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Pairs Markets
     * @throws FetchError<400, types.SpotPairsMarketsResponse400> 400
     */
    SDK.prototype.spotPairsMarkets = function (metadata) {
        return this.core.fetch('/api/spot/pairs-markets', 'get', metadata);
    };
    /**
     * This API retrieves the Coinbase Bitcoin Premium Index, indicating the price difference
     * between Bitcoin on Coinbase Pro and Binance
     *
     * @summary Coinbase Premium Index
     * @throws FetchError<400, types.CoinbasePremiumIndexResponse400> 400
     */
    SDK.prototype.coinbasePremiumIndex = function (metadata) {
        return this.core.fetch('/api/coinbase-premium-index', 'get', metadata);
    };
    /**
     * This API retrieves data on margin long and short positions from Bitfinex.
     *
     * @summary Bitfinex Margin Long/Short
     * @throws FetchError<400, types.BitfinexMarginLongShortResponse400> 400
     */
    SDK.prototype.bitfinexMarginLongShort = function (metadata) {
        return this.core.fetch('/api/bitfinex-margin-long-short', 'get', metadata);
    };
    /**
     * The API retrieves on-chain transfer records for exchanges.
     *
     * @summary Exchange On-chain Transfers (ERC-20)
     * @throws FetchError<400, types.ExchangeOnchainTransfersResponse400> 400
     */
    SDK.prototype.exchangeOnchainTransfers = function (metadata) {
        return this.core.fetch('/api/exchange/chain/tx/list', 'get', metadata);
    };
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OpenInterest OHLC History
     * @throws FetchError<400, types.EnterpriseOpeninterestOhlcHistoryResponse400> 400
     */
    SDK.prototype.enterpriseOpeninterestOhlcHistory = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/openInterest/ohlc-history', 'get', metadata);
    };
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary FundingRate OHLC History
     * @throws FetchError<400, types.EnterpriseFundingrateOhlcHistoryResponse400> 400
     */
    SDK.prototype.enterpriseFundingrateOhlcHistory = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/fundingRate/ohlc-history', 'get', metadata);
    };
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary Liquidation History
     * @throws FetchError<400, types.EnterpriseLiquidationHistoryResponse400> 400
     */
    SDK.prototype.enterpriseLiquidationHistory = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/v3/aggregated-history', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap(Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapResponse400> 400
     */
    SDK.prototype.enterpriseLiquidationHeatmap = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/heatmap', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap(Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapResponse400> 400
     */
    SDK.prototype.enterpriseLiquidationAggregatedHeatmap = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/aggregate-heatmap', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart, calculated from market data and
     * various leverage amounts.
     *
     * @summary Liquidation Heatmap Model2 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapModel2Response400> 400
     */
    SDK.prototype.enterpriseLiquidationHeatmapModel2 = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/model2/heatmap', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart, calculated from market data and
     * various leverage amounts.
     *
     * @summary Liquidation Heatmap Model3 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapModel3Response400> 400
     */
    SDK.prototype.enterpriseLiquidationHeatmapModel3 = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/model3/heatmap', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model2 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapModel2Response400> 400
     */
    SDK.prototype.enterpriseLiquidationAggregatedHeatmapModel2 = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/model2/aggregate-heatmap', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model3 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapModel3Response400> 400
     */
    SDK.prototype.enterpriseLiquidationAggregatedHeatmapModel3 = function (metadata) {
        return this.core.fetch('/api/enterprise/futures/liquidation/model3/aggregated-heatmap', 'get', metadata);
    };
    /**
     * Bull Market Peak Indicators
     *
     * @throws FetchError<400, types.BullMarketPeakIndicatorResponse400> 400
     */
    SDK.prototype.bullMarketPeakIndicator = function () {
        return this.core.fetch('/api/bull-market-peak-indicator', 'get');
    };
    /**
     * AHR999
     *
     * @throws FetchError<400, types.Ahr999Response400> 400
     */
    SDK.prototype.ahr999 = function () {
        return this.core.fetch('/api/index/ahr999', 'get');
    };
    /**
     * Puell-Multiple
     *
     * @throws FetchError<400, types.PuellMultipleResponse400> 400
     */
    SDK.prototype.puellMultiple = function () {
        return this.core.fetch('/api/index/puell-multiple', 'get');
    };
    /**
     * Stock-to-Flow Model
     *
     * @throws FetchError<400, types.StockFlowResponse400> 400
     */
    SDK.prototype.stockFlow = function () {
        return this.core.fetch('/api/index/stock-flow', 'get');
    };
    /**
     * Golden-Ratio-Multiplier
     *
     * @throws FetchError<400, types.GoldenRatioMultiplierResponse400> 400
     */
    SDK.prototype.goldenRatioMultiplier = function () {
        return this.core.fetch('/api/index/golden-ratio-multiplier', 'get');
    };
    /**
     * Crypto Fear & Greed Index
     *
     * @throws FetchError<400, types.CryptofearGreedindexResponse400> 400
     */
    SDK.prototype.cryptofearGreedindex = function () {
        return this.core.fetch('/api/index/fear-greed-history', 'get');
    };
    /**
     * StableCoin MarketCap History
     *
     * @throws FetchError<400, types.StablecoinMarketcapHistoryResponse400> 400
     */
    SDK.prototype.stablecoinMarketcapHistory = function () {
        return this.core.fetch('/api/index/stableCoin-marketCap-history', 'get');
    };
    /**
     * The API retrieves a list of holdings managed by Grayscale Investments.
     *
     * @summary Holdings List
     * @throws FetchError<400, types.GrayscaleHoldingListResponse400> 400
     */
    SDK.prototype.grayscaleHoldingList = function () {
        return this.core.fetch('/api/grayscale/holdings-list', 'get');
    };
    /**
     * The API retrieves historical premium/discount data for Grayscale Investment Trusts
     * relative to their NAV.
     *
     * @summary Premium History
     * @throws FetchError<400, types.GrayscalePremiumHistoryResponse400> 400
     */
    SDK.prototype.grayscalePremiumHistory = function (metadata) {
        return this.core.fetch('/api/grayscale/premium-history', 'get', metadata);
    };
    /**
     * Exchange Balance Chart
     *
     * @throws FetchError<400, types.ExchangeBalanceChartResponse400> 400
     */
    SDK.prototype.exchangeBalanceChart = function (metadata) {
        return this.core.fetch('/api/exchange/balance/chart', 'get', metadata);
    };
    /**
     * Option Max Pain
     *
     * @throws FetchError<400, types.OptionMaxPainResponse400> 400
     */
    SDK.prototype.optionMaxPain = function (metadata) {
        return this.core.fetch('/api/option/max-pain', 'get', metadata);
    };
    /**
     * Info
     *
     * @throws FetchError<400, types.InfoResponse400> 400
     */
    SDK.prototype.info = function (metadata) {
        return this.core.fetch('/api/option/info', 'get', metadata);
    };
    /**
     * Exchange Volume History
     *
     * @throws FetchError<400, types.ExchangeVolumeHistoryResponse400> 400
     */
    SDK.prototype.exchangeVolumeHistory = function (metadata) {
        return this.core.fetch('/api/option/exchange-vol-history', 'get', metadata);
    };
    /**
     * 大额成交
     *
     * @throws FetchError<400, types.LargeOrderResponse400> 400
     */
    SDK.prototype.largeOrder = function (metadata) {
        return this.core.fetch('/api/large-orders', 'get', metadata);
    };
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary 当前未完成大额委托
     * @throws FetchError<400, types.LargeOrderbookCopy2Response400> 400
     */
    SDK.prototype.largeOrderbookCopy2 = function (metadata) {
        return this.core.fetch('/api/orderbook/large-limit-order-', 'get', metadata);
    };
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary 大额委托历史
     * @throws FetchError<400, types.LargeLimitOrderHistory2Response400> 400
     */
    SDK.prototype.largeLimitOrderHistory2 = function (metadata) {
        return this.core.fetch('/api/orderbook/large-limit-order-history-', 'get', metadata);
    };
    SDK.prototype.get_apifuturesbasishistory = function (metadata) {
        return this.core.fetch('/api/futures/basis/history', 'get', metadata);
    };
    SDK.prototype.get_apiexchangeassets = function (metadata) {
        return this.core.fetch('/api/exchange/assets', 'get', metadata);
    };
    /**
     * This API presents aggregated open interest data using OHLC (Open, High, Low, Close)
     * candlestick charts.
     *
     * @summary OHLC Aggregated History
     * @throws FetchError<400, types.OiOhlcAggregatedHistoryResponse400> 400
     */
    SDK.prototype.oiOhlcAggregatedHistory = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/aggregated-history', 'get', metadata);
    };
    /**
     * This API retrieves historical open interest data for a cryptocurrency from exchanges,
     * and the data is formatted for chart presentation.
     *
     * @summary Exchange History Chart
     * @throws FetchError<400, types.OiExchangeHistoryChartResponse400> 400
     */
    SDK.prototype.oiExchangeHistoryChart = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/exchange-history-chart', 'get', metadata);
    };
    /**
     * This API presents funding rate data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OHLC History
     * @throws FetchError<400, types.FrOhlcHistroyResponse400> 400
     */
    SDK.prototype.frOhlcHistroy = function (metadata) {
        return this.core.fetch('/api/futures/funding-rate/history', 'get', metadata);
    };
    /**
     * This API presents open interest-weight data through OHLC (Open, High, Low, Close)
     * candlestick charts.
     *
     * @summary OI Weight OHLC History
     * @throws FetchError<400, types.OiWeightOhlcHistoryResponse400> 400
     */
    SDK.prototype.oiWeightOhlcHistory = function (metadata) {
        return this.core.fetch('/api/futures/funding-rate/oi-weight-history', 'get', metadata);
    };
    /**
     * This API presents volume-weight data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary Vol Weight OHLC History
     * @throws FetchError<400, types.VolWeightOhlcHistoryResponse400> 400
     */
    SDK.prototype.volWeightOhlcHistory = function (metadata) {
        return this.core.fetch('/api/futures/funding-rate/vol-weight-history', 'get', metadata);
    };
    /**
     * Arbitrage
     *
     * @throws FetchError<400, types.FrArbitrageResponse400> 400
     */
    SDK.prototype.frArbitrage = function (metadata) {
        return this.core.fetch('/api/futures/funding-rate/arbitrage', 'get', metadata);
    };
    /**
     * This API retrieves the long/short account ratio for trading pairs on an exchange
     *
     * @summary Global Account Ratio
     * @throws FetchError<400, types.GlobalLongshortAccountRatioResponse400> 400
     */
    SDK.prototype.globalLongshortAccountRatio = function (metadata) {
        return this.core.fetch('/api/futures/global-long-short-account-ratio/history', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of top accounts.
     *
     * @summary Top Account Ratio History
     * @throws FetchError<400, types.TopLongshortAccountRatioResponse400> 400
     */
    SDK.prototype.topLongshortAccountRatio = function (metadata) {
        return this.core.fetch('/api/futures/top-long-short-account-ratio/history', 'get', metadata);
    };
    /**
     * This API retrieves the long/short ratio of aggregated taker buy/sell volumes for
     * exchanges.
     *
     * @summary Exchange Taker Buy/Sell Ratio
     * @throws FetchError<400, types.TakerBuysellVolumeExchangeListResponse400> 400
     */
    SDK.prototype.takerBuysellVolumeExchangeList = function (metadata) {
        return this.core.fetch('/api/futures/taker-buy-sell-volume/exchange-list', 'get', metadata);
    };
    /**
     * This API retrieves aggregated historical data for both long and short liquidations of a
     * coin on the exchange
     *
     * @summary Liquidation Aggregated History
     * @throws FetchError<400, types.AggregatedLiquidationHistoryResponse400> 400
     */
    SDK.prototype.aggregatedLiquidationHistory = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/aggregated-history', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap
     * @throws FetchError<400, types.LiquidationAggregateHeatmapResponse400> 400
     */
    SDK.prototype.liquidationAggregateHeatmap = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/aggregated-heatmap/model1', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model2
     * @throws FetchError<400, types.LiquidationAggregateHeatmapModel2Response400> 400
     */
    SDK.prototype.liquidationAggregateHeatmapModel2 = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/aggregated-heatmap/model2', 'get', metadata);
    };
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model3
     * @throws FetchError<400, types.LiquidationAggregatedHeatmapModel3Response400> 400
     */
    SDK.prototype.liquidationAggregatedHeatmapModel3 = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/aggregated-heatmap/model3', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap
     * @throws FetchError<400, types.LiquidationHeatmapResponse400> 400
     */
    SDK.prototype.liquidationHeatmap = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/heatmap/model1', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap Model3
     * @throws FetchError<400, types.LiquidationHeatmapModel3Response400> 400
     */
    SDK.prototype.liquidationHeatmapModel3 = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/heatmap/model3', 'get', metadata);
    };
    /**
     * This API presents and maps liquidation events based on market data and diverse leverage
     * amounts
     *
     * @summary Liquidation Aggregated Map
     * @throws FetchError<400, types.LiquidationAggregatedMapResponse400> 400
     */
    SDK.prototype.liquidationAggregatedMap = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/aggregated-map', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of taker buy/sell volumes.
     *
     * @summary Taker Buy/Sell Ratio History
     * @throws FetchError<400, types.TakerBuysellVolumeResponse400> 400
     */
    SDK.prototype.takerBuysellVolume = function (metadata) {
        return this.core.fetch('/api/futures/taker-buy-sell-volume/history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the order book for futures
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.FuturesOrderbookHistoryResponse400> 400
     */
    SDK.prototype.futuresOrderbookHistory = function (metadata) {
        return this.core.fetch('/api/futures/orderbook/ask-bids-history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the aggregated order book for futures
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Aggregated Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.FuturesAggregatedOrderbookHistoryResponse400> 400
     */
    SDK.prototype.futuresAggregatedOrderbookHistory = function (metadata) {
        return this.core.fetch('/api/futures/orderbook/aggregated-ask-bids-history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the order book for futures trading.
     *
     * @summary Orderbook Heatmap
     */
    SDK.prototype.orderbookHeatmap = function (metadata) {
        return this.core.fetch('/api/futures/orderbook/history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the open, high, low, and close (OHLC) prices for
     * cryptocurrencies.
     *
     * @summary Price OHLC History
     */
    SDK.prototype.priceOhlcHistory = function (metadata) {
        return this.core.fetch('/api/futures/price/history', 'get', metadata);
    };
    SDK.prototype.get_apispotpricehistory = function (metadata) {
        return this.core.fetch('/api/spot/price/history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the aggregated order book for spot
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Aggregated OrderBook Bid&Ask(±range)
     * @throws FetchError<400, types.SpotAggregatedHistoryResponse400> 400
     */
    SDK.prototype.spotAggregatedHistory = function (metadata) {
        return this.core.fetch('/api/spot/orderbook/aggregated-ask-bids-history', 'get', metadata);
    };
    /**
     * The API retrieves historical data of the order book for spot trading.
     * (https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.SpotOrderbookHistoryResponse400> 400
     */
    SDK.prototype.spotOrderbookHistory = function (metadata) {
        return this.core.fetch('/api/spot/orderbook/ask-bids-history', 'get', metadata);
    };
    SDK.prototype.get_apispotorderbookhistory = function (metadata) {
        return this.core.fetch('/api/spot/orderbook/history', 'get', metadata);
    };
    SDK.prototype.get_apispotorderbooklargeLimitOrder = function (metadata) {
        return this.core.fetch('/api/spot/orderbook/large-limit-order', 'get', metadata);
    };
    /**
     * The API retrieves completed historical large orders from the order book for futures
     * trading
     *
     * @summary Large Orderbook History
     */
    SDK.prototype.largeOrderbookHistory = function (metadata) {
        return this.core.fetch('/api/futures/orderbook/large-limit-order-history', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of taker buy/sell volumes.
     *
     * @summary Taker Buy/Sell History
     * @throws FetchError<400, types.SpotTakerBuysellRatioHistoryResponse400> 400
     */
    SDK.prototype.spotTakerBuysellRatioHistory = function (metadata) {
        return this.core.fetch('/api/spot/taker-buy-sell-volume/history', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell Volume History
     * @throws FetchError<400, types.AggregatedTakerBuysellVolumeHistoryResponse400> 400
     */
    SDK.prototype.aggregatedTakerBuysellVolumeHistory = function (metadata) {
        return this.core.fetch('/api/futures/aggregated-taker-buy-sell-volume/history', 'get', metadata);
    };
    /**
     * Exchange Open Interest History
     *
     * @throws FetchError<400, types.ExchangeOpenInterestHistoryResponse400> 400
     */
    SDK.prototype.exchangeOpenInterestHistory = function (metadata) {
        return this.core.fetch('/api/option/exchange-oi-history', 'get', metadata);
    };
    /**
     * Exchange Balance List
     *
     * @throws FetchError<400, types.ExchangeBalanceListResponse400> 400
     */
    SDK.prototype.exchangeBalanceList = function (metadata) {
        return this.core.fetch('/api/exchange/balance/list', 'get', metadata);
    };
    /**
     * This API retrieves the historical net assets data for ETFs (Exchange-Traded Funds)
     *
     * @summary ETF NetAssets History
     * @throws FetchError<400, types.EthereumEtfNetassetsHistoryResponse400> 400
     */
    SDK.prototype.ethereumEtfNetassetsHistory = function () {
        return this.core.fetch('/api/etf/ethereum/net-assets-history', 'get');
    };
    /**
     * This API retrieves a list of key status information regarding the historical premium or
     * discount fluctuations of ETFs.
     *
     * @summary ETF History
     * @throws FetchError<400, types.EtfHistoryResponse400> 400
     */
    SDK.prototype.etfHistory = function (metadata) {
        return this.core.fetch('/api/etf/bitcoin/history', 'get', metadata);
    };
    /**
     * Bitcoin-Rainbow-Chart
     *
     * @throws FetchError<400, types.BitcoinRainbowChartResponse400> 400
     */
    SDK.prototype.bitcoinRainbowChart = function () {
        return this.core.fetch('/api/index/bitcoin/rainbow-chart', 'get');
    };
    /**
     * Pi Cycle Top Indicator
     *
     * @throws FetchError<400, types.PiResponse400> 400
     */
    SDK.prototype.pi = function () {
        return this.core.fetch('/api/index/pi-cycle-indicator', 'get');
    };
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary Large Orderbook
     * @throws FetchError<400, types.LargeOrderbookResponse400> 400
     */
    SDK.prototype.largeOrderbook = function (metadata) {
        return this.core.fetch('/api/futures/orderbook/large-limit-order', 'get', metadata);
    };
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OHLC History
     * @throws FetchError<400, types.OiOhlcHistroyResponse400> 400
     */
    SDK.prototype.oiOhlcHistroy = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/history', 'get', metadata);
    };
    /**
     * This API presents aggregated coin margin open interest data using OHLC (Open, High, Low,
     * Close) candlestick charts.
     *
     * @summary OHLC Aggregated Coin Margin History
     * @throws FetchError<400, types.OiOhlcAggregatedCoinMarginHistoryResponse400> 400
     */
    SDK.prototype.oiOhlcAggregatedCoinMarginHistory = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/aggregated-coin-margin-history', 'get', metadata);
    };
    /**
     * This API retrieves open interest data for a coin from exchanges
     *
     * @summary Exchange List
     * @throws FetchError<400, types.OiExchangeListResponse400> 400
     */
    SDK.prototype.oiExchangeList = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/exchange-list', 'get', metadata);
    };
    /**
     * Tow Year Ma Multiplier
     *
     * @throws FetchError<400, types.TowYearMaMultiplierResponse400> 400
     */
    SDK.prototype.towYearMaMultiplier = function () {
        return this.core.fetch('/api/index/2-year-ma-multiplier', 'get');
    };
    /**
     * The API retrieves borrowing interest rates for cryptocurrencies.
     *
     * @summary Borrow Interest Rate
     * @throws FetchError<400, types.BorrowInterestRateResponse400> 400
     */
    SDK.prototype.borrowInterestRate = function (metadata) {
        return this.core.fetch('/api/borrow-interest-rate/history', 'get', metadata);
    };
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary ETF Flows History
     * @throws FetchError<400, types.EthereumEtfFlowsHistoryResponse400> 400
     */
    SDK.prototype.ethereumEtfFlowsHistory = function () {
        return this.core.fetch('/api/etf/ethereum/flow-history', 'get');
    };
    /**
     * This API retrieves a list of key status information for Ethereum Exchange-Traded Funds
     * (ETFs).
     *
     * @summary Ethereum ETF List
     * @throws FetchError<400, types.EthereumEtfListResponse400> 400
     */
    SDK.prototype.ethereumEtfList = function () {
        return this.core.fetch('/api/etf/ethereum/list', 'get');
    };
    /**
     * This API retrieves detailed information on an ETF.
     *
     * @summary ETF Detail
     * @throws FetchError<400, types.EtfDetailResponse400> 400
     */
    SDK.prototype.etfDetail = function (metadata) {
        return this.core.fetch('/api/etf/bitcoin/detail', 'get', metadata);
    };
    /**
     * This API retrieves historical price data for ETFs, including open, high, low, and close
     * (OHLC) prices.
     *
     * @summary ETF Price History
     * @throws FetchError<400, types.EtfPriceOhlcHistoryResponse400> 400
     */
    SDK.prototype.etfPriceOhlcHistory = function (metadata) {
        return this.core.fetch('/api/etf/bitcoin/price/history', 'get', metadata);
    };
    /**
     * This API retrieves a list of key status information regarding the historical premium or
     * discount fluctuations of ETFs.
     *
     * @summary ETF Premium/Discount History
     * @throws FetchError<400, types.BitcoinEtfPremiumDiscountHistoryResponse400> 400
     */
    SDK.prototype.bitcoinEtfPremiumDiscountHistory = function (metadata) {
        return this.core.fetch('/api/etf/bitcoin/premium-discount/history', 'get', metadata);
    };
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary ETF Flows History
     * @throws FetchError<400, types.EtfFlowsHistoryResponse400> 400
     */
    SDK.prototype.etfFlowsHistory = function () {
        return this.core.fetch('/api/etf/bitcoin/flow-history', 'get');
    };
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary Hong Kong ETF Flows History
     * @throws FetchError<400, types.HongKongBitcoinEtfFlowHistoryResponse400> 400
     */
    SDK.prototype.hongKongBitcoinEtfFlowHistory = function () {
        return this.core.fetch('/api/hk-etf/bitcoin/flow-history', 'get');
    };
    /**
     * This API retrieves a list of key status information for Bitcoin Exchange-Traded Funds
     * (ETFs).
     *
     * @summary Bitcoin ETF List
     * @throws FetchError<400, types.BitcoinEtfsResponse400> 400
     */
    SDK.prototype.bitcoinEtfs = function () {
        return this.core.fetch('/api/etf/bitcoin/list', 'get');
    };
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell History
     * @throws FetchError<400, types.SpotAggregatedTakerBuysellHistoryResponse400> 400
     */
    SDK.prototype.spotAggregatedTakerBuysellHistory = function (metadata) {
        return this.core.fetch('/api/spot/aggregated-taker-buy-sell-volume/history', 'get', metadata);
    };
    /**
     * This API retrieves historical data for the long/short ratio of positions by top
     * accounts.
     *
     * @summary Top Position Ratio History
     * @throws FetchError<400, types.TopLongshortPositionRatioResponse400> 400
     */
    SDK.prototype.topLongshortPositionRatio = function (metadata) {
        return this.core.fetch('/api/futures/top-long-short-position-ratio/history', 'get', metadata);
    };
    /**
     * This API retrieves historical data for both long and short liquidations of a trading
     * pair on the exchange
     *
     * @summary Liquidation History
     * @throws FetchError<400, types.LiquidationHistoryResponse400> 400
     */
    SDK.prototype.liquidationHistory = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/history', 'get', metadata);
    };
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap Model2
     * @throws FetchError<400, types.LiquidationHeatmapModel2Response400> 400
     */
    SDK.prototype.liquidationHeatmapModel2 = function (metadata) {
        return this.core.fetch('/api/futures/liquidation/heatmap/model2', 'get', metadata);
    };
    /**
     * This API retrieves the historical net assets data for ETFs (Exchange-Traded Funds)
     *
     * @summary ETF NetAssets History
     * @throws FetchError<400, types.BitcoinEtfNetassetsHistoryResponse400> 400
     */
    SDK.prototype.bitcoinEtfNetassetsHistory = function (metadata) {
        return this.core.fetch('/api/etf/bitcoin/net-assets/history', 'get', metadata);
    };
    /**
     * Bitcoin Profitable Days
     *
     * @throws FetchError<400, types.BitcoinProfitableDaysResponse400> 400
     */
    SDK.prototype.bitcoinProfitableDays = function () {
        return this.core.fetch('/api/index/bitcoin/profitable-days', 'get');
    };
    /**
     * 200-Week Moving Avg Heatmap
     *
     * @throws FetchError<400, types.TowHundredWeekMovingAvgHeatmapResponse400> 400
     */
    SDK.prototype.towHundredWeekMovingAvgHeatmap = function () {
        return this.core.fetch('/api/index/200-week-moving-average-heatmap', 'get');
    };
    /**
     * Bitcoin Bubble Index
     *
     * @throws FetchError<400, types.BitcoinBubbleIndexResponse400> 400
     */
    SDK.prototype.bitcoinBubbleIndex = function () {
        return this.core.fetch('/api/index/bitcoin/bubble-index', 'get');
    };
    /**
     * This API presents aggregated stablecoin margin open interest data using OHLC (Open,
     * High, Low, Close) candlestick charts.
     *
     * @summary OHLC Aggregated Stablecoin Margin History
     * @throws FetchError<400, types.OiOhlcAggregatedStablecoinMarginHistoryResponse400> 400
     */
    SDK.prototype.oiOhlcAggregatedStablecoinMarginHistory = function (metadata) {
        return this.core.fetch('/api/futures/open-interest/aggregated-stablecoin-history', 'get', metadata);
    };
    /**
     * This API retrieves funding rate data from exchanges
     *
     * @summary Exchange List
     * @throws FetchError<400, types.FrExchangeListResponse400> 400
     */
    SDK.prototype.frExchangeList = function () {
        return this.core.fetch('/api/futures/funding-rate/exchange-list', 'get');
    };
    /**
     * This API retrieves cumulative funding rate data from exchanges.
     *
     * @summary Cumulative Exchange List
     * @throws FetchError<400, types.CumulativeExchangeListResponse400> 400
     */
    SDK.prototype.cumulativeExchangeList = function (metadata) {
        return this.core.fetch('/api/futures/funding-rate/accumulated-exchange-list', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
