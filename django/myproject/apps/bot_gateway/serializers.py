from rest_framework import serializers
from .models import (
    Bot, Pool, TradeBook, Rebalance,
    # Analytics Models
    MarketSummary, TrendingCoin
)


# =============================================================================
# PUBLIC API SERIALIZERS (for Frontend)
# =============================================================================

class PoolSerializer(serializers.ModelSerializer):
    """
    Сериализатор для балансов пула.
    """
    class Meta:
        model = Pool
        fields = ('exchange', 'coin_name', 'balance', 'last_updated')


class TradeBookSerializer(serializers.ModelSerializer):
    """
    Сериализатор для книги сделок.
    """
    class Meta:
        model = TradeBook
        fields = ('exchange', 'coin_name', 'side', 'quantity', 'price', 'total', 'profit', 'timestamp')


class RebalanceSerializer(serializers.ModelSerializer):
    """
    Сериализатор для истории ребалансов.
    """
    class Meta:
        model = Rebalance
        fields = '__all__'


class BotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bot
        fields = ['id', 'name', 'title', 'is_active']


class BotStatsSerializer(serializers.Serializer):
    """
    Сериализатор для статистики бота (не привязан к модели).
    """
    total_trades_24h = serializers.IntegerField()
    total_profit_24h = serializers.DecimalField(max_digits=20, decimal_places=8)
    profit_percent_24h = serializers.DecimalField(max_digits=10, decimal_places=4)
    # Поле для графика, как вы и просили
    trades_timeline = serializers.ListField(
        child=serializers.DictField(child=serializers.IntegerField()),
        help_text="Данные для построения графика: список словарей {'hour': H, 'trades': N}"
    )


# --- Market Analytics Serializers (Public API) ---

class MarketSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketSummary
        fields = (
            'total_market_cap',
            'total_volume_24h',
            'btc_dominance',
            'eth_dominance',
            'market_cap_change_24h',
            'updated_at',
        )

class TrendingCoinSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendingCoin
        fields = (
            'coingecko_id',
            'symbol',
            'name',
            'price',
            'market_cap',
            'volume_24h',
            'price_change_24h',
            'image_url',
            'updated_at',
        )


# =============================================================================
# INTERNAL API SERIALIZERS (for Node.js Bots)
# =============================================================================

class ReportTradeSerializer(serializers.Serializer):
    """
    Сериализатор для валидации данных о сделке от бота.
    """
    bot_name = serializers.CharField(max_length=100)
    exchange = serializers.CharField(max_length=100)
    coin_name = serializers.CharField(max_length=50)
    side = serializers.ChoiceField(choices=['BUY', 'SELL'])
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    price = serializers.DecimalField(max_digits=20, decimal_places=8)
    total = serializers.DecimalField(max_digits=20, decimal_places=8)
    profit = serializers.DecimalField(max_digits=20, decimal_places=8, required=False, default=0)

    def validate_bot_name(self, value):
        # В будущем здесь можно добавить проверку, что бот с таким именем существует
        return value


class ReportRebalanceSerializer(serializers.Serializer):
    """
    Сериализатор для валидации данных о ребалансе от бота.
    """
    bot_name = serializers.CharField(max_length=100)
    from_exchange = serializers.CharField(max_length=100)
    to_exchange = serializers.CharField(max_length=100)
    coin_name = serializers.CharField(max_length=50)
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    commission = serializers.DecimalField(max_digits=20, decimal_places=8)

    def validate_bot_name(self, value):
        # В будущем здесь можно добавить проверку, что бот с таким именем существует
        return value


# --- Market Analytics Serializers (Internal Reporting API) ---

class MarketSummaryReportSerializer(serializers.Serializer):
    total_market_cap = serializers.DecimalField(max_digits=30, decimal_places=2)
    total_volume_24h = serializers.DecimalField(max_digits=30, decimal_places=2)
    btc_dominance = serializers.DecimalField(max_digits=5, decimal_places=2)
    eth_dominance = serializers.DecimalField(max_digits=5, decimal_places=2)
    market_cap_change_24h = serializers.DecimalField(max_digits=10, decimal_places=4)

    def create(self, validated_data):
        # Using update_or_create to handle the single-row nature of MarketSummary
        summary, _ = MarketSummary.objects.update_or_create(
            pk=1,  # Assuming a fixed primary key for the single summary row
            defaults=validated_data
        )
        return summary

class TrendingCoinReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrendingCoin
        fields = (
            'coingecko_id',
            'symbol',
            'name',
            'price',
            'market_cap',
            'volume_24h',
            'price_change_24h',
            'image_url',
        )
