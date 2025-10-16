# 🌐 API Endpoints - Полная сводка

## 🔐 Аутентификация и регистрация

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| POST | `/api/auth/register/` | `RegisterView` | `RegisterSerializer` | `AllowAny` | `AnonRateThrottle` | Регистрация с реферальным кодом и CAPTCHA |
| POST | `/api/auth/login/` | `LoginView` | `LoginSerializer` | `AllowAny` | `AnonRateThrottle` | Вход с поддержкой 2FA и доверенных устройств |
| GET | `/api/auth/activate/<uid>/<token>/` | `VerifyEmailView` | - | `AllowAny` | - | Подтверждение email |
| POST | `/api/auth/send-email-verification/` | `ResendVerificationEmailView` | - | `IsAuthenticated` | `UserRateThrottle` | Повторная отправка письма подтверждения |

## 🔐 Двухфакторная аутентификация (2FA)

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| POST | `/api/auth/2fa/enable/` | `Enable2FAView` | `Enable2FASerializer` | `IsAuthenticated` | `UserRateThrottle` | Генерация секрета 2FA |
| POST | `/api/auth/2fa/confirm/` | `Confirm2FAView` | `Confirm2FASerializer` | `IsAuthenticated` | `UserRateThrottle` | Активация 2FA с TOTP кодом |
| POST | `/api/auth/2fa/reset/request/` | `Request2FAResetView` | `Request2FAResetSerializer` | `AllowAny` | `AnonRateThrottle` | Запрос сброса 2FA на email |
| POST | `/api/auth/2fa/reset/confirm/` | `Confirm2FAResetView` | `Confirm2FAResetSerializer` | `AllowAny` | `AnonRateThrottle` | Подтверждение сброса 2FA |

## 👤 Профиль и безопасность

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/auth/profile/` | `ProfileView` | `UserProfileSerializer` | `IsAuthenticated` | `UserRateThrottle` | Получение профиля с агрегированными данными |
| PATCH | `/api/auth/profile/` | `ProfileView` | `UserProfileUpdateSerializer` | `IsAuthenticated` | `UserRateThrottle` | Обновление профиля |
| GET | `/api/auth/security-status/` | `SecurityStatusView` | `SecurityStatusSerializer` | `IsAuthenticated` | `UserRateThrottle` | Статус безопасности |
| GET | `/api/auth/login-history/` | `LoginHistoryView` | `LoginHistorySerializer` | `IsAuthenticated` | `UserRateThrottle` | История входов (последние 20) |
| GET | `/api/auth/activity-log/` | `ActivityLogView` | `ActivityLogSerializer` | `IsAuthenticated` | `UserRateThrottle` | Лог активности (последние 20) |

## 📱 Управление устройствами

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| POST | `/api/auth/verify-device/` | `VerifyDeviceView` | `VerifyDeviceSerializer` | `AllowAny` | `AnonRateThrottle` | Подтверждение нового устройства OTP кодом |
| GET | `/api/auth/trusted-devices/` | `TrustedDeviceManagementView` | `TrustedDeviceSerializer` | `IsAuthenticated` | `UserRateThrottle` | Список доверенных устройств |
| DELETE | `/api/auth/trusted-devices/<id>/` | `TrustedDeviceManagementView` | - | `IsAuthenticated` | `UserRateThrottle` | Удаление доверенного устройства |

## 🤖 Внутренние API (Node.js боты)

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/auth/strategies/list/` | `InvestmentStrategyListView` | `InvestmentStrategySerializer` | `IsNodeWorker` | - | Список активных стратегий |
| POST | `/api/auth/wallets/update-status/` | `UpdateWalletStatusView` | - | `IsNodeWorker` | - | Обновление статуса кошельков |

## 🎁 Реферальная система

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/referrals/dashboard/` | `ReferralDashboardView` | `ReferralDashboardSerializer` | `IsAuthenticated` | `UserRateThrottle` | Дашборд рефералов с статистикой (настройки из ReferralSettings) |

## 📈 Кросс-арбитраж

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/cross-arbitrage/status/` | `InvestmentStatusView` | `InvestmentAccountSerializer` | `IsAuthenticated` | - | Статус инвестиционных счетов |
| GET | `/api/cross-arbitrage/config/` | `InvestmentConfigView` | `InvestmentConfigPublicSerializer` | `IsAuthenticated` | - | Конфигурация стратегии |
| POST | `/api/cross-arbitrage/deposit/` | `CreateDepositView` | `CreateDepositSerializer` | `IsAuthenticated` | - | Создание депозита |
| GET | `/api/cross-arbitrage/deposits/history/` | `InvestmentDepositHistoryView` | `InvestmentDepositSerializer` | `IsAuthenticated` | - | История депозитов |
| POST | `/api/cross-arbitrage/activate/` | `ActivateInvestmentView` | `ActivateInvestmentSerializer` | `IsAuthenticated` | - | Активация инвестиции |
| GET | `/api/cross-arbitrage/payouts/history/` | `PayoutHistoryView` | `DailyPayoutSerializer` | `IsAuthenticated` | - | История выплат |
| GET | `/api/cross-arbitrage/payouts/history/successful/` | `SuccessfulDailyPayoutHistoryView` | `DailyPayoutSerializer` | `IsAuthenticated` | - | Успешные выплаты |
| PATCH | `/api/cross-arbitrage/payouts/<id>/update/` | `PayoutUpdateView` | `PayoutUpdateSerializer` | `IsNodeWorker` | - | Обновление статуса выплаты |
| POST | `/api/cross-arbitrage/withdraw/deposit/` | `WithdrawDepositView` | `WithdrawDepositSerializer` | `IsAuthenticated` | - | Запрос на вывод |
| GET | `/api/cross-arbitrage/withdrawals/history/` | `WithdrawalHistoryView` | `WithdrawalRequestSerializer` | `IsAuthenticated` | - | История выводов |
| PATCH | `/api/cross-arbitrage/withdrawal-requests/<id>/update_status/` | `WithdrawalRequestUpdateView` | `WithdrawalRequestUpdateSerializer` | `IsNodeWorker` | - | Обновление статуса вывода |
| POST | `/api/cross-arbitrage/temp-wallets/request/` | `RequestTemporaryWalletView` | `RequestTemporaryWalletSerializer` | `IsAuthenticated` | - | Запрос временного кошелька |
| GET | `/api/cross-arbitrage/temp-wallets/list/` | `UserTemporaryWalletsListView` | `TemporaryWalletSerializer` | `IsAuthenticated` | - | Список временных кошельков |
| POST | `/api/cross-arbitrage/temp-wallets/notify-deposit/` | `NotifyDepositView` | `NotifyDepositSerializer` | `IsNodeWorker` | - | Уведомление о депозите |
| POST | `/api/cross-arbitrage/temp-wallets/notify-sweep/` | `NotifySweepStatusView` | `NotifySweepStatusSerializer` | `IsNodeWorker` | - | Уведомление о свипе |
| GET | `/api/cross-arbitrage/temp-wallets/pending-deposit/` | `PendingDepositWalletsListView` | `PendingTemporaryWalletSerializer` | `IsNodeWorker` | - | Ожидающие депозиты |
| GET | `/api/cross-arbitrage/temp-wallets/<id>/encrypted-key/` | `TemporaryWalletEncryptedKeyView` | - | `IsNodeWorker` | - | Получение зашифрованного ключа |
| GET | `/api/cross-arbitrage/payouts/<id>/status/` | `PayoutStatusView` | - | `IsAuthenticated` | - | Статус выплаты |
| GET | `/api/cross-arbitrage/withdrawals/<id>/status/` | `WithdrawalRequestStatusView` | - | `IsAuthenticated` | - | Статус вывода |

## 🔄 Гибкий арбитраж

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| POST | `/api/flexible/deposit/request-wallet/` | `RequestFlexibleTemporaryWalletView` | `RequestFlexibleTemporaryWalletSerializer` | `IsAuthenticated` | - | Запрос временного кошелька |
| POST | `/api/flexible/withdraw/` | `FlexibleWithdrawView` | `FlexibleWithdrawalCreateSerializer` | `IsAuthenticated` | - | Запрос на вывод |
| GET | `/api/flexible/stats/` | `FlexibleStatsView` | `FlexibleInvestmentAccountStatsSerializer` | `IsAuthenticated` | - | Статистика счета |
| GET | `/api/flexible/history/deposits/` | `FlexibleDepositsHistoryView` | `FlexibleDepositHistorySerializer` | `IsAuthenticated` | - | История депозитов |
| GET | `/api/flexible/history/withdrawals/` | `FlexibleWithdrawalsHistoryView` | `FlexibleWithdrawalHistorySerializer` | `IsAuthenticated` | - | История выводов |
| GET | `/api/flexible/history/payouts/` | `FlexiblePayoutsHistoryView` | `FlexiblePayoutHistorySerializer` | `IsAuthenticated` | - | История выплат |
| POST | `/api/flexible/temp-wallets/notify-deposit/` | `NotifyFlexibleDepositView` | `NotifyFlexibleDepositSerializer` | `IsNodeWorker` | - | Уведомление о депозите |
| POST | `/api/flexible/temp-wallets/notify-sweep/` | `NotifyFlexibleSweepStatusView` | `NotifyFlexibleSweepStatusSerializer` | `IsNodeWorker` | - | Уведомление о свипе |
| GET | `/api/flexible/temp-wallets/pending-deposit/` | `PendingFlexibleDepositWalletsListView` | `PendingFlexibleTemporaryWalletSerializer` | `IsNodeWorker` | - | Ожидающие депозиты |
| GET | `/api/flexible/temp-wallets/<id>/encrypted-key/` | `FlexibleTemporaryWalletEncryptedKeyView` | - | `IsNodeWorker` | - | Получение зашифрованного ключа |

