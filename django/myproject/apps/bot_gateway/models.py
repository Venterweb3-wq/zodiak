from django.db import models
from django.utils.translation import gettext_lazy as _


class Bot(models.Model):
    """
    Центральная модель для представления каждого бота и его основной конфигурации.
    """
    name = models.CharField(
        _("Bot Name"),
        max_length=100,
        unique=True,
        help_text=_("Internal name, e.g., cross_arbitrage, defi_bot")
    )
    title = models.CharField(
        _("Display Title"),
        max_length=255,
        help_text=_("Public name, e.g., Cross-Arbitrage Bot")
    )
    is_active = models.BooleanField(
        _("Is Active"),
        default=False,
        help_text=_("Globally enable or disable this bot")
    )
    investment_tool_slug = models.CharField(
        _("Investment Tool Slug"),
        max_length=100,
        unique=True,
        help_text=_("Slug of the corresponding InvestmentTool to check user access, e.g., cross_arbitrage")
    )

    class Meta:
        verbose_name = _("Bot")
        verbose_name_plural = _("Bots")
        ordering = ['title']

    def __str__(self):
        return self.title


class CrossArbitrageBotSettings(models.Model):
    """
    Детальные настройки для ботов типа "Cross-Arbitrage".
    """
    bot = models.OneToOneField(Bot, on_delete=models.CASCADE, related_name='cross_arbitrage_settings')
    fetch_interval_seconds = models.PositiveIntegerField(_("Fetch Interval (seconds)"), default=10)
    min_spread = models.DecimalField(_("Minimum Spread"), max_digits=10, decimal_places=4, default=0.15)
    trade_commission_percentage = models.DecimalField(
        _("Trade Commission (%)"),
        max_digits=5,
        decimal_places=4,
        default=0.001,
        help_text=_("Value in decimal format. E.g., 0.001 for 0.1%")
    )
    min_trade_volume_percentage = models.DecimalField(_("Min Trade Volume (%)"), max_digits=5, decimal_places=2, default=2.5)
    max_trade_volume_percentage = models.DecimalField(_("Max Trade Volume (%)"), max_digits=5, decimal_places=2, default=10.0)
    rebalance_threshold_percentage = models.DecimalField(
        _("Rebalance Threshold (%)"),
        max_digits=5,
        decimal_places=2,
        default=10.0,
        help_text=_("Trigger rebalance if a coin balance on an exchange is less than this percentage of its initial value.")
    )
    rebalance_delay_minutes = models.PositiveIntegerField(_("Rebalance Delay (minutes)"), default=2)

    class Meta:
        verbose_name = _("Cross-Arbitrage Bot Settings")
        verbose_name_plural = _("Cross-Arbitrage Bot Settings")

    def __str__(self):
        return f"Settings for {self.bot.title}"


class SpotScalpingBotSettings(models.Model):
    """
    Детальные настройки для бота "Spot Scalping".
    """
    bot = models.OneToOneField(Bot, on_delete=models.CASCADE, related_name='spot_scalping_settings')
    indicator = models.CharField(
        _("Indicator"),
        max_length=50,
        choices=[('RSI', 'RSI'), ('MACD', 'MACD'), ('BB', 'Bollinger Bands')],
        default='RSI'
    )
    timeframe = models.CharField(
        _("Timeframe"),
        max_length=10,
        choices=[('1m', '1 minute'), ('5m', '5 minutes'), ('15m', '15 minutes')],
        default='5m'
    )
    rsi_period = models.PositiveIntegerField(_("RSI Period"), default=14, blank=True, null=True)
    rsi_overbought = models.PositiveIntegerField(_("RSI Overbought Level"), default=70, blank=True, null=True)
    rsi_oversold = models.PositiveIntegerField(_("RSI Oversold Level"), default=30, blank=True, null=True)

    class Meta:
        verbose_name = _("Spot Scalping Bot Settings")
        verbose_name_plural = _("Spot Scalping Bot Settings")

    def __str__(self):
        return f"Settings for {self.bot.title}"


