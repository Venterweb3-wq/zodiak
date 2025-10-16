import datetime
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.db.models import Count, Sum, F
from django.db.models.functions import TruncHour
from django.core import serializers as core_serializers
import json

from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, GenericAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import Bot, Pool, TradeBook, Rebalance, MarketSummary, TrendingCoin
from .serializers import (
    BotSerializer,
    PoolSerializer,
    TradeBookSerializer,
    RebalanceSerializer,
    BotStatsSerializer,
    ReportTradeSerializer,
    ReportRebalanceSerializer,
    # Analytics Serializers
    MarketSummarySerializer,
    TrendingCoinSerializer,
    MarketSummaryReportSerializer,
    TrendingCoinReportSerializer,
)
from myproject.apps.core.models import User

# Словарь для сопоставления имени бота с его reverse-атрибутом настроек
BOT_SETTINGS_ACCESSORS = {
    'cross_arbitrage': 'cross_arbitrage_settings',
    'spot_scalping': 'spot_scalping_settings',
    'defi_bot': 'defi_settings',
    'flexible_arbitrage': 'flexible_arbitrage_settings',
    'inter_exchange': 'inter_exchange_settings',
}

# Новый словарь для сопоставления слага стратегии с related_name инвестиционного счета
STRATEGY_ACCOUNT_ACCESSORS = {
    'cross_arbitrage': 'investment_accounts_cross_arbitrage',
    'spot_scalping': 'investment_accounts_spot_scalping',
    'defi_bot': 'investment_accounts_defi_bot',
    'flexible_arbitrage': 'flexible_investment_accounts',
    'inter_exchange': 'investment_accounts_inter_exchange',
}

# =============================================================================
# PERMISSIONS
# =============================================================================

class IsBotWorker(permissions.BasePermission):
    """
    Permission to only allow access to requests from our bot workers.
    It checks for a secret token in the request headers.
    """
    def has_permission(self, request, view):
        # Сравниваем токен из заголовка с токеном из настроек Django
        bot_token = request.headers.get("X-Bot-Token")
        return bot_token and bot_token == settings.BOT_WORKER_TOKEN


class HasActiveBotStrategy(permissions.BasePermission):
    """
    Checks if the user has an active investment corresponding to the bot.
    Handles different activation logic for different strategies.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        bot_slug = view.kwargs.get("bot_slug")
        if not bot_slug:
            return False

        # Используем маппинг для получения правильного related_name
        related_manager_name = STRATEGY_ACCOUNT_ACCESSORS.get(bot_slug)
        if not related_manager_name or not hasattr(request.user, related_manager_name):
            return False

        investment_account_manager = getattr(request.user, related_manager_name)

        # Особая логика активации для flexible_arbitrage: активен, если баланс > 0
        if bot_slug == 'flexible_arbitrage':
            return investment_account_manager.filter(balance__gt=Decimal('0.0')).exists()
        
        # Стандартная логика для остальных ботов: проверяем флаг `activated`
        try:
            return investment_account_manager.filter(activated=True).exists()
        except Exception:
            # Если у модели нет поля `activated` или другая ошибка
            return False

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_bot_or_404(bot_slug):
    """Utility to get a bot by slug or raise NotFound."""
    try:
        return Bot.objects.get(investment_tool_slug=bot_slug)
    except Bot.DoesNotExist:
        raise NotFound(detail=f"Bot with slug '{bot_slug}' not found.")

# =============================================================================
# PUBLIC API VIEWS (for Frontend)
# =============================================================================

class BaseBotDataView(ListAPIView):
    """
    Base view for all public-facing bot data endpoints.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]

    def get_queryset(self):
        bot_slug = self.kwargs['bot_slug']
        bot = get_bot_or_404(bot_slug)
        # `self.model` should be defined in the child class
        return self.model.objects.filter(bot=bot)

class PoolListView(BaseBotDataView):
    serializer_class = PoolSerializer
    model = Pool

class TradeBookListView(BaseBotDataView):
    serializer_class = TradeBookSerializer
    model = TradeBook

class RebalanceListView(BaseBotDataView):
    serializer_class = RebalanceSerializer
    model = Rebalance


