import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core';
declare class SDK {
    spec: Oas;
    core: APICore;
    constructor();
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config: ConfigOptions): void;
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
    auth(...values: string[] | number[]): this;
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
    server(url: string, variables?: {}): void;
    /**
     * Check the supported coins in this API documentation
     *
     * @summary Supported Coins
     */
    coins(): Promise<FetchResponse<200, types.CoinsResponse200>>;
    /**
     * Check the supported exchange and trading pairs in the API documentation
     *
     * @summary Suported Exchange and Pairs
     */
    instruments(): Promise<FetchResponse<200, types.InstrumentsResponse200>>;
    /**
     * This API retrieves liquidation data for all coins on the exchange
     *
     * @summary Liquidation Coin List
     * @throws FetchError<400, types.LiquidationCoinListResponse400> 400
     */
    liquidationCoinList(metadata: types.LiquidationCoinListMetadataParam): Promise<FetchResponse<200, types.LiquidationCoinListResponse200>>;
    /**
     * This API retrieves liquidation data for coins across all exchanges
     *
     * @summary Liquidation Exchange List
     * @throws FetchError<400, types.LiquidationExchangeListResponse400> 400
     */
    liquidationExchangeList(metadata: types.LiquidationExchangeListMetadataParam): Promise<FetchResponse<200, types.LiquidationExchangeListResponse200>>;
    /**
     * This API retrieves liquidation orders within the past 7 days, including details about
     * the specific exchange, trading pairs, and liquidation amounts
     *
     * @summary Liquidation Order
     * @throws FetchError<400, types.LiquidationOrderResponse400> 400
     */
    liquidationOrder(metadata: types.LiquidationOrderMetadataParam): Promise<FetchResponse<200, types.LiquidationOrderResponse200>>;
    /**
     * This API presents and maps liquidation events based on market data and diverse leverage
     * amounts
     *
     * @summary Liquidation Map
     * @throws FetchError<400, types.LiquidationMapResponse400> 400
     */
    liquidationMap(metadata: types.LiquidationMapMetadataParam): Promise<FetchResponse<200, types.LiquidationMapResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell History
     * @throws FetchError<400, types.AggregatedTakerBuysellVolumeRatioResponse400> 400
     */
    aggregatedTakerBuysellVolumeRatio(metadata: types.AggregatedTakerBuysellVolumeRatioMetadataParam): Promise<FetchResponse<200, types.AggregatedTakerBuysellVolumeRatioResponse200>>;
    /**
     * This API retrieves whale positions on Hyperliquid with a value over $1M.
     *
     * @summary Hyperliquid Whale Position
     * @throws FetchError<400, types.HyperliquidWhalePositionResponse400> 400
     */
    hyperliquidWhalePosition(): Promise<FetchResponse<200, types.HyperliquidWhalePositionResponse200>>;
    /**
     * This API retrieves real-time whale alerts on Hyperliquid, and position value over $1M.
     *
     * @summary Hyperliquid Whale Alert
     * @throws FetchError<400, types.HyperliquidWhaleAlertResponse400> 400
     */
    hyperliquidWhaleAlert(): Promise<FetchResponse<200, types.HyperliquidWhaleAlertResponse200>>;
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Coins Markets
     * @throws FetchError<400, types.CoinsMarketsResponse400> 400
     */
    coinsMarkets(metadata?: types.CoinsMarketsMetadataParam): Promise<FetchResponse<200, types.CoinsMarketsResponse200>>;
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Pairs Markets
     * @throws FetchError<400, types.PairsMarketsResponse400> 400
     */
    pairsMarkets(metadata: types.PairsMarketsMetadataParam): Promise<FetchResponse<200, types.PairsMarketsResponse200>>;
    /**
     * This API retrieves information about price change percentages and price amplitude
     * percentages for all coins.
     *
     * @summary Coins Price Change
     * @throws FetchError<400, types.CoinsPriceChangeResponse400> 400
     */
    coinsPriceChange(): Promise<FetchResponse<200, types.CoinsPriceChangeResponse200>>;
    /**
     * The API retrieves Relative Strength Index (RSI) values for multiple cryptocurrencies
     * over different timeframes
     *
     * @summary RSI List
     * @throws FetchError<400, types.FuturesRsiListResponse400> 400
     */
    futuresRsiList(): Promise<FetchResponse<200, types.FuturesRsiListResponse200>>;
    /**
     * Check the supported coins in this API documentation
     *
     * @summary Supported Coins
     * @throws FetchError<400, types.SpotSupportedCoinsResponse400> 400
     */
    spotSupportedCoins(): Promise<FetchResponse<200, types.SpotSupportedCoinsResponse200>>;
    /**
     * Check the supported exchange and trading pairs in the API documentation
     *
     * @summary Suported Exchange and Pairs
     * @throws FetchError<400, types.SpotSuportedExchangePairsResponse400> 400
     */
    spotSuportedExchangePairs(): Promise<FetchResponse<200, types.SpotSuportedExchangePairsResponse200>>;
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Coins Markets
     * @throws FetchError<400, types.SpotCoinsMarketsResponse400> 400
     */
    spotCoinsMarkets(metadata?: types.SpotCoinsMarketsMetadataParam): Promise<FetchResponse<200, types.SpotCoinsMarketsResponse200>>;
    /**
     * This API retrieves performance-related information for all available coins
     *
     * @summary Pairs Markets
     * @throws FetchError<400, types.SpotPairsMarketsResponse400> 400
     */
    spotPairsMarkets(metadata: types.SpotPairsMarketsMetadataParam): Promise<FetchResponse<200, types.SpotPairsMarketsResponse200>>;
    /**
     * This API retrieves the Coinbase Bitcoin Premium Index, indicating the price difference
     * between Bitcoin on Coinbase Pro and Binance
     *
     * @summary Coinbase Premium Index
     * @throws FetchError<400, types.CoinbasePremiumIndexResponse400> 400
     */
    coinbasePremiumIndex(metadata: types.CoinbasePremiumIndexMetadataParam): Promise<FetchResponse<200, types.CoinbasePremiumIndexResponse200>>;
    /**
     * This API retrieves data on margin long and short positions from Bitfinex.
     *
     * @summary Bitfinex Margin Long/Short
     * @throws FetchError<400, types.BitfinexMarginLongShortResponse400> 400
     */
    bitfinexMarginLongShort(metadata: types.BitfinexMarginLongShortMetadataParam): Promise<FetchResponse<200, types.BitfinexMarginLongShortResponse200>>;
    /**
     * The API retrieves on-chain transfer records for exchanges.
     *
     * @summary Exchange On-chain Transfers (ERC-20)
     * @throws FetchError<400, types.ExchangeOnchainTransfersResponse400> 400
     */
    exchangeOnchainTransfers(metadata?: types.ExchangeOnchainTransfersMetadataParam): Promise<FetchResponse<200, types.ExchangeOnchainTransfersResponse200>>;
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OpenInterest OHLC History
     * @throws FetchError<400, types.EnterpriseOpeninterestOhlcHistoryResponse400> 400
     */
    enterpriseOpeninterestOhlcHistory(metadata: types.EnterpriseOpeninterestOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.EnterpriseOpeninterestOhlcHistoryResponse200>>;
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary FundingRate OHLC History
     * @throws FetchError<400, types.EnterpriseFundingrateOhlcHistoryResponse400> 400
     */
    enterpriseFundingrateOhlcHistory(metadata: types.EnterpriseFundingrateOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.EnterpriseFundingrateOhlcHistoryResponse200>>;
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary Liquidation History
     * @throws FetchError<400, types.EnterpriseLiquidationHistoryResponse400> 400
     */
    enterpriseLiquidationHistory(metadata: types.EnterpriseLiquidationHistoryMetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationHistoryResponse200>>;
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap(Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapResponse400> 400
     */
    enterpriseLiquidationHeatmap(metadata: types.EnterpriseLiquidationHeatmapMetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationHeatmapResponse200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap(Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapResponse400> 400
     */
    enterpriseLiquidationAggregatedHeatmap(metadata: types.EnterpriseLiquidationAggregatedHeatmapMetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationAggregatedHeatmapResponse200>>;
    /**
     * This API presents liquidation levels on the chart, calculated from market data and
     * various leverage amounts.
     *
     * @summary Liquidation Heatmap Model2 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapModel2Response400> 400
     */
    enterpriseLiquidationHeatmapModel2(metadata: types.EnterpriseLiquidationHeatmapModel2MetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationHeatmapModel2Response200>>;
    /**
     * This API presents liquidation levels on the chart, calculated from market data and
     * various leverage amounts.
     *
     * @summary Liquidation Heatmap Model3 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationHeatmapModel3Response400> 400
     */
    enterpriseLiquidationHeatmapModel3(metadata: types.EnterpriseLiquidationHeatmapModel3MetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationHeatmapModel3Response200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model2 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapModel2Response400> 400
     */
    enterpriseLiquidationAggregatedHeatmapModel2(metadata: types.EnterpriseLiquidationAggregatedHeatmapModel2MetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationAggregatedHeatmapModel2Response200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model3 (Enterprise)
     * @throws FetchError<400, types.EnterpriseLiquidationAggregatedHeatmapModel3Response400> 400
     */
    enterpriseLiquidationAggregatedHeatmapModel3(metadata: types.EnterpriseLiquidationAggregatedHeatmapModel3MetadataParam): Promise<FetchResponse<200, types.EnterpriseLiquidationAggregatedHeatmapModel3Response200>>;
    /**
     * Bull Market Peak Indicators
     *
     * @throws FetchError<400, types.BullMarketPeakIndicatorResponse400> 400
     */
    bullMarketPeakIndicator(): Promise<FetchResponse<200, types.BullMarketPeakIndicatorResponse200>>;
    /**
     * AHR999
     *
     * @throws FetchError<400, types.Ahr999Response400> 400
     */
    ahr999(): Promise<FetchResponse<200, types.Ahr999Response200>>;
    /**
     * Puell-Multiple
     *
     * @throws FetchError<400, types.PuellMultipleResponse400> 400
     */
    puellMultiple(): Promise<FetchResponse<200, types.PuellMultipleResponse200>>;
    /**
     * Stock-to-Flow Model
     *
     * @throws FetchError<400, types.StockFlowResponse400> 400
     */
    stockFlow(): Promise<FetchResponse<200, types.StockFlowResponse200>>;
    /**
     * Golden-Ratio-Multiplier
     *
     * @throws FetchError<400, types.GoldenRatioMultiplierResponse400> 400
     */
    goldenRatioMultiplier(): Promise<FetchResponse<200, types.GoldenRatioMultiplierResponse200>>;
    /**
     * Crypto Fear & Greed Index
     *
     * @throws FetchError<400, types.CryptofearGreedindexResponse400> 400
     */
    cryptofearGreedindex(): Promise<FetchResponse<200, types.CryptofearGreedindexResponse200>>;
    /**
     * StableCoin MarketCap History
     *
     * @throws FetchError<400, types.StablecoinMarketcapHistoryResponse400> 400
     */
    stablecoinMarketcapHistory(): Promise<FetchResponse<200, types.StablecoinMarketcapHistoryResponse200>>;
    /**
     * The API retrieves a list of holdings managed by Grayscale Investments.
     *
     * @summary Holdings List
     * @throws FetchError<400, types.GrayscaleHoldingListResponse400> 400
     */
    grayscaleHoldingList(): Promise<FetchResponse<200, types.GrayscaleHoldingListResponse200>>;
    /**
     * The API retrieves historical premium/discount data for Grayscale Investment Trusts
     * relative to their NAV.
     *
     * @summary Premium History
     * @throws FetchError<400, types.GrayscalePremiumHistoryResponse400> 400
     */
    grayscalePremiumHistory(metadata: types.GrayscalePremiumHistoryMetadataParam): Promise<FetchResponse<200, types.GrayscalePremiumHistoryResponse200>>;
    /**
     * Exchange Balance Chart
     *
     * @throws FetchError<400, types.ExchangeBalanceChartResponse400> 400
     */
    exchangeBalanceChart(metadata: types.ExchangeBalanceChartMetadataParam): Promise<FetchResponse<200, types.ExchangeBalanceChartResponse200>>;
    /**
     * Option Max Pain
     *
     * @throws FetchError<400, types.OptionMaxPainResponse400> 400
     */
    optionMaxPain(metadata: types.OptionMaxPainMetadataParam): Promise<FetchResponse<200, types.OptionMaxPainResponse200>>;
    /**
     * Info
     *
     * @throws FetchError<400, types.InfoResponse400> 400
     */
    info(metadata: types.InfoMetadataParam): Promise<FetchResponse<200, types.InfoResponse200>>;
    /**
     * Exchange Volume History
     *
     * @throws FetchError<400, types.ExchangeVolumeHistoryResponse400> 400
     */
    exchangeVolumeHistory(metadata: types.ExchangeVolumeHistoryMetadataParam): Promise<FetchResponse<200, types.ExchangeVolumeHistoryResponse200>>;
    /**
     * 大额成交
     *
     * @throws FetchError<400, types.LargeOrderResponse400> 400
     */
    largeOrder(metadata: types.LargeOrderMetadataParam): Promise<FetchResponse<200, types.LargeOrderResponse200>>;
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary 当前未完成大额委托
     * @throws FetchError<400, types.LargeOrderbookCopy2Response400> 400
     */
    largeOrderbookCopy2(metadata: types.LargeOrderbookCopy2MetadataParam): Promise<FetchResponse<200, types.LargeOrderbookCopy2Response200>>;
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary 大额委托历史
     * @throws FetchError<400, types.LargeLimitOrderHistory2Response400> 400
     */
    largeLimitOrderHistory2(metadata: types.LargeLimitOrderHistory2MetadataParam): Promise<FetchResponse<200, types.LargeLimitOrderHistory2Response200>>;
    get_apifuturesbasishistory(metadata: types.GetApifuturesbasishistoryMetadataParam): Promise<FetchResponse<200, types.GetApifuturesbasishistoryResponse200>>;
    get_apiexchangeassets(metadata: types.GetApiexchangeassetsMetadataParam): Promise<FetchResponse<200, types.GetApiexchangeassetsResponse200>>;
    /**
     * This API presents aggregated open interest data using OHLC (Open, High, Low, Close)
     * candlestick charts.
     *
     * @summary OHLC Aggregated History
     * @throws FetchError<400, types.OiOhlcAggregatedHistoryResponse400> 400
     */
    oiOhlcAggregatedHistory(metadata: types.OiOhlcAggregatedHistoryMetadataParam): Promise<FetchResponse<200, types.OiOhlcAggregatedHistoryResponse200>>;
    /**
     * This API retrieves historical open interest data for a cryptocurrency from exchanges,
     * and the data is formatted for chart presentation.
     *
     * @summary Exchange History Chart
     * @throws FetchError<400, types.OiExchangeHistoryChartResponse400> 400
     */
    oiExchangeHistoryChart(metadata: types.OiExchangeHistoryChartMetadataParam): Promise<FetchResponse<200, types.OiExchangeHistoryChartResponse200>>;
    /**
     * This API presents funding rate data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OHLC History
     * @throws FetchError<400, types.FrOhlcHistroyResponse400> 400
     */
    frOhlcHistroy(metadata: types.FrOhlcHistroyMetadataParam): Promise<FetchResponse<200, types.FrOhlcHistroyResponse200>>;
    /**
     * This API presents open interest-weight data through OHLC (Open, High, Low, Close)
     * candlestick charts.
     *
     * @summary OI Weight OHLC History
     * @throws FetchError<400, types.OiWeightOhlcHistoryResponse400> 400
     */
    oiWeightOhlcHistory(metadata: types.OiWeightOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.OiWeightOhlcHistoryResponse200>>;
    /**
     * This API presents volume-weight data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary Vol Weight OHLC History
     * @throws FetchError<400, types.VolWeightOhlcHistoryResponse400> 400
     */
    volWeightOhlcHistory(metadata: types.VolWeightOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.VolWeightOhlcHistoryResponse200>>;
    /**
     * Arbitrage
     *
     * @throws FetchError<400, types.FrArbitrageResponse400> 400
     */
    frArbitrage(metadata: types.FrArbitrageMetadataParam): Promise<FetchResponse<200, types.FrArbitrageResponse200>>;
    /**
     * This API retrieves the long/short account ratio for trading pairs on an exchange
     *
     * @summary Global Account Ratio
     * @throws FetchError<400, types.GlobalLongshortAccountRatioResponse400> 400
     */
    globalLongshortAccountRatio(metadata: types.GlobalLongshortAccountRatioMetadataParam): Promise<FetchResponse<200, types.GlobalLongshortAccountRatioResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of top accounts.
     *
     * @summary Top Account Ratio History
     * @throws FetchError<400, types.TopLongshortAccountRatioResponse400> 400
     */
    topLongshortAccountRatio(metadata: types.TopLongshortAccountRatioMetadataParam): Promise<FetchResponse<200, types.TopLongshortAccountRatioResponse200>>;
    /**
     * This API retrieves the long/short ratio of aggregated taker buy/sell volumes for
     * exchanges.
     *
     * @summary Exchange Taker Buy/Sell Ratio
     * @throws FetchError<400, types.TakerBuysellVolumeExchangeListResponse400> 400
     */
    takerBuysellVolumeExchangeList(metadata: types.TakerBuysellVolumeExchangeListMetadataParam): Promise<FetchResponse<200, types.TakerBuysellVolumeExchangeListResponse200>>;
    /**
     * This API retrieves aggregated historical data for both long and short liquidations of a
     * coin on the exchange
     *
     * @summary Liquidation Aggregated History
     * @throws FetchError<400, types.AggregatedLiquidationHistoryResponse400> 400
     */
    aggregatedLiquidationHistory(metadata: types.AggregatedLiquidationHistoryMetadataParam): Promise<FetchResponse<200, types.AggregatedLiquidationHistoryResponse200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap
     * @throws FetchError<400, types.LiquidationAggregateHeatmapResponse400> 400
     */
    liquidationAggregateHeatmap(metadata: types.LiquidationAggregateHeatmapMetadataParam): Promise<FetchResponse<200, types.LiquidationAggregateHeatmapResponse200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model2
     * @throws FetchError<400, types.LiquidationAggregateHeatmapModel2Response400> 400
     */
    liquidationAggregateHeatmapModel2(metadata: types.LiquidationAggregateHeatmapModel2MetadataParam): Promise<FetchResponse<200, types.LiquidationAggregateHeatmapModel2Response200>>;
    /**
     * This API presents aggregated liquidation levels on the chart, calculated from market
     * data and various leverage amounts.
     *
     * @summary Liquidation Aggregated Heatmap Model3
     * @throws FetchError<400, types.LiquidationAggregatedHeatmapModel3Response400> 400
     */
    liquidationAggregatedHeatmapModel3(metadata: types.LiquidationAggregatedHeatmapModel3MetadataParam): Promise<FetchResponse<200, types.LiquidationAggregatedHeatmapModel3Response200>>;
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap
     * @throws FetchError<400, types.LiquidationHeatmapResponse400> 400
     */
    liquidationHeatmap(metadata: types.LiquidationHeatmapMetadataParam): Promise<FetchResponse<200, types.LiquidationHeatmapResponse200>>;
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap Model3
     * @throws FetchError<400, types.LiquidationHeatmapModel3Response400> 400
     */
    liquidationHeatmapModel3(metadata: types.LiquidationHeatmapModel3MetadataParam): Promise<FetchResponse<200, types.LiquidationHeatmapModel3Response200>>;
    /**
     * This API presents and maps liquidation events based on market data and diverse leverage
     * amounts
     *
     * @summary Liquidation Aggregated Map
     * @throws FetchError<400, types.LiquidationAggregatedMapResponse400> 400
     */
    liquidationAggregatedMap(metadata: types.LiquidationAggregatedMapMetadataParam): Promise<FetchResponse<200, types.LiquidationAggregatedMapResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of taker buy/sell volumes.
     *
     * @summary Taker Buy/Sell Ratio History
     * @throws FetchError<400, types.TakerBuysellVolumeResponse400> 400
     */
    takerBuysellVolume(metadata: types.TakerBuysellVolumeMetadataParam): Promise<FetchResponse<200, types.TakerBuysellVolumeResponse200>>;
    /**
     * The API retrieves historical data of the order book for futures
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.FuturesOrderbookHistoryResponse400> 400
     */
    futuresOrderbookHistory(metadata: types.FuturesOrderbookHistoryMetadataParam): Promise<FetchResponse<200, types.FuturesOrderbookHistoryResponse200>>;
    /**
     * The API retrieves historical data of the aggregated order book for futures
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Aggregated Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.FuturesAggregatedOrderbookHistoryResponse400> 400
     */
    futuresAggregatedOrderbookHistory(metadata: types.FuturesAggregatedOrderbookHistoryMetadataParam): Promise<FetchResponse<200, types.FuturesAggregatedOrderbookHistoryResponse200>>;
    /**
     * The API retrieves historical data of the order book for futures trading.
     *
     * @summary Orderbook Heatmap
     */
    orderbookHeatmap(metadata: types.OrderbookHeatmapMetadataParam): Promise<FetchResponse<number, unknown>>;
    /**
     * The API retrieves historical data of the open, high, low, and close (OHLC) prices for
     * cryptocurrencies.
     *
     * @summary Price OHLC History
     */
    priceOhlcHistory(metadata: types.PriceOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.PriceOhlcHistoryResponse200>>;
    get_apispotpricehistory(metadata: types.GetApispotpricehistoryMetadataParam): Promise<FetchResponse<200, types.GetApispotpricehistoryResponse200>>;
    /**
     * The API retrieves historical data of the aggregated order book for spot
     * trading.(https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Aggregated OrderBook Bid&Ask(±range)
     * @throws FetchError<400, types.SpotAggregatedHistoryResponse400> 400
     */
    spotAggregatedHistory(metadata: types.SpotAggregatedHistoryMetadataParam): Promise<FetchResponse<200, types.SpotAggregatedHistoryResponse200>>;
    /**
     * The API retrieves historical data of the order book for spot trading.
     * (https://www.coinglass.com/pro/depth-delta)
     *
     * @summary Orderbook Bid&Ask(±range)
     * @throws FetchError<400, types.SpotOrderbookHistoryResponse400> 400
     */
    spotOrderbookHistory(metadata: types.SpotOrderbookHistoryMetadataParam): Promise<FetchResponse<200, types.SpotOrderbookHistoryResponse200>>;
    get_apispotorderbookhistory(metadata: types.GetApispotorderbookhistoryMetadataParam): Promise<FetchResponse<number, unknown>>;
    get_apispotorderbooklargeLimitOrder(metadata: types.GetApispotorderbooklargeLimitOrderMetadataParam): Promise<FetchResponse<200, types.GetApispotorderbooklargeLimitOrderResponse200>>;
    /**
     * The API retrieves completed historical large orders from the order book for futures
     * trading
     *
     * @summary Large Orderbook History
     */
    largeOrderbookHistory(metadata: types.LargeOrderbookHistoryMetadataParam): Promise<FetchResponse<200, types.LargeOrderbookHistoryResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of taker buy/sell volumes.
     *
     * @summary Taker Buy/Sell History
     * @throws FetchError<400, types.SpotTakerBuysellRatioHistoryResponse400> 400
     */
    spotTakerBuysellRatioHistory(metadata: types.SpotTakerBuysellRatioHistoryMetadataParam): Promise<FetchResponse<200, types.SpotTakerBuysellRatioHistoryResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell Volume History
     * @throws FetchError<400, types.AggregatedTakerBuysellVolumeHistoryResponse400> 400
     */
    aggregatedTakerBuysellVolumeHistory(metadata: types.AggregatedTakerBuysellVolumeHistoryMetadataParam): Promise<FetchResponse<200, types.AggregatedTakerBuysellVolumeHistoryResponse200>>;
    /**
     * Exchange Open Interest History
     *
     * @throws FetchError<400, types.ExchangeOpenInterestHistoryResponse400> 400
     */
    exchangeOpenInterestHistory(metadata: types.ExchangeOpenInterestHistoryMetadataParam): Promise<FetchResponse<200, types.ExchangeOpenInterestHistoryResponse200>>;
    /**
     * Exchange Balance List
     *
     * @throws FetchError<400, types.ExchangeBalanceListResponse400> 400
     */
    exchangeBalanceList(metadata: types.ExchangeBalanceListMetadataParam): Promise<FetchResponse<200, types.ExchangeBalanceListResponse200>>;
    /**
     * This API retrieves the historical net assets data for ETFs (Exchange-Traded Funds)
     *
     * @summary ETF NetAssets History
     * @throws FetchError<400, types.EthereumEtfNetassetsHistoryResponse400> 400
     */
    ethereumEtfNetassetsHistory(): Promise<FetchResponse<200, types.EthereumEtfNetassetsHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information regarding the historical premium or
     * discount fluctuations of ETFs.
     *
     * @summary ETF History
     * @throws FetchError<400, types.EtfHistoryResponse400> 400
     */
    etfHistory(metadata: types.EtfHistoryMetadataParam): Promise<FetchResponse<200, types.EtfHistoryResponse200>>;
    /**
     * Bitcoin-Rainbow-Chart
     *
     * @throws FetchError<400, types.BitcoinRainbowChartResponse400> 400
     */
    bitcoinRainbowChart(): Promise<FetchResponse<200, types.BitcoinRainbowChartResponse200>>;
    /**
     * Pi Cycle Top Indicator
     *
     * @throws FetchError<400, types.PiResponse400> 400
     */
    pi(): Promise<FetchResponse<200, types.PiResponse200>>;
    /**
     * The API retrieves large open orders from the current order book for futures trading.
     *
     * @summary Large Orderbook
     * @throws FetchError<400, types.LargeOrderbookResponse400> 400
     */
    largeOrderbook(metadata: types.LargeOrderbookMetadataParam): Promise<FetchResponse<200, types.LargeOrderbookResponse200>>;
    /**
     * This API presents open interest data through OHLC (Open, High, Low, Close) candlestick
     * charts.
     *
     * @summary OHLC History
     * @throws FetchError<400, types.OiOhlcHistroyResponse400> 400
     */
    oiOhlcHistroy(metadata: types.OiOhlcHistroyMetadataParam): Promise<FetchResponse<200, types.OiOhlcHistroyResponse200>>;
    /**
     * This API presents aggregated coin margin open interest data using OHLC (Open, High, Low,
     * Close) candlestick charts.
     *
     * @summary OHLC Aggregated Coin Margin History
     * @throws FetchError<400, types.OiOhlcAggregatedCoinMarginHistoryResponse400> 400
     */
    oiOhlcAggregatedCoinMarginHistory(metadata: types.OiOhlcAggregatedCoinMarginHistoryMetadataParam): Promise<FetchResponse<200, types.OiOhlcAggregatedCoinMarginHistoryResponse200>>;
    /**
     * This API retrieves open interest data for a coin from exchanges
     *
     * @summary Exchange List
     * @throws FetchError<400, types.OiExchangeListResponse400> 400
     */
    oiExchangeList(metadata: types.OiExchangeListMetadataParam): Promise<FetchResponse<200, types.OiExchangeListResponse200>>;
    /**
     * Tow Year Ma Multiplier
     *
     * @throws FetchError<400, types.TowYearMaMultiplierResponse400> 400
     */
    towYearMaMultiplier(): Promise<FetchResponse<200, types.TowYearMaMultiplierResponse200>>;
    /**
     * The API retrieves borrowing interest rates for cryptocurrencies.
     *
     * @summary Borrow Interest Rate
     * @throws FetchError<400, types.BorrowInterestRateResponse400> 400
     */
    borrowInterestRate(metadata: types.BorrowInterestRateMetadataParam): Promise<FetchResponse<200, types.BorrowInterestRateResponse200>>;
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary ETF Flows History
     * @throws FetchError<400, types.EthereumEtfFlowsHistoryResponse400> 400
     */
    ethereumEtfFlowsHistory(): Promise<FetchResponse<200, types.EthereumEtfFlowsHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information for Ethereum Exchange-Traded Funds
     * (ETFs).
     *
     * @summary Ethereum ETF List
     * @throws FetchError<400, types.EthereumEtfListResponse400> 400
     */
    ethereumEtfList(): Promise<FetchResponse<200, types.EthereumEtfListResponse200>>;
    /**
     * This API retrieves detailed information on an ETF.
     *
     * @summary ETF Detail
     * @throws FetchError<400, types.EtfDetailResponse400> 400
     */
    etfDetail(metadata: types.EtfDetailMetadataParam): Promise<FetchResponse<200, types.EtfDetailResponse200>>;
    /**
     * This API retrieves historical price data for ETFs, including open, high, low, and close
     * (OHLC) prices.
     *
     * @summary ETF Price History
     * @throws FetchError<400, types.EtfPriceOhlcHistoryResponse400> 400
     */
    etfPriceOhlcHistory(metadata: types.EtfPriceOhlcHistoryMetadataParam): Promise<FetchResponse<200, types.EtfPriceOhlcHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information regarding the historical premium or
     * discount fluctuations of ETFs.
     *
     * @summary ETF Premium/Discount History
     * @throws FetchError<400, types.BitcoinEtfPremiumDiscountHistoryResponse400> 400
     */
    bitcoinEtfPremiumDiscountHistory(metadata?: types.BitcoinEtfPremiumDiscountHistoryMetadataParam): Promise<FetchResponse<200, types.BitcoinEtfPremiumDiscountHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary ETF Flows History
     * @throws FetchError<400, types.EtfFlowsHistoryResponse400> 400
     */
    etfFlowsHistory(): Promise<FetchResponse<200, types.EtfFlowsHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information regarding the history of ETF flows.
     *
     * @summary Hong Kong ETF Flows History
     * @throws FetchError<400, types.HongKongBitcoinEtfFlowHistoryResponse400> 400
     */
    hongKongBitcoinEtfFlowHistory(): Promise<FetchResponse<200, types.HongKongBitcoinEtfFlowHistoryResponse200>>;
    /**
     * This API retrieves a list of key status information for Bitcoin Exchange-Traded Funds
     * (ETFs).
     *
     * @summary Bitcoin ETF List
     * @throws FetchError<400, types.BitcoinEtfsResponse400> 400
     */
    bitcoinEtfs(): Promise<FetchResponse<200, types.BitcoinEtfsResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of aggregated taker buy/sell
     * volumes.
     *
     * @summary Aggregated Taker Buy/Sell History
     * @throws FetchError<400, types.SpotAggregatedTakerBuysellHistoryResponse400> 400
     */
    spotAggregatedTakerBuysellHistory(metadata: types.SpotAggregatedTakerBuysellHistoryMetadataParam): Promise<FetchResponse<200, types.SpotAggregatedTakerBuysellHistoryResponse200>>;
    /**
     * This API retrieves historical data for the long/short ratio of positions by top
     * accounts.
     *
     * @summary Top Position Ratio History
     * @throws FetchError<400, types.TopLongshortPositionRatioResponse400> 400
     */
    topLongshortPositionRatio(metadata: types.TopLongshortPositionRatioMetadataParam): Promise<FetchResponse<200, types.TopLongshortPositionRatioResponse200>>;
    /**
     * This API retrieves historical data for both long and short liquidations of a trading
     * pair on the exchange
     *
     * @summary Liquidation History
     * @throws FetchError<400, types.LiquidationHistoryResponse400> 400
     */
    liquidationHistory(metadata: types.LiquidationHistoryMetadataParam): Promise<FetchResponse<200, types.LiquidationHistoryResponse200>>;
    /**
     * This API presents liquidation levels on the chart by calculating them based on market
     * data and various leverage amounts
     *
     * @summary Liquidation Heatmap Model2
     * @throws FetchError<400, types.LiquidationHeatmapModel2Response400> 400
     */
    liquidationHeatmapModel2(metadata: types.LiquidationHeatmapModel2MetadataParam): Promise<FetchResponse<200, types.LiquidationHeatmapModel2Response200>>;
    /**
     * This API retrieves the historical net assets data for ETFs (Exchange-Traded Funds)
     *
     * @summary ETF NetAssets History
     * @throws FetchError<400, types.BitcoinEtfNetassetsHistoryResponse400> 400
     */
    bitcoinEtfNetassetsHistory(metadata?: types.BitcoinEtfNetassetsHistoryMetadataParam): Promise<FetchResponse<200, types.BitcoinEtfNetassetsHistoryResponse200>>;
    /**
     * Bitcoin Profitable Days
     *
     * @throws FetchError<400, types.BitcoinProfitableDaysResponse400> 400
     */
    bitcoinProfitableDays(): Promise<FetchResponse<200, types.BitcoinProfitableDaysResponse200>>;
    /**
     * 200-Week Moving Avg Heatmap
     *
     * @throws FetchError<400, types.TowHundredWeekMovingAvgHeatmapResponse400> 400
     */
    towHundredWeekMovingAvgHeatmap(): Promise<FetchResponse<200, types.TowHundredWeekMovingAvgHeatmapResponse200>>;
    /**
     * Bitcoin Bubble Index
     *
     * @throws FetchError<400, types.BitcoinBubbleIndexResponse400> 400
     */
    bitcoinBubbleIndex(): Promise<FetchResponse<200, types.BitcoinBubbleIndexResponse200>>;
    /**
     * This API presents aggregated stablecoin margin open interest data using OHLC (Open,
     * High, Low, Close) candlestick charts.
     *
     * @summary OHLC Aggregated Stablecoin Margin History
     * @throws FetchError<400, types.OiOhlcAggregatedStablecoinMarginHistoryResponse400> 400
     */
    oiOhlcAggregatedStablecoinMarginHistory(metadata: types.OiOhlcAggregatedStablecoinMarginHistoryMetadataParam): Promise<FetchResponse<200, types.OiOhlcAggregatedStablecoinMarginHistoryResponse200>>;
    /**
     * This API retrieves funding rate data from exchanges
     *
     * @summary Exchange List
     * @throws FetchError<400, types.FrExchangeListResponse400> 400
     */
    frExchangeList(): Promise<FetchResponse<200, types.FrExchangeListResponse200>>;
    /**
     * This API retrieves cumulative funding rate data from exchanges.
     *
     * @summary Cumulative Exchange List
     * @throws FetchError<400, types.CumulativeExchangeListResponse400> 400
     */
    cumulativeExchangeList(metadata: types.CumulativeExchangeListMetadataParam): Promise<FetchResponse<200, types.CumulativeExchangeListResponse200>>;
}
declare const createSDK: SDK;
export = createSDK;
