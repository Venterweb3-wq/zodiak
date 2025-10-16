from django.contrib import admin
from .models import CmcFilterSettings, SmartMoneyStrategySettings

@admin.register(CmcFilterSettings)
class CmcFilterSettingsAdmin(admin.ModelAdmin):
    list_display = ('name', 'min_volume_24h', 'min_market_cap', 'min_market_pairs')
    list_filter = ()
    search_fields = ('name',)

@admin.register(SmartMoneyStrategySettings)
class SmartMoneyAdmin(admin.ModelAdmin):
    list_display = ("name", "enabled")
    fields = (
        "name", "enabled",
        "min_open_interest_usd", "min_liquidations_usd", "extreme_funding_threshold",
        "liquidation_bias_ratio", "taker_volume_ratio_threshold",
        "entry_deviation_percent", "tp_ratio", "sl_ratio",
    )
    search_fields = ('name',) 