class BotStatusView(APIView):
    """
    A simple endpoint for the frontend to check if the user has access
    to a specific bot's data.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]

    def get(self, request, *args, **kwargs):
        # The permission class does all the work. If we are here, access is granted.
        return Response({"has_access": True}, status=status.HTTP_200_OK)


class BotStatsView(APIView):
    """
    Provides aggregated statistics for a bot over the last 24 hours.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]

    def get(self, request, bot_slug):
        bot = get_bot_or_404(bot_slug)
        since = timezone.now() - datetime.timedelta(hours=24)

        trades_24h = TradeBook.objects.filter(bot=bot, timestamp__gte=since)
        
        total_trades_24h = trades_24h.count()
        total_profit_24h = trades_24h.aggregate(total_profit=Sum('profit'))['total_profit'] or 0

        # Simple profit % calculation (can be improved)
        # Here we need a starting balance, which is complex. Let's stub it for now.
        profit_percent_24h = 0.0 

        # Data for the trades-per-hour chart
        trades_timeline = (
            trades_24h
            .annotate(hour=TruncHour('timestamp'))
            .values('hour')
            .annotate(trades=Count('id'))
            .order_by('hour')
        )

        serializer = BotStatsSerializer(data={
            "total_trades_24h": total_trades_24h,
            "total_profit_24h": total_profit_24h,
            "profit_percent_24h": profit_percent_24h,
            "trades_timeline": list(trades_timeline)
        })
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# --- Analytics Public Views (for flexible_arbitrage strategy) ---

class MarketSummaryView(APIView):
    """
    Returns the latest global market summary.
    This endpoint is specific to flexible_arbitrage and requires its activation.
    The `bot_slug` kwarg is manually set in urls.py for the permission check.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]

    def get(self, request, *args, **kwargs):
        summary = MarketSummary.objects.first()
        if not summary:
            return Response({"error": "Market data is not available yet."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MarketSummarySerializer(summary)
        return Response(serializer.data)

class TrendingCoinListView(ListAPIView):
    """
    Returns a list of trending coins, ordered by market cap.
    The `bot_slug` kwarg is manually set in urls.py for the permission check.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]
    serializer_class = TrendingCoinSerializer
    queryset = TrendingCoin.objects.all().order_by('-market_cap')