class DefiBotSettings(models.Model):
    """
    Детальные настройки для "DeFi Bot".
    """
    bot = models.OneToOneField(Bot, on_delete=models.CASCADE, related_name='defi_settings')
    slippage_tolerance = models.DecimalField(_("Slippage Tolerance (%)"), max_digits=5, decimal_places=2, default=0.5)
    gas_price_level = models.CharField(
        _("Gas Price Level"),
        max_length=10,
        choices=[('slow', 'Slow'), ('standard', 'Standard'), ('fast', 'Fast')],
        default='standard'
    )
    min_liquidity_usd = models.DecimalField(_("Minimum Liquidity (USD)"), max_digits=20, decimal_places=2, default=5000)

    class Meta:
        verbose_name = _("DeFi Bot Settings")
        verbose_name_plural = _("DeFi Bot Settings")

    def __str__(self):
        return f"Settings for {self.bot.title}"


class FlexibleArbitrageBotSettings(models.Model):
    """
    Детальные настройки для "Flexible Arbitrage Bot".
    """
    bot = models.OneToOneField(Bot, on_delete=models.CASCADE, related_name='flexible_arbitrage_settings')
    max_open_positions = models.PositiveIntegerField(_("Max Open Positions"), default=5)
    min_profit_percentage = models.DecimalField(_("Minimum Profit (%)"), max_digits=5, decimal_places=2, default=1.0)
    asset_allocation_percentage = models.DecimalField(_("Asset Allocation per Position (%)"), max_digits=5, decimal_places=2, default=20.0)

    class Meta:
        verbose_name = _("Flexible Arbitrage Bot Settings")
        verbose_name_plural = _("Flexible Arbitrage Bot Settings")

    def __str__(self):
        return f"Settings for {self.bot.title}"


# InterExchangeBotSettings может использовать ту же модель, что и CrossArbitrage,
# но для гибкости создадим отдельную, если в будущем появятся различия.
class InterExchangeBotSettings(models.Model):
    """
    Детальные настройки для "Inter-Exchange Arbitrage".
    Наследует все настройки от CrossArbitrage и может иметь свои дополнения.
    """
    bot = models.OneToOneField(Bot, on_delete=models.CASCADE, related_name='inter_exchange_settings')
    fetch_interval_seconds = models.PositiveIntegerField(_("Fetch Interval (seconds)"), default=10)
    min_spread = models.DecimalField(_("Minimum Spread"), max_digits=10, decimal_places=4, default=0.15)
    trade_commission_percentage = models.DecimalField(
        _("Trade Commission (%)"),
        max_digits=5,
        decimal_places=4,
        default=0.001,
        help_text=_("Value in decimal format. E.g., 0.001 for 0.1%")
    )
    min_trade_volume_percentage = models.DecimalField(_("Min Trade Volume (%)"), max_digits=5, decimal_places=2, default=2.5)
    max_trade_volume_percentage = models.DecimalField(_("Max Trade Volume (%)"), max_digits=5, decimal_places=2, default=10.0)
    rebalance_threshold_percentage = models.DecimalField(
        _("Rebalance Threshold (%)"),
        max_digits=5,
        decimal_places=2,
        default=10.0,
        help_text=_("Trigger rebalance if a coin balance on an exchange is less than this percentage of its initial value.")
    )
    rebalance_delay_minutes = models.PositiveIntegerField(_("Rebalance Delay (minutes)"), default=2)

    class Meta:
        verbose_name = _("Inter-Exchange Bot Settings")
        verbose_name_plural = _("Inter-Exchange Bot Settings")

    def __str__(self):
        return f"Settings for {self.bot.title}"


