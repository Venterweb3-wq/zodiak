from django.db import models

class CmcFilterSettings(models.Model):
    name = models.CharField(max_length=64, default="Default")
    min_volume_24h = models.DecimalField(max_digits=20, decimal_places=2, default=30000000)  # ≥ $30M
    min_market_cap = models.DecimalField(max_digits=20, decimal_places=2, default=300000000)  # ≥ $300M
    min_market_pairs = models.IntegerField(default=20)  # ≥ 20
    min_age_days = models.IntegerField(default=90)  # ≥ 90 дней
    max_7d_change = models.DecimalField(max_digits=6, decimal_places=2, default=30)  # ≤ 30%
    min_rank = models.IntegerField(default=1)  # Top-150
    max_rank = models.IntegerField(default=150)
    blacklist = models.TextField(default="", help_text="Через запятую: safemoon,titan")
    excluded_tags = models.TextField(default="", help_text="Через запятую: memes,casino,AI")

    class Meta:
        verbose_name = "CoinMarketCap фильтр"
        verbose_name_plural = "CoinMarketCap фильтры"

    def __str__(self):
        return f"Фильтр CMC: {self.name}"


class SmartMoneyStrategySettings(models.Model):
    name = models.CharField(max_length=64, default="Default")

    min_open_interest_usd = models.DecimalField(max_digits=20, decimal_places=2, default=5000000)
    min_liquidations_usd = models.DecimalField(max_digits=20, decimal_places=2, default=1000000)
    extreme_funding_threshold = models.DecimalField(max_digits=6, decimal_places=4, default=0.01)
    liquidation_bias_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=1.5)
    taker_volume_ratio_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=1.2)

    entry_deviation_percent = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, help_text="Отклонение входа от текущей цены (%)")
    tp_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=3.0, help_text="Take Profit (% от входа)")
    sl_ratio = models.DecimalField(max_digits=5, decimal_places=2, default=1.5, help_text="Stop Loss (% от входа)")

    enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Настройки стратегии Smart Money"
        verbose_name_plural = "Настройки стратегий Smart Money"

    def __str__(self):
        return f"Стратегия: {self.name}"