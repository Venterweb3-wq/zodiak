# Документация по API эндпоинтам приложения `core`

## Аутентификация и Регистрация

### 1. Регистрация нового пользователя
- **URL:** `/api/auth/register/`
- **Method:** `POST`
- **View:** `RegisterView`
- **Permissions:** `AllowAny` (Доступно всем)
- **Throttling:** `AnonRateThrottle` (Ограничение для анонимных пользователей)
- **Описание:** Регистрирует нового пользователя в системе. Пользователь создается неактивным (`is_active=False`), и ему отправляется письмо для подтверждения email. Используется reCAPTCHA.
- **Request Data (`RegisterSerializer`):**
  ```json
  {
      "username": "string (unique)",
      "email": "string (unique, valid email)",
      "password": "string (min 8 chars, 1 letter, 1 digit)",
      "confirm_password": "string (must match password)",
      "referred_code": "string (referral code of an existing active user, required)",
      "accept_terms": "boolean (must be true)",
      "marketing_optin": "boolean (optional, default false)",
      "captcha": "string (reCAPTCHA response token)"
  }
  ```
- **Success Response (201 CREATED):**
  ```json
  {
      "message": "Пользователь зарегистрирован. Пожалуйста, проверьте вашу почту для подтверждения email."
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: Ошибки валидации (неверный формат данных, пароли не совпадают, CAPTCHA не пройдена, email/username уже существуют, невалидный реферальный код и т.д.). Тело ответа содержит детали ошибок.
- **Логирование (`ActivityLog`):** `USER_REGISTERED`

### 2. Вход пользователя
- **URL:** `/api/auth/login/`
- **Method:** `POST`
- **View:** `LoginView`
- **Permissions:** `AllowAny`
- **Throttling:** `AnonRateThrottle`
- **Описание:** Аутентифицирует пользователя. Если 2FA включена, требуется дополнительно `token` (TOTP). Если устройство новое (не опознано по cookie `device_tkn`), пользователю отправляется OTP на email для верификации устройства, и возвращается статус `device_verification_required`.
- **Request Data (`LoginSerializer`):**
  ```json
  {
      "username": "string",
      "password": "string",
      "token": "string (optional, 6-digit TOTP code if 2FA is enabled)"
  }
  ```
- **Success Response (200 OK - если устройство доверенное или 2FA не требует OTP на этом шаге):**
  ```json
  {
      "message": "Успешный вход с доверенного устройства (cookie).", // или "Успешный вход"
      "username": "string",
      "device_trusted": true // или false, если логин произошел до новой системы cookie и опирался на старый device_id
  }
  ```
  *Примечание: Если используются JWT-токены, они также должны быть включены в успешный ответ.*
- **Response (202 ACCEPTED - если требуется верификация устройства):**
  ```json
  {
      "status": "device_verification_required",
      "message": "Это устройство не распознано. Код подтверждения был отправлен на ваш email.",
      "email": "user_email@example.com"
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: Неверные учетные данные, пользователь неактивен, неверный код 2FA, ошибки валидации сериализатора.
- **Логирование (`ActivityLog`):**
    - `USER_LOGGED_IN`: При успешном входе. `details` включают `method: "cookie_trusted_device"` или информацию о старом механизме.
    - `INVALID_DEVICE_COOKIE_ATTEMPT`: Если предоставлен невалидный `device_tkn` cookie.
    - `NEW_DEVICE_OTP_SENT`: Если cookie нет или он невалиден, и отправляется OTP.

### 3. Подтверждение Email
- **URL:** `/api/auth/activate/<str:uidb64>/<str:token>/`
- **Method:** `GET`
- **View:** `VerifyEmailView`
- **Permissions:** `AllowAny`
- **Описание:** Активирует учетную запись пользователя и подтверждает его email после перехода по ссылке из письма.
- **Request Data:** Параметры `uidb64` и `token` из URL.
- **Success Response (200 OK):**
  ```json
  {
      "message": "Email успешно подтверждён. Теперь вы можете войти." 
      // или "Email уже подтвержден и аккаунт активен."
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: `{"error": "Ссылка для подтверждения недействительна или истекла."}`
- **Логирование (`ActivityLog`):** `EMAIL_VERIFIED`

### 4. Повторная отправка письма для подтверждения Email
- **URL:** `/api/auth/send-email-verification/`
- **Method:** `POST`
- **View:** `ResendVerificationEmailView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Позволяет аутентифицированному пользователю, чей email еще не подтвержден, запросить повторную отправку письма для верификации.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  {
      "message": "Письмо с подтверждением отправлено повторно."
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: `{"message": "Ваш email уже подтвержден."}`
- **Логирование (`ActivityLog`):** Не логируется явно в этом эндпоинте, но отправка письма происходит.

### 5. Верификация устройства кодом из Email
- **URL:** `/api/auth/verify-device/`
- **Method:** `POST`
- **View:** `VerifyDeviceView`
- **Permissions:** `AllowAny`
- **Throttling:** `AnonRateThrottle`
- **Описание:** Пользователь отправляет код (OTP), полученный на email, для подтверждения нового устройства. В случае успеха, устройство добавляется в доверенные (создается/обновляется `TrustedDevice` с `device_token_hash`) и в браузер пользователя устанавливается cookie `device_tkn`.
- **Request Data (`VerifyDeviceSerializer`):**
  ```json
  {
      "email": "string (email пользователя)",
      "code": "string (OTP код из письма)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Устройство подтверждено. Успешный вход.",
      "username": "string"
  }
  ```
  *Примечание: Устанавливает cookie `device_tkn`.*
  *Если используются JWT-токены, они также должны быть включены в успешный ответ.*
- **Error Responses:**
    - `400 BAD REQUEST`: Неверный email или код, истекший код, не удалось идентифицировать устройство.
- **Логирование (`ActivityLog`):**
    - `DEVICE_VERIFICATION_FAILED`: Если не удалось сгенерировать fingerprint.
    - `DEVICE_VERIFIED_AND_LOGGED_IN`: При успешной верификации и логине.

## Двухфакторная аутентификация (2FA)

### 6. Инициация включения 2FA
- **URL:** `/api/auth/2fa/enable/`
- **Method:** `POST`
- **View:** `Enable2FAView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Генерирует секретный ключ TOTP и URI для пользователя. Эти данные должны быть показаны пользователю для добавления в Authenticator App. 2FA еще не активирована на этом шаге.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK) (`Enable2FASerializer` output):**
  ```json
  {
      "secret": "string (base32 encoded secret key)",
      "uri": "string (otpauth URI)"
  }
  ```
- **Логирование (`ActivityLog`):** Не логируется явно (можно добавить `2FA_SETUP_INITIATED`).

### 7. Подтверждение и активация 2FA
- **URL:** `/api/auth/2fa/confirm/`
- **Method:** `POST`
- **View:** `Confirm2FAView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Пользователь отправляет TOTP код из своего Authenticator App для проверки. Если код верен, 2FA активируется для пользователя.
- **Request Data (`Confirm2FASerializer`):**
  ```json
  {
      "token": "string (6-digit TOTP code)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "2FA успешно включен." 
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: Неверный код подтверждения, 2FA не инициализирован, 2FA уже включен.
- **Логирование (`ActivityLog`):** `2FA_ENABLED`

### 8. Запрос на сброс/отключение 2FA
- **URL:** `/api/auth/2fa/reset/request/`
- **Method:** `POST`
- **View:** `Request2FAResetView`
- **Permissions:** `AllowAny`
- **Throttling:** `AnonRateThrottle`
- **Описание:** Пользователь, у которого включена 2FA, может запросить код для ее сброса на свой email.
- **Request Data (`Request2FAResetSerializer`):**
  ```json
  {
      "email": "string (email пользователя)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Если ваш email зарегистрирован и 2FA активна, вы получите код сброса."
  }
  ```
  *Примечание: Ответ всегда одинаковый, чтобы не раскрывать существование email или статус 2FA.*
- **Error Responses:**
    - `400 BAD REQUEST`: Ошибки валидации email (например, неверный формат).
- **Логирование (`ActivityLog`):** Не логируется напрямую (но можно добавить `2FA_RESET_REQUESTED` после успешной отправки письма).

### 9. Подтверждение сброса/отключения 2FA
- **URL:** `/api/auth/2fa/reset/confirm/`
- **Method:** `POST`
- **View:** `Confirm2FAResetView`
- **Permissions:** `AllowAny`
- **Throttling:** `AnonRateThrottle`
- **Описание:** Пользователь отправляет email и код, полученный в письме, для отключения 2FA. При успехе 2FA отключается, и на аккаунт накладывается временное ограничение функционала.
- **Request Data (`Confirm2FAResetSerializer`):**
  ```json
  {
      "email": "string (email пользователя)",
      "code": "string (код из письма для сброса 2FA)"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Двухфакторная аутентификация успешно отключена. Вы можете войти, используя только пароль."
  }
  ```
- **Error Responses:**
    - `400 BAD REQUEST`: Неверный email или код, код истек, 2FA уже отключена.
- **Логирование (`ActivityLog`):**
    - `2FA_RESET_COMPLETED`
    - `2FA_DISABLED` (details: `{"reason": "reset_via_email_code"}`)

## Профиль пользователя и безопасность

### 10. Получение и обновление профиля пользователя
- **URL:** `/api/auth/profile/`
- **Method:** `GET`, `PATCH`
- **View:** `ProfileView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:**
    - `GET`: Возвращает данные профиля текущего аутентифицированного пользователя.
    - `PATCH`: Обновляет данные профиля текущего пользователя. Обновление ограничено, если активен `functionality_limited_until`.
- **Request Data (`PATCH` - `UserProfileUpdateSerializer`):**
  ```json
  {
      "username": "string (optional)",
      "first_name": "string (optional)",
      "last_name": "string (optional)",
      "language": "string (optional)",
      "theme": "string (optional)",
      "marketing_optin": "boolean (optional)"
      // email read-only в этом сериализаторе
  }
  ```
- **Success Response (`GET` - 200 OK, `UserProfileSerializer`):**
  ```json
  {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "email_verified": "boolean",
      "is_active": "boolean",
      "two_factor_enabled": "boolean",
      "referral_code": "string",
      "language": "string",
      "theme": "string",
      "referral_count": "integer",
      "marketing_optin": "boolean",
      "last_login_ip": "string (IP address)",
      "date_joined": "datetime string",
      "total_deposit_amount": "string (placeholder)",
      "total_payout_amount": "string (placeholder)",
      "active_investment": null, // (placeholder)
      "functionality_limited_until": "datetime string or null"
  }
  ```
- **Success Response (`PATCH` - 200 OK):**
  ```json
  {
      "message": "Профиль обновлён"
  }
  ```
- **Error Responses (`PATCH`):**
    - `400 BAD REQUEST`: Ошибки валидации.
    - `403 FORBIDDEN`: Если `functionality_limited_until` активен.
- **Логирование (`ActivityLog`):** `PROFILE_UPDATED` (при `PATCH`, если были изменения)

### 11. Статус безопасности пользователя
- **URL:** `/api/auth/security-status/`
- **Method:** `GET`
- **View:** `SecurityStatusView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Возвращает ключевые показатели безопасности для текущего пользователя.
- **Request Data:** Нет.
- **Success Response (200 OK - `SecurityStatusSerializer`):**
  ```json
  {
      "email_verified": "boolean",
      "two_factor_enabled": "boolean",
      "last_login_ip": "string (IP address)"
  }
  ```
- **Логирование (`ActivityLog`):** Не логируется.

### 12. Получение истории входов
- **URL:** `/api/auth/login-history/`
- **Method:** `GET`
- **View:** `LoginHistoryView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Возвращает список последних записей о входе для текущего пользователя (до 20 записей).
- **Request Data:** Нет.
- **Success Response (200 OK - список объектов `LoginHistorySerializer`):**
  ```json
  [
      {
          "timestamp": "datetime string",
          "ip_address": "string (IP address)",
          "user_agent": "string"
      },
      // ...
  ]
  ```
- **Логирование (`ActivityLog`):** Не логируется (создание записей происходит в `LoginView` и `VerifyDeviceView`).

### 13. Получение лога активности
- **URL:** `/api/auth/activity-log/`
- **Method:** `GET`
- **View:** `ActivityLogView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Возвращает список последних записей лога активности для текущего пользователя (до 20 записей).
- **Request Data:** Нет.
- **Success Response (200 OK - список объектов `ActivityLogSerializer`):**
  ```json
  [
      {
          "timestamp": "datetime string",
          "action_type": "string (key)",
          "get_action_type_display": "string (readable name)",
          "details": "json object or null",
          "ip_address": "string (IP address)"
      },
      // ...
  ]
  ```
- **Логирование (`ActivityLog`):** Не логируется (это эндпоинт для просмотра логов).

## Управление доверенными устройствами

### 14. Список доверенных устройств
- **URL:** `/api/auth/trusted-devices/`
- **Method:** `GET`
- **View:** `TrustedDeviceManagementView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Возвращает список доверенных устройств для текущего пользователя, отсортированных по дате последнего входа.
- **Request Data:** Нет.
- **Success Response (200 OK - список объектов `TrustedDeviceSerializer`):**
  ```json
  [
      {
          "id": "integer",
          "user_agent": "string",
          "ip_address": "string (IP address)",
          "added_at": "datetime string",
          "last_login_at": "datetime string"
      },
      // ...
  ]
  ```
- **Логирование (`ActivityLog`):** Не логируется.

### 15. Удаление доверенного устройства
- **URL:** `/api/auth/trusted-devices/<int:device_id>/`
- **Method:** `DELETE`
- **View:** `TrustedDeviceManagementView`
- **Permissions:** `IsAuthenticated`
- **Throttling:** `UserRateThrottle`
- **Описание:** Удаляет указанное доверенное устройство из списка текущего пользователя.
- **Request Data:** `device_id` из URL.
- **Success Response (204 NO CONTENT):** Пустое тело ответа.
- **Error Responses:**
    - `404 NOT FOUND`: `{"error": "Доверенное устройство не найдено или у вас нет прав на его удаление."}`
- **Логирование (`ActivityLog`):** `TRUSTED_DEVICE_REMOVED`

## Взаимодействие ядра (`core`) с другими приложениями

Приложение `core` является центральным узлом системы, обеспечивая управление пользователями, авторизацию и базовую бизнес-логику. Оно взаимодействует с другими приложениями через модели, API-эндпоинты и асинхронные задачи (Celery). Ниже описана логика взаимодействия с каждым из проанализированных приложений:

### 1. Приложение `p2p`
- **Назначение**: Приложение для P2P-операций (вероятно, торговля или обмен между пользователями).
- **Структура**: Содержит стандартные файлы Django (`models.py`, `views.py`), но на момент анализа файлы пустые или не содержат значимого кода.
- **Взаимодействие с `core`**: Не установлено из-за отсутствия данных. Предположительно, использует модель `User` из `core` для привязки операций к пользователям.

### 2. Приложение `referrals`
- **Назначение**: Управление реферальной системой, включая начисление бонусов за привлеченных пользователей.
- **Структура**: Содержит модели `InvestmentTool` (инструменты инвестиций) и `ReferralAccrual` (начисления бонусов), API-эндпоинт `ReferralDashboardView` для отображения статистики, и задачу Celery `process_referral_accruals` для начисления бонусов.
- **Взаимодействие с `core`**:
  - Использует модель `User` из `core` для определения рефералов и начисления бонусов (поля `recipient` и `source_user` в `ReferralAccrual`).
  - Статистика рефералов отображается через сериализатор `UserProfileSerializer` в `core` (поля `total_referrals`, `total_referral_earnings`).
  - Задача `process_referral_accruals` получает данные о прибыли из других приложений (например, `cross_arbitrage`, `flexible_arbitrage`) и начисляет бонусы, используя связи рефералов из `User`.

### 3. Приложение `flexible_arbitrage`
- **Назначение**: Управление гибкими инвестиционными счетами с возможностью внесения и вывода средств, а также начисления процентов.
- **Структура**: Содержит модели для временных кошельков (`FlexibleTemporaryWallet`), счетов (`FlexibleInvestmentAccount`), выплат (`FlexiblePayout`), депозитов (`FlexibleDeposit`) и выводов (`FlexibleWithdrawal`). API-эндпоинты для запроса кошельков, депозитов, выводов и статистики. Задача Celery `generate_flexible_payouts` для начисления процентов.
- **Взаимодействие с `core`**:
  - Использует модель `User` из `core` для привязки счетов и операций к пользователям.
  - Модель `InvestmentStrategy` из `core` может определять параметры стратегии `flexible_arbitrage` (например, через `strategy_key`).
  - API-эндпоинты `IsNodeWorker` из `core.permissions` используются для ограничения доступа к операциям, связанным с узлами (например, `NotifyFlexibleDepositView`).
  - Прибыль, начисленная через `generate_flexible_payouts`, может быть источником для реферальных бонусов в приложении `referrals` (см. `PROFIT_MODELS` в `referrals/tasks.py`).

### 4. Приложение `inter_exchange`
- **Назначение**: Управление инвестиционными счетами для межбиржевого арбитража с ежедневными выплатами.
- **Структура**: Содержит модели для счетов (`InvestmentAccount`), временных кошельков (`TemporaryWallet`), депозитов (`InvestmentDeposit`), выплат (`DailyPayout`), конфигурации (`InvestmentConfig`) и запросов на вывод (`WithdrawalRequest`). API-эндпоинты для управления счетами, депозитами, выводами и уведомлениями от узлов. Задачи Celery `generate_daily_payouts` и `publish_withdrawal_request` для выплат и обработки выводов.
- **Взаимодействие с `core`**:
  - Использует модель `User` из `core` для привязки счетов и операций.
  - Модель `InvestmentStrategy` из `core` может определять параметры стратегии `inter_exchange`.
  - API-эндпоинты используют `IsNodeWorker` из `core` для ограничения доступа узлов.
  - Прибыль, начисленная через `DailyPayout`, может быть источником для реферальных бонусов в `referrals` (см. `PROFIT_MODELS`).
  - Использует Redis-канал `payouts_inter_exchange` для асинхронной обработки выплат (связано с полем `redis_channel` в `InvestmentStrategy` из `core`).

### 5. Приложение `cross_arbitrage`
- **Назначение**: Управление инвестиционными счетами для кросс-арбитража с ежедневными выплатами.
- **Структура**: Аналогична `inter_exchange`, содержит модели для счетов (`InvestmentAccount`), временных кошельков (`TemporaryWallet`), депозитов (`InvestmentDeposit`), выплат (`DailyPayout`), конфигурации (`InvestmentConfig`) и запросов на вывод (`WithdrawalRequest`). API-эндпоинты и задачи Celery для управления операциями.
- **Взаимодействие с `core`**:
  - Использует модель `User` из `core` для привязки данных.
  - Модель `InvestmentStrategy` из `core` определяет параметры стратегии `cross_arbitrage`.
  - API-эндпоинты используют `IsNodeWorker` из `core`.
  - Прибыль через `DailyPayout` может быть источником для реферальных бонусов в `referrals`.
  - Использует Redis-канал `payouts_cross_arbitrage` для асинхронной обработки.

## Закомментированный код в ядре и приложениях

### В ядре (`core`)
- **Файл**: `serializers.py`
  - **Место**: Строки, связанные с импортом моделей из `cross_arbitrage` (например, `InvestmentAccount`, `DailyPayout`, `WithdrawalRequest`).
  - **Назначение**: Этот код предназначен для агрегации данных об инвестициях и выплатах из приложения `cross_arbitrage` для отображения в профиле пользователя в `UserProfileSerializer` (поля `total_investment_balance`, `total_investment_profit`). Закомментирован, вероятно, из-за незавершенной интеграции или временного отключения функциональности.

### В приложении `flexible_arbitrage`
- **Файл**: `models.py`
  - **Место**: Закомментированные статусы для `FlexibleTemporaryWallet` (например, `TEMP_WALLET_STATUS_PENDING_GENERATION` и другие).
  - **Назначение**: Эти статусы предназначены для отслеживания состояния временных кошельков (ожидание генерации, депозита, свипа и т.д.). Закомментированы, возможно, из-за упрощения модели или перехода на другой подход к управлению статусами.

### В приложении `inter_exchange`
- **Файл**: `tasks.py`
  - **Место**: Закомментированная строка с `REDIS_PAYOUT_CHANNEL`.
  - **Назначение**: Предполагается использование настройки из `settings.py` для определения Redis-канала для выплат. Закомментирована, вероятно, из-за использования фиксированного значения `payouts_inter_exchange`.

### В приложении `cross_arbitrage`
- Аналогичный закомментированный код в `tasks.py` с `REDIS_PAYOUT_CHANNEL`, как в `inter_exchange`, с той же целью.

## Итог
Ядро системы (`core`) выступает как центральный узел, связывающий приложения через модель `User`, API-эндпоинты и модель `InvestmentStrategy`. Оно агрегирует данные для профиля пользователя и предоставляет доступ к стратегиям. Приложения, связанные с инвестициями (`flexible_arbitrage`, `inter_exchange`, `cross_arbitrage`), используют `core` для привязки данных к пользователям и интеграции с реферальной системой (`referrals`). Закомментированный код в основном связан с интеграцией данных и настройками, что может быть полезно для будущих доработок.