class Pool(models.Model):
    """
    Хранит балансы по каждой монете на каждой бирже для каждого бота.
    """
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE, related_name='pools', verbose_name=_("Bot"))
    exchange = models.CharField(_("Exchange"), max_length=100)
    coin_name = models.CharField(_("Coin Name"), max_length=50)
    balance = models.DecimalField(_("Balance"), max_digits=20, decimal_places=8)
    last_updated = models.DateTimeField(_("Last Updated"), auto_now=True)

    class Meta:
        verbose_name = _("Pool Balance")
        verbose_name_plural = _("Pool Balances")
        unique_together = ('bot', 'exchange', 'coin_name')

    def __str__(self):
        return f"{self.bot.name} - {self.exchange} - {self.coin_name}: {self.balance}"


class TradeBook(models.Model):
    """
    Книга сделок: информация о каждой сделке, с привязкой к боту.
    """
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE, related_name='trades', verbose_name=_("Bot"))
    exchange = models.CharField(_("Exchange"), max_length=100)
    coin_name = models.CharField(_("Coin Name"), max_length=50)
    side = models.CharField(_("Side"), max_length=4, choices=[('BUY', _('Buy')), ('SELL', _('Sell'))])
    quantity = models.DecimalField(_("Quantity"), max_digits=20, decimal_places=8)
    price = models.DecimalField(_("Price"), max_digits=20, decimal_places=8)
    total = models.DecimalField(_("Total"), max_digits=20, decimal_places=8)
    profit = models.DecimalField(_("Profit"), max_digits=20, decimal_places=8, null=True, blank=True)
    timestamp = models.DateTimeField(_("Timestamp"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("Trade Book")
        verbose_name_plural = _("Trade Books")
        ordering = ['-timestamp']


class Rebalance(models.Model):
    """
    История ребалансов между биржами, с привязкой к боту.
    """
    bot = models.ForeignKey(Bot, on_delete=models.CASCADE, related_name='rebalances', verbose_name=_("Bot"))
    from_exchange = models.CharField(_("From Exchange"), max_length=100)
    to_exchange = models.CharField(_("To Exchange"), max_length=100)
    coin_name = models.CharField(_("Coin Name"), max_length=50)
    quantity = models.DecimalField(_("Quantity"), max_digits=20, decimal_places=8)
    commission = models.DecimalField(_("Commission"), max_digits=20, decimal_places=8)
    timestamp = models.DateTimeField(_("Timestamp"), auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = _("Rebalance")
        verbose_name_plural = _("Rebalances")
        ordering = ['-timestamp']


# =============================================================================
# MARKET ANALYTICS MODELS (for Flexible Arbitrage)
# =============================================================================

class MarketSummary(models.Model):
    """
    Stores global market data from CoinGecko.
    There should only ever be one instance of this model.
    """
    total_market_cap = models.DecimalField(max_digits=30, decimal_places=2)
    total_volume_24h = models.DecimalField(max_digits=30, decimal_places=2)
    btc_dominance = models.DecimalField(max_digits=5, decimal_places=2)
    eth_dominance = models.DecimalField(max_digits=5, decimal_places=2)
    market_cap_change_24h = models.DecimalField(max_digits=6, decimal_places=2)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Market Summary")
        verbose_name_plural = _("Market Summaries")

    def __str__(self):
        return f"Market Summary as of {self.updated_at.strftime('%Y-%m-%d %H:%M:%S')}"


class TrendingCoin(models.Model):
    """
    Stores data for trending coins from CoinGecko.
    This table is periodically updated by the Node.js bot.
    """
    coingecko_id = models.CharField(max_length=100, unique=True, db_index=True)
    symbol = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=20, decimal_places=8)
    market_cap = models.BigIntegerField()
    volume_24h = models.BigIntegerField()
    price_change_24h = models.FloatField()
    image_url = models.URLField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Trending Coin")
        verbose_name_plural = _("Trending Coins")
        ordering = ['-market_cap']

    def __str__(self):
        return f"{self.name} ({self.symbol.upper()})"
