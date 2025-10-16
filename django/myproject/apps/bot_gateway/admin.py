from django.contrib import admin
from .models import (
    Bot, Pool, TradeBook, Rebalance, MarketSummary, TrendingCoin,
    CrossArbitrageBotSettings, SpotScalpingBotSettings, DefiBotSettings,
    FlexibleArbitrageBotSettings, InterExchangeBotSettings
)

# --- Inlines for Bot Settings ---

class CrossArbitrageBotSettingsInline(admin.StackedInline):
    model = CrossArbitrageBotSettings
    can_delete = False
    verbose_name_plural = 'Cross-Arbitrage Settings'

class SpotScalpingBotSettingsInline(admin.StackedInline):
    model = SpotScalpingBotSettings
    can_delete = False
    verbose_name_plural = 'Spot Scalping Settings'

class DefiBotSettingsInline(admin.StackedInline):
    model = DefiBotSettings
    can_delete = False
    verbose_name_plural = 'DeFi Settings'

class FlexibleArbitrageBotSettingsInline(admin.StackedInline):
    model = FlexibleArbitrageBotSettings
    can_delete = False
    verbose_name_plural = 'Flexible Arbitrage Settings'

class InterExchangeBotSettingsInline(admin.StackedInline):
    model = InterExchangeBotSettings
    can_delete = False
    verbose_name_plural = 'Inter-Exchange Settings'

# --- Mappings ---

BOT_SETTINGS_MAPPING = {
    'cross_arbitrage': (CrossArbitrageBotSettings, CrossArbitrageBotSettingsInline),
    'spot_scalping': (SpotScalpingBotSettings, SpotScalpingBotSettingsInline),
    'defi_bot': (DefiBotSettings, DefiBotSettingsInline),
    'flexible_arbitrage': (FlexibleArbitrageBotSettings, FlexibleArbitrageBotSettingsInline),
    'inter_exchange': (InterExchangeBotSettings, InterExchangeBotSettingsInline),
}

# --- ModelAdmins ---

@admin.register(Bot)
class BotAdmin(admin.ModelAdmin):
    list_display = ('title', 'name', 'investment_tool_slug', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'title')
    ordering = ('title',)
    
    inlines = [
        CrossArbitrageBotSettingsInline,
        SpotScalpingBotSettingsInline,
        DefiBotSettingsInline,
        FlexibleArbitrageBotSettingsInline,
        InterExchangeBotSettingsInline,
    ]

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ('name',)
        return self.readonly_fields

@admin.register(Pool)
class PoolAdmin(admin.ModelAdmin):
    list_display = ('bot', 'exchange', 'coin_name', 'balance', 'last_updated')
    list_filter = ('bot', 'exchange', 'coin_name')
    search_fields = ('bot__name', 'exchange', 'coin_name')
    readonly_fields = ('bot', 'exchange', 'coin_name', 'balance', 'last_updated')
    list_per_page = 30

@admin.register(TradeBook)
class TradeBookAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'bot', 'exchange', 'side', 'quantity', 'price', 'profit')
    list_filter = ('bot', 'exchange', 'side')
    search_fields = ('bot__name', 'exchange', 'coin_name')
    date_hierarchy = 'timestamp'
    list_per_page = 30

@admin.register(Rebalance)
class RebalanceAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'bot', 'from_exchange', 'to_exchange', 'coin_name', 'quantity')
    list_filter = ('bot', 'from_exchange', 'to_exchange')
    search_fields = ('bot__name', 'coin_name')
    date_hierarchy = 'timestamp'
    list_per_page = 30

@admin.register(MarketSummary)
class MarketSummaryAdmin(admin.ModelAdmin):
    list_display = ('updated_at', 'total_market_cap', 'total_volume_24h', 'btc_dominance')
    def has_add_permission(self, request):
        return MarketSummary.objects.count() == 0

@admin.register(TrendingCoin)
class TrendingCoinAdmin(admin.ModelAdmin):
    list_display = ('name', 'symbol', 'price', 'market_cap', 'volume_24h', 'updated_at')
    search_fields = ('name', 'symbol')
    list_per_page = 50 