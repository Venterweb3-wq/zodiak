from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    VerifyEmailView,
    Enable2FAView,
    Confirm2FAView,
    ProfileView,
    SecurityStatusView,
    ResendVerificationEmailView,
    Request2FAResetView,
    Confirm2FAResetView,
    LoginHistoryView,
    ActivityLogView,
    TrustedDeviceManagementView,
    VerifyDeviceView,
    InvestmentStrategyListView,
    UpdateWalletStatusView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('activate/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify-email'),
    path('2fa/enable/', Enable2FAView.as_view(), name='enable-2fa'),
    path('2fa/confirm/', Confirm2FAView.as_view(), name='confirm-2fa'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('security-status/', SecurityStatusView.as_view(), name='security-status'),
    path('send-email-verification/', ResendVerificationEmailView.as_view(), name='send-email-verification'),
    path('2fa/reset/request/', Request2FAResetView.as_view(), name='2fa-reset-request'),
    path('2fa/reset/confirm/', Confirm2FAResetView.as_view(), name='2fa-reset-confirm'),
    path('login-history/', LoginHistoryView.as_view(), name='login-history'),
    path('activity-log/', ActivityLogView.as_view(), name='activity-log'),
    path('trusted-devices/', TrustedDeviceManagementView.as_view(), name='trusted-devices-list'),
    path('trusted-devices/<int:device_id>/', TrustedDeviceManagementView.as_view(), name='trusted-device-detail'),
    path('verify-device/', VerifyDeviceView.as_view(), name='verify-device'),
    path('strategies/list/', InvestmentStrategyListView.as_view(), name='strategies-list'),
    path('wallets/update-status/', UpdateWalletStatusView.as_view(), name='update-wallet-status'),
]
