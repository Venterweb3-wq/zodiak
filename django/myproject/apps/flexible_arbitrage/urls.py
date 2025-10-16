# urls.py 
from django.urls import path
from .views import (
    RequestFlexibleTemporaryWalletView,
    FlexibleWithdrawView,
    FlexibleStatsView,
    FlexibleDepositsHistoryView,
    FlexibleWithdrawalsHistoryView,
    FlexiblePayoutsHistoryView,
    NotifyFlexibleDepositView,
    NotifyFlexibleSweepStatusView,
    PendingFlexibleDepositWalletsListView,
    FlexibleTemporaryWalletEncryptedKeyView
)

app_name = 'flexible_arbitrage'

urlpatterns = [
    path('deposit/request-wallet/', RequestFlexibleTemporaryWalletView.as_view(), name='flexible-request-temp-wallet'),
    path('withdraw/', FlexibleWithdrawView.as_view(), name='flexible-withdraw'),
    path('stats/', FlexibleStatsView.as_view(), name='flexible-stats'),
    path('history/deposits/', FlexibleDepositsHistoryView.as_view(), name='flexible-deposits-history'),
    path('history/withdrawals/', FlexibleWithdrawalsHistoryView.as_view(), name='flexible-withdrawals-history'),
    path('history/payouts/', FlexiblePayoutsHistoryView.as_view(), name='flexible-payouts-history'),
    path('temp-wallets/notify-deposit/', NotifyFlexibleDepositView.as_view(), name='flexible-notify-deposit'),
    path('temp-wallets/notify-sweep/', NotifyFlexibleSweepStatusView.as_view(), name='flexible-notify-sweep'),
    path('temp-wallets/pending-deposit/', PendingFlexibleDepositWalletsListView.as_view(), name='flexible-pending-wallets'),
    path('temp-wallets/<int:wallet_id>/encrypted-key/', FlexibleTemporaryWalletEncryptedKeyView.as_view(), name='flexible-temp-wallet-key'),
] 