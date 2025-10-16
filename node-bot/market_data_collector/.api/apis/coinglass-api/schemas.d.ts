declare const AggregatedLiquidationHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "List of exchange names to retrieve data from (e.g.,  'Binance, OKX, Bybit')";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const AggregatedTakerBuysellVolumeHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "exchange_list: List of exchange names to retrieve data from (e.g., 'Binance, OKX, Bybit')";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "usd";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unit for the returned data, choose between 'usd' or 'coin'.";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const AggregatedTakerBuysellVolumeRatio: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT   （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 500;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Default 1000, Max 4500";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1706089927315;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds  eg.1641522717";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds  eg.1641522717";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Ahr999: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinBubbleIndex: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinEtfNetassetsHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly ticker: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "ETF ticker symbol (e.g., GBTC, IBIT).";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinEtfPremiumDiscountHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly ticker: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "ETF ticker symbol (e.g., GBTC, IBIT).";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinEtfs: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinProfitableDays: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitcoinRainbowChart: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BitfinexMarginLongShort: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "BTC,ETH";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BorrowInterestRate: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 500;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Default 1000, Max 4500";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1706089927315;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds  eg.1641522717";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds  eg.1641522717";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const BullMarketPeakIndicator: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CoinbasePremiumIndex: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Default 1000, Max 4500";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds eg.1641522717";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "in seconds eg.1641522717";
                };
            };
            readonly required: readonly ["interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Coins: {
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CoinsMarkets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance,OKX";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma-separated exchange names (e.g., \"binance, okx, bybit\"). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly per_page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per page.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "1";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page number for pagination, default: 1.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CoinsPriceChange: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CryptofearGreedindex: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CumulativeExchangeList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly range: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for the data (e.g.,1d, 7d, 30d, 365d).";
                };
            };
            readonly required: readonly ["range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseFundingrateOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbols: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT   （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1m";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 5m";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Max 100";
                };
            };
            readonly required: readonly ["exchange", "symbols", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationAggregatedHeatmap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC   （ Check supported coin through the 'support-coins' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["symbol", "endTime"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationAggregatedHeatmapModel2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC   （ Check supported coin through the 'support-coins' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg.  1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationAggregatedHeatmapModel3: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC   （ Check supported coin through the 'support-coins' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg.  1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationHeatmap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg.  Binance,Okx,Crypto.com,Dydx,Bitget,Bybit,Bingx,Bitmex,Bitfinex,Deribit,Coinex,Kraken,Htx";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["exchange", "symbol", "endTime"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationHeatmapModel2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg.  Binance,Okx,Crypto.com,Dydx,Bitget,Bybit,Bingx,Bitmex,Bitfinex,Deribit,Coinex,Kraken,Htx";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg. 1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["symbol", "endTime"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationHeatmapModel3: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg.  Binance,Okx,Crypto.com,Dydx,Bitget,Bybit,Bingx,Bitmex,Bitfinex,Deribit,Coinex,Kraken,Htx";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "The earliest timestamp is: 1654012800";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1727171272;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "eg. 1727171272";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "<=288";
                };
            };
            readonly required: readonly ["symbol", "endTime"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseLiquidationHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchanges: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbols: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTC";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1m";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 5m";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Max 100";
                };
            };
            readonly required: readonly ["exchanges", "symbols", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnterpriseOpeninterestOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbols: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT   （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1m";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "1m, 5m";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Max 100";
                };
            };
            readonly required: readonly ["exchange", "symbols", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EtfDetail: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly ticker: {
                    readonly type: "string";
                    readonly default: "GBTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "GBTC,IBIT...";
                };
            };
            readonly required: readonly ["ticker"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EtfFlowsHistory: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EtfHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly ticker: {
                    readonly type: "string";
                    readonly default: "GBTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "ETF ticker symbol (e.g., GBTC, IBIT).";
                };
            };
            readonly required: readonly ["ticker"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EtfPriceOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly ticker: {
                    readonly type: "string";
                    readonly default: "GBTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "ETF ticker symbol (e.g., GBTC, IBIT).";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for the data (e.g., 1d,7d,all).";
                };
            };
            readonly required: readonly ["ticker", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EthereumEtfFlowsHistory: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EthereumEtfList: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EthereumEtfNetassetsHistory: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ExchangeBalanceChart: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC, ETH";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ExchangeBalanceList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin eg. BTC , ETH";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ExchangeOnchainTransfers: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "ETH";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., ETH).";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 1706089927315;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly minUsd: {
                    readonly type: "number";
                    readonly format: "double";
                    readonly minimum: -1.7976931348623157e+308;
                    readonly maximum: 1.7976931348623157e+308;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum transfer amount filter, specified in USD.";
                };
                readonly per_page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per page.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "1";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page number for pagination, default: 1.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ExchangeOpenInterestHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC,ETH). ";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "USD";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Specify the unit for the returned data. Supported values depend on the symbol. If symbol is BTC, choose between USD or BTC. For ETH, choose between USD or ETH.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for the data. Supported values: 1h, 4h, 12h, all.";
                };
            };
            readonly required: readonly ["symbol", "unit", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ExchangeVolumeHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC,ETH). ";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "USD";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Specify the unit for the returned data. Supported values depend on the symbol. If symbol is BTC, choose between USD or BTC. For ETH, choose between USD or ETH.";
                };
            };
            readonly required: readonly ["symbol", "unit"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FrArbitrage: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly usd: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly default: 10000;
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Investment principal for arbitrage (e.g., 10000).";
                };
            };
            readonly required: readonly ["usd"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FrExchangeList: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FrOhlcHistroy: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FuturesAggregatedOrderbookHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "List of exchange names to retrieve data from (e.g., 'ALL', or 'Binance, OKX, Bybit')";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 500;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Depth percentage (e.g., 0.25, 0.5, 0.75, 1, 2, 3, 5, 10).";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FuturesOrderbookHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Check supported pairs through the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "100";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Depth percentage (e.g., 0.25, 0.5, 0.75, 1, 2, 3, 5, 10).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FuturesRsiList: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetApiexchangeassets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly per_page: {
                    readonly type: "string";
                    readonly default: "10";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per page.";
                };
                readonly page: {
                    readonly type: "string";
                    readonly default: "1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page number for pagination, default: 1";
                };
            };
            readonly required: readonly ["exchange"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetApifuturesbasishistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "string";
                    readonly default: "10";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetApispotorderbookhistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Spot exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Supported trading pairs (e.g., BTCUSDT, ETHUSDT). Tick sizes: BTCUSDT (TickSize=20), ETHUSDT (TickSize=0.5).";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time intervals for data aggregation. Supported values: 1h, 4h, 8h, 12h, 1d.";
                };
                readonly limit: {
                    readonly type: "string";
                    readonly default: "5";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval", "limit"];
        }];
    };
};
declare const GetApispotorderbooklargeLimitOrder: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
            };
            readonly required: readonly ["exchange", "symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetApispotpricehistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "spot exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "string";
                    readonly default: "10";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GlobalLongshortAccountRatio: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GoldenRatioMultiplier: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GrayscaleHoldingList: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GrayscalePremiumHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Supported values: ETC, LTC, BCH, SOL, XLM, LINK, ZEC, MANA, ZEN, FIL, BAT, LPT";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const HongKongBitcoinEtfFlowHistory: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const HyperliquidWhaleAlert: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const HyperliquidWhalePosition: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Info: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC,ETH). ";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Instruments: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LargeLimitOrderHistory2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exName: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures Exchange(Binance,OKX)  Spot Exchange(Binance,OKX,Coinbase,Bitfinex,Karan)";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "BTCUSDT";
                };
                readonly type: {
                    readonly type: "string";
                    readonly default: "futures";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "futures or spot";
                };
                readonly state: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 2;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "2-已完成 3已撤销";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 1000;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "开始时间 单位 秒";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "结束时间 单位 秒";
                };
            };
            readonly required: readonly ["exName", "symbol", "type"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LargeOrder: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchanges: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "交易所名称";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "币种";
                };
                readonly type: {
                    readonly type: "string";
                    readonly default: "futures";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "futures or spot";
                };
                readonly startTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "毫秒";
                };
                readonly endTime: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "毫秒";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 100;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "max 1000";
                };
            };
            readonly required: readonly ["exchanges", "symbol", "type"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LargeOrderbook: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pair via the 'support-exchange-pair' API.";
                };
            };
            readonly required: readonly ["exchange", "symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LargeOrderbookCopy2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exName: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures Exchange(Binance,OKX)  Spot Exchange(Binance,OKX,Coinbase,Bitfinex,Karan)";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "BTCUSDT";
                };
                readonly type: {
                    readonly type: "string";
                    readonly default: "futures";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "futures or spot";
                };
            };
            readonly required: readonly ["exName", "symbol", "type"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LargeOrderbookHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Check supported pairs through the 'support-exchange-pair' API.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1723625037000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1723626037000).";
                };
                readonly state: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "1";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Status of the order —  1for ''In Progress''  2 for \"Finish\"  3 for \"Revoke\"";
                };
            };
            readonly required: readonly ["exchange", "symbol", "start_time", "end_time", "state"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationAggregateHeatmap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y.";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationAggregateHeatmapModel2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y.";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationAggregatedHeatmapModel3: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y.";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationAggregatedMap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 1d, 7d.";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationCoinList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
            };
            readonly required: readonly ["exchange"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationExchangeList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).  Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation.  Supported values: 1h, 4h, 12h, 24h.";
                };
            };
            readonly required: readonly ["range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationHeatmap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance, OKX). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y.";
                };
            };
            readonly required: readonly ["exchange", "symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationHeatmapModel2: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name  eg. Binance ，OKX （ Check supported exchanges through the 'support-exchange-pair' API.）";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair eg. BTCUSDT   （ Check supported pair through the 'support-exchange-pair' API.）";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y";
                };
            };
            readonly required: readonly ["exchange", "symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationHeatmapModel3: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance, OKX). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "3d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 12h, 24h, 3d, 7d, 30d, 90d, 180d, 1y.";
                };
            };
            readonly required: readonly ["exchange", "symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationMap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for data aggregation. Supported values: 1d, 7d.";
                };
            };
            readonly required: readonly ["exchange", "symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const LiquidationOrder: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance, OKX). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly min_liquidation_amount: {
                    readonly type: "string";
                    readonly default: "10000";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Minimum threshold for liquidation events.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "min_liquidation_amount"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiExchangeHistoryChart: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).  Check supported coins through the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "12h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for the data (e.g., all, 1m, 15m, 1h, 4h, 12h).";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "usd";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unit for the returned data, choose between 'usd' or 'coin'.";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiExchangeList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).Retrieve supported coins via the 'support-coins' API.";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiOhlcAggregatedCoinMarginHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma-separated exchange names (e.g., \"Binance, OKX, Bybit\"). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiOhlcAggregatedHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).  Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "usd";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unit for the returned data, choose between 'usd' or 'coin'.";
                };
            };
            readonly required: readonly ["symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiOhlcAggregatedStablecoinMarginHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Comma-separated exchange names (e.g., \"Binance, OKX, Bybit\"). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiOhlcHistroy: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: " Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT).  Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default 1000, Max 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "usd";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unit for the returned data, choose between 'usd' or 'coin'.";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OiWeightOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in seconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in seconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OptionMaxPain: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC,ETH). ";
                };
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Deribit";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Deribit, Binance, OKX). ";
                };
            };
            readonly required: readonly ["symbol", "exchange"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const OrderbookHeatmap: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Supported trading pairs (e.g., BTCUSDT, ETHUSDT). Tick sizes: BTCUSDT (TickSize=20), ETHUSDT (TickSize=0.5).";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time intervals for data aggregation. Supported values: 1h, 4h, 8h, 12h, 1d.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "1";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1723625037000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1723626037000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval", "limit"];
        }];
    };
};
declare const PairsMarkets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).Retrieve supported coins via the 'support-coins' API.";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Pi: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PriceOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: " Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Check supported pairs through the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1h";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: 10;
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval", "limit"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const PuellMultiple: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotAggregatedHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "List of exchange names to retrieve data from (e.g., 'ALL', or 'Binance, OKX, Bybit')";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Depth percentage (e.g., 0.25, 0.5, 0.75, 1, 2, 3, 5, 10).";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotAggregatedTakerBuysellHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange_list: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "exchange_list: List of exchange names to retrieve data from (e.g., 'Binance, OKX, Bybit')";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly unit: {
                    readonly type: "string";
                    readonly default: "usd";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Unit for the returned data, choose between 'usd' or 'coin'.";
                };
            };
            readonly required: readonly ["exchange_list", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotCoinsMarkets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly per_page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: " Number of results per page.";
                };
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "1";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Page number for pagination, default: 1.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotOrderbookHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Check supported pairs through the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Data aggregation time interval. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w.";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500.";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: " End timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Depth percentage (e.g., 0.25, 0.5, 0.75, 1, 2, 3, 5, 10).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotPairsMarkets: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
            };
            readonly required: readonly ["symbol"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotSuportedExchangePairs: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotSupportedCoins: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const SpotTakerBuysellRatioHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Exchange name (e.g., Binance). Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const StablecoinMarketcapHistory: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const StockFlow: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TakerBuysellVolume: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TakerBuysellVolumeExchangeList: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC).  Retrieve supported coins via the 'support-coins' API.";
                };
                readonly range: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time range for the data (e.g., 5m, 15m, 30m, 1h, 4h,12h, 24h).";
                };
            };
            readonly required: readonly ["symbol", "range"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TopLongshortAccountRatio: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TopLongshortPositionRatio: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly exchange: {
                    readonly type: "string";
                    readonly default: "Binance";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Futures exchange names (e.g., Binance, OKX) .Retrieve supported exchanges via the 'support-exchange-pair' API.";
                };
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTCUSDT";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading pair (e.g., BTCUSDT). Retrieve supported pairs via the 'support-exchange-pair' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "h1";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation.  Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request.  Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["exchange", "symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TowHundredWeekMovingAvgHeatmap: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const TowYearMaMultiplier: {
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const VolWeightOhlcHistory: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly symbol: {
                    readonly type: "string";
                    readonly default: "BTC";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Trading coin (e.g., BTC). Retrieve supported coins via the 'support-coins' API.";
                };
                readonly interval: {
                    readonly type: "string";
                    readonly default: "1d";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Time interval for data aggregation. Supported values: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 6h, 8h, 12h, 1d, 1w";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly default: "10";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of results per request. Default: 1000, Maximum: 4500";
                };
                readonly start_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Start timestamp in milliseconds (e.g., 1641522717000).";
                };
                readonly end_time: {
                    readonly type: "integer";
                    readonly format: "int64";
                    readonly minimum: -9223372036854776000;
                    readonly maximum: 9223372036854776000;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "End timestamp in milliseconds (e.g., 1641522717000).";
                };
            };
            readonly required: readonly ["symbol", "interval"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { AggregatedLiquidationHistory, AggregatedTakerBuysellVolumeHistory, AggregatedTakerBuysellVolumeRatio, Ahr999, BitcoinBubbleIndex, BitcoinEtfNetassetsHistory, BitcoinEtfPremiumDiscountHistory, BitcoinEtfs, BitcoinProfitableDays, BitcoinRainbowChart, BitfinexMarginLongShort, BorrowInterestRate, BullMarketPeakIndicator, CoinbasePremiumIndex, Coins, CoinsMarkets, CoinsPriceChange, CryptofearGreedindex, CumulativeExchangeList, EnterpriseFundingrateOhlcHistory, EnterpriseLiquidationAggregatedHeatmap, EnterpriseLiquidationAggregatedHeatmapModel2, EnterpriseLiquidationAggregatedHeatmapModel3, EnterpriseLiquidationHeatmap, EnterpriseLiquidationHeatmapModel2, EnterpriseLiquidationHeatmapModel3, EnterpriseLiquidationHistory, EnterpriseOpeninterestOhlcHistory, EtfDetail, EtfFlowsHistory, EtfHistory, EtfPriceOhlcHistory, EthereumEtfFlowsHistory, EthereumEtfList, EthereumEtfNetassetsHistory, ExchangeBalanceChart, ExchangeBalanceList, ExchangeOnchainTransfers, ExchangeOpenInterestHistory, ExchangeVolumeHistory, FrArbitrage, FrExchangeList, FrOhlcHistroy, FuturesAggregatedOrderbookHistory, FuturesOrderbookHistory, FuturesRsiList, GetApiexchangeassets, GetApifuturesbasishistory, GetApispotorderbookhistory, GetApispotorderbooklargeLimitOrder, GetApispotpricehistory, GlobalLongshortAccountRatio, GoldenRatioMultiplier, GrayscaleHoldingList, GrayscalePremiumHistory, HongKongBitcoinEtfFlowHistory, HyperliquidWhaleAlert, HyperliquidWhalePosition, Info, Instruments, LargeLimitOrderHistory2, LargeOrder, LargeOrderbook, LargeOrderbookCopy2, LargeOrderbookHistory, LiquidationAggregateHeatmap, LiquidationAggregateHeatmapModel2, LiquidationAggregatedHeatmapModel3, LiquidationAggregatedMap, LiquidationCoinList, LiquidationExchangeList, LiquidationHeatmap, LiquidationHeatmapModel2, LiquidationHeatmapModel3, LiquidationHistory, LiquidationMap, LiquidationOrder, OiExchangeHistoryChart, OiExchangeList, OiOhlcAggregatedCoinMarginHistory, OiOhlcAggregatedHistory, OiOhlcAggregatedStablecoinMarginHistory, OiOhlcHistroy, OiWeightOhlcHistory, OptionMaxPain, OrderbookHeatmap, PairsMarkets, Pi, PriceOhlcHistory, PuellMultiple, SpotAggregatedHistory, SpotAggregatedTakerBuysellHistory, SpotCoinsMarkets, SpotOrderbookHistory, SpotPairsMarkets, SpotSuportedExchangePairs, SpotSupportedCoins, SpotTakerBuysellRatioHistory, StablecoinMarketcapHistory, StockFlow, TakerBuysellVolume, TakerBuysellVolumeExchangeList, TopLongshortAccountRatio, TopLongshortPositionRatio, TowHundredWeekMovingAvgHeatmap, TowYearMaMultiplier, VolWeightOhlcHistory };