class TopGainersView(ListAPIView):
    """
    Returns the top 20 trending coins with the highest price increase in 24h.
    The `bot_slug` kwarg is manually set in urls.py for the permission check.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]
    serializer_class = TrendingCoinSerializer
    queryset = TrendingCoin.objects.order_by('-price_change_24h')[:20]

class TopLosersView(ListAPIView):
    """
    Returns the top 20 trending coins with the highest price decrease in 24h.
    The `bot_slug` kwarg is manually set in urls.py for the permission check.
    """
    permission_classes = [permissions.IsAuthenticated, HasActiveBotStrategy]
    serializer_class = TrendingCoinSerializer
    queryset = TrendingCoin.objects.order_by('price_change_24h')[:20]


# =============================================================================
# INTERNAL API VIEWS (for Node.js Bots)
# =============================================================================

class BotSettingsView(APIView):
    """
    Endpoint for Node.js bots to fetch their configuration.
    """
    permission_classes = [IsBotWorker]

    def get(self, request, bot_name):
        try:
            bot = Bot.objects.get(name=bot_name, is_active=True)
            
            # Динамически получаем доступ к правильному менеджеру настроек
            accessor_name = BOT_SETTINGS_ACCESSORS.get(bot.name)
            if not accessor_name:
                raise NotFound(f"Settings accessor for bot '{bot_name}' not configured.")

            settings_instance = getattr(bot, accessor_name)
            
            # Сериализуем объект настроек.
            # `core_serializers.serialize` возвращает строку JSON, но внутри списка.
            settings_data_json = core_serializers.serialize('json', [settings_instance])
            
            # Декодируем JSON, чтобы извлечь объект из списка и удалить служебные поля Django.
            settings_data = json.loads(settings_data_json)[0]
            
            # Удаляем поля 'pk' и 'model', оставляя только 'fields'.
            final_data = settings_data.get('fields', {})
            
            # Также удаляем поле 'bot', так как бот его и так знает.
            final_data.pop('bot', None)

            return Response(final_data)
        except Bot.DoesNotExist:
            raise NotFound(f"Active bot with name '{bot_name}' not found.")
        except AttributeError:
            # Это сработает, если у бота по какой-то причине нет связанного объекта настроек
            raise NotFound(f"Settings for active bot '{bot_name}' not found.")


class ReportDataView(APIView):
    """
    Endpoint for Node.js bots to report trades and rebalances.
    """
    permission_classes = [IsBotWorker]

    def post(self, request, report_type):
        if report_type == "trade":
            serializer = ReportTradeSerializer(data=request.data)
        elif report_type == "rebalance":
            serializer = ReportRebalanceSerializer(data=request.data)
        else:
            return Response({"error": "Invalid report type"}, status=status.HTTP_400_BAD_REQUEST)
            
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        bot = get_object_or_404(Bot, name=data['bot_name'])

        try:
            with transaction.atomic():
                if report_type == "trade":
                    self._handle_trade(bot, data)
                elif report_type == "rebalance":
                    self._handle_rebalance(bot, data)
        except Exception as e:
            # Log the exception e
            return Response({"error": "Failed to process report.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"status": "ok"}, status=status.HTTP_201_CREATED)

    def _handle_trade(self, bot, data):
        """
        Creates a TradeBook entry and updates Pool balances for a trade.
        """
        # Create the trade record
        TradeBook.objects.create(
            bot=bot,
            exchange=data['exchange'],
            coin_name=data['coin_name'],
            side=data['side'],
            quantity=data['quantity'],
            price=data['price'],
            total=data['total'],
            profit=data.get('profit', 0)
        )

        # Update pool balances
        # Example: for ETH/USDT pair
        base_coin, quote_coin = data['coin_name'].split('/')
        
        pool_base, _ = Pool.objects.get_or_create(bot=bot, exchange=data['exchange'], coin_name=base_coin, defaults={'balance': 0})
        pool_quote, _ = Pool.objects.get_or_create(bot=bot, exchange=data['exchange'], coin_name=quote_coin, defaults={'balance': 0})

        if data['side'] == 'BUY':
            pool_base.balance += data['quantity']
            pool_quote.balance -= data['total']
        else: # SELL
            pool_base.balance -= data['quantity']
            pool_quote.balance += data['total']
        
        pool_base.save()
        pool_quote.save()

    def _handle_rebalance(self, bot, data):
        """
        Creates a Rebalance entry and updates Pool balances.
        """
        Rebalance.objects.create(
            bot=bot,
            from_exchange=data['from_exchange'],
            to_exchange=data['to_exchange'],
            coin_name=data['coin_name'],
            quantity=data['quantity'],
            commission=data['commission']
        )
        
        # Update balances
        pool_from, _ = Pool.objects.get_or_create(bot=bot, exchange=data['from_exchange'], coin_name=data['coin_name'], defaults={'balance': 0})
        pool_to, _ = Pool.objects.get_or_create(bot=bot, exchange=data['to_exchange'], coin_name=data['coin_name'], defaults={'balance': 0})
        
        pool_from.balance -= (data['quantity'] + data['commission'])
        pool_to.balance += data['quantity']
        
        pool_from.save()
        pool_to.save()

    def _update_pool_balance(self, bot, exchange, coin, quantity_delta):
        pool_item, created = Pool.objects.get_or_create(
            bot=bot,
            exchange=exchange,
            coin_name=coin,
            defaults={'balance': quantity_delta}
        )
        if not created:
            pool_item.balance = F('balance') + quantity_delta
            pool_item.save(update_fields=['balance'])


# --- Analytics Internal Reporting Views ---

class ReportMarketSummaryView(GenericAPIView):
    """
    Internal endpoint for the Node.js bot to report global market data.
    """
    permission_classes = [IsBotWorker]
    serializer_class = MarketSummaryReportSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "success"}, status=status.HTTP_200_OK)


class ReportTrendingCoinsView(GenericAPIView):
    """
    Internal endpoint for the Node.js bot to report trending coins data.
    This view performs bulk creation and updates for efficiency.
    """
    permission_classes = [IsBotWorker]
    serializer_class = TrendingCoinReportSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        incoming_ids = {item['coingecko_id'] for item in validated_data}
        existing_coins = TrendingCoin.objects.filter(coingecko_id__in=incoming_ids)
        existing_coins_map = {coin.coingecko_id: coin for coin in existing_coins}

        coins_to_create = []
        coins_to_update = []

        for item_data in validated_data:
            coingecko_id = item_data['coingecko_id']
            if coingecko_id in existing_coins_map:
                coin = existing_coins_map[coingecko_id]
                for key, value in item_data.items():
                    setattr(coin, key, value)
                coins_to_update.append(coin)
            else:
                coins_to_create.append(TrendingCoin(**item_data))
        
        with transaction.atomic():
            if coins_to_create:
                TrendingCoin.objects.bulk_create(coins_to_create)
            
            if coins_to_update:
                update_fields = [f.name for f in TrendingCoin._meta.get_fields() if not f.primary_key and f.name != 'coingecko_id']
                if 'updated_at' in update_fields:
                    update_fields.remove('updated_at')
                TrendingCoin.objects.bulk_update(coins_to_update, update_fields)
            
            TrendingCoin.objects.exclude(coingecko_id__in=incoming_ids).delete()

        return Response({
            "status": "success", 
            "created": len(coins_to_create), 
            "updated": len(coins_to_update)
        }, status=status.HTTP_200_OK)
