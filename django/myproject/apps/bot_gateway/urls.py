from django.urls import path, include
from .views import (
    PoolListView, TradeBookListView, RebalanceListView, BotStatsView,
    BotStatusView, BotSettingsView, ReportDataView,
    # Analytics Views
    MarketSummaryView, TrendingCoinListView, TopGainersView, TopLosersView,
    # Analytics Internal Views
    ReportMarketSummaryView, ReportTrendingCoinsView,
)

app_name = 'bot_gateway'

# URLs for standard trading bots (cross_arbitrage, etc.)
public_patterns = [
    path('pool/', PoolListView.as_view(), name='pool-list'),
    path('trades/', TradeBookListView.as_view(), name='trade-book-list'),
    path('rebalances/', RebalanceListView.as_view(), name='rebalance-list'),
    path('stats/', BotStatsView.as_view(), name='stats'),
    path('status/', BotStatusView.as_view(), name='status'),
]

# URLs specific to the flexible_arbitrage analytics frontend
flexible_arbitrage_patterns = [
    path('summary/', MarketSummaryView.as_view(), {'bot_slug': 'flexible_arbitrage'}),
    path('trending/', TrendingCoinListView.as_view(), {'bot_slug': 'flexible_arbitrage'}),
    path('top-gainers/', TopGainersView.as_view(), {'bot_slug': 'flexible_arbitrage'}),
    path('top-losers/', TopLosersView.as_view(), {'bot_slug': 'flexible_arbitrage'}),
]

# URLs for internal bot worker consumption, protected by a secret token
internal_patterns = [
    path('settings/<str:bot_name>/', BotSettingsView.as_view(), name='internal-bot-settings'),
    path('report/trade/', ReportDataView.as_view(), {'report_type': 'trade'}),
    path('report/rebalance/', ReportDataView.as_view(), {'report_type': 'rebalance'}),
    # Analytics reporting endpoints
    path('report/market-summary/', ReportMarketSummaryView.as_view(), name='internal-report-summary'),
    path('report/trending-coins/', ReportTrendingCoinsView.as_view(), name='internal-report-trending'),
]

urlpatterns = [
    # Public APIs for different bot types
    path('flexible_arbitrage/', include(flexible_arbitrage_patterns)),
    path('<str:bot_slug>/', include(public_patterns)),
]