## 🤖 Bot Gateway - Публичные API

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/bot-gateway/<bot_slug>/pool/` | `PoolListView` | `PoolSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Балансы пулов |
| GET | `/api/bot-gateway/<bot_slug>/trades/` | `TradeBookListView` | `TradeBookSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Книга сделок |
| GET | `/api/bot-gateway/<bot_slug>/rebalances/` | `RebalanceListView` | `RebalanceSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | История ребалансов |
| GET | `/api/bot-gateway/<bot_slug>/stats/` | `BotStatsView` | `BotStatsSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Статистика бота |
| GET | `/api/bot-gateway/<bot_slug>/status/` | `BotStatusView` | - | `IsAuthenticated` + `HasActiveBotStrategy` | - | Статус доступа к боту |

## 📊 Bot Gateway - Аналитика (Flexible Arbitrage)

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/bot-gateway/flexible_arbitrage/summary/` | `MarketSummaryView` | `MarketSummarySerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Рыночная сводка |
| GET | `/api/bot-gateway/flexible_arbitrage/trending/` | `TrendingCoinListView` | `TrendingCoinSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Трендовые монеты |
| GET | `/api/bot-gateway/flexible_arbitrage/top-gainers/` | `TopGainersView` | `TrendingCoinSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Топ растущих |
| GET | `/api/bot-gateway/flexible_arbitrage/top-losers/` | `TopLosersView` | `TrendingCoinSerializer` | `IsAuthenticated` + `HasActiveBotStrategy` | - | Топ падающих |

## 🤖 Bot Gateway - Внутренние API (Node.js)

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/api/internal/bot-gateway/settings/<bot_name>/` | `BotSettingsView` | - | `IsBotWorker` | - | Настройки бота |
| POST | `/api/internal/bot-gateway/report/trade/` | `ReportDataView` | `ReportTradeSerializer` | `IsBotWorker` | - | Отчет о сделке |
| POST | `/api/internal/bot-gateway/report/rebalance/` | `ReportDataView` | `ReportRebalanceSerializer` | `IsBotWorker` | - | Отчет о ребалансе |
| POST | `/api/internal/bot-gateway/report/market-summary/` | `ReportMarketSummaryView` | `MarketSummaryReportSerializer` | `IsBotWorker` | - | Рыночные данные |
| POST | `/api/internal/bot-gateway/report/trending-coins/` | `ReportTrendingCoinsView` | `TrendingCoinReportSerializer` | `IsBotWorker` | - | Трендовые монеты |

## 📊 Мониторинг

| Метод | Путь | View/Класс | Сериализатор | Permissions | Throttle | Описание |
|-------|------|------------|--------------|-------------|----------|----------|
| GET | `/metrics/` | Django Prometheus | - | - | - | Prometheus метрики |

## 🔧 Throttling Scopes

| Scope | Лимит | Применение |
|-------|-------|------------|
| `anon` | 20 запросов/минуту | Анонимные пользователи (регистрация, вход) |
| `user` | 100 запросов/минуту | Аутентифицированные пользователи |
| `login` | 5 попыток/час | Попытки входа (django-axes) |
| `sensitive` | 3 попытки/час | Сброс 2FA, смена пароля |

## 🛡️ Permissions

| Permission | Описание | Применение |
|------------|----------|------------|
| `AllowAny` | Доступ всем | Публичные эндпоинты |
| `IsAuthenticated` | Только аутентифицированные | Защищенные эндпоинты |
| `IsNodeWorker` | Только Node.js боты | Внутренние API |
| `HasActiveBotStrategy` | Активная инвестиционная стратегия | Bot Gateway API |

---

**Связанные документы:**
- [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md) - обзор архитектуры
- [MODELS_MAP.md](./MODELS_MAP.md) - схема моделей данных
- [SECURITY_NOTES.md](./SECURITY_NOTES.md) - политика безопасности
