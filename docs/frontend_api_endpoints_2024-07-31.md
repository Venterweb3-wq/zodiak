# Документация API эндпоинтов для Фронтенда (31-07-2024)

## Общие принципы

*   **Формат данных:** JSON.
*   **Аутентификация:** Большинство эндпоинтов требуют JWT-токен в заголовке `Authorization: Bearer <your_jwt_token>` (если не указано иное).
*   **Коды состояния HTTP:** Стандартные (200, 201, 400, 401, 403, 404 и т.д.).
*   **Пагинация:** Для списковых эндпоинтов (например, история). Ответ включает `count`, `next`, `previous`, `results`.
*   **Ошибки валидации:** Обычно `{"field_name": ["Сообщение об ошибке"]}` или `{"non_field_errors": ["Общее сообщение"]}`.

## Приложение `core` (Префикс: `/api/auth/`)

### 1. Регистрация
*   **Эндпоинт:** `POST /api/auth/register/`
*   **Аутентификация:** Не требуется.
*   **Тело запроса (Request Body):
    ```json
    {
        "username": "string",
        "email": "user@example.com",
        "password": "string_min_8_chars_letter_digit",
        "confirm_password": "string_min_8_chars_letter_digit",
        "referred_code": "string_referral_code_of_referrer", // Обязательно
        "accept_terms": true, // Обязательно
        "marketing_optin": false, // Опционально
        "captcha": "string_recaptcha_token" // Обязательно (если NOCAPTCHA=False)
    }
    ```
*   **Успешный ответ (201 CREATED):
    ```json
    {
        "message": "Пользователь зарегистрирован. Пожалуйста, проверьте вашу почту для подтверждения email."
    }
    ```
*   **Примечания:** Отправляет письмо для верификации email. Пользователь создается неактивным до верификации.

### 2. Активация Email (GET-запрос по ссылке из письма)
*   **Эндпоинт:** `GET /api/auth/activate/<uidb64>/<token>/`
*   **Аутентификация:** Не требуется (токен в URL).
*   **Успешный ответ (200 OK):
    ```json
    {
        "message": "Email успешно подтверждён. Теперь вы можете войти."
    }
    ```
*   **Ошибка (400 BAD REQUEST):
    ```json
    {
        "error": "Ссылка для подтверждения недействительна или истекла."
    }
    ```

### 3. Логин
*   **Эндпоинт:** `POST /api/auth/login/`
*   **Аутентификация:** Не требуется.
*   **Тело запроса (Request Body):
    ```json
    {
        "username": "string",
        "password": "string",
        "token": "string_2fa_code" // Опционально, если 2FA включен у пользователя
    }
    ```
*   **Успешный ответ (200 OK) - если устройство доверенное или 2FA не включен/успешно пройден:
    ```json
    {
        // Формат успешного ответа зависит от реализации VerifyDeviceView и LoginView.
        // Обычно содержит JWT токен, информацию о пользователе.
        // Пример при успешном входе с доверенного устройства:
        "message": "Успешный вход с доверенного устройства (cookie).",
        "username": "string",
        "device_trusted": true,
        "access": "your_access_token", // Ожидается, что JWT токен будет здесь
        "refresh": "your_refresh_token" // Ожидается, что JWT токен будет здесь
    }
    ```
*   **Ответ, если требуется верификация устройства (202 ACCEPTED):
    ```json
    {
        "status": "device_verification_required",
        "message": "Это устройство не распознано. Код подтверждения был отправлен на ваш email.",
        "email": "user@example.com"
    }
    ```
*   **Ответ, если требуется 2FA, но код не предоставлен (400 BAD REQUEST):
    ```json
    {
        "2fa_required": true,
        "message": "Требуется код 2FA"
    }
    ```
*   **Примечания:** Устанавливает cookie `device_tkn` при успешной верификации устройства. JWT токен (`access` и `refresh`) должен возвращаться при окончательном успешном входе.

### 4. Верификация нового устройства
*   **Эндпоинт:** `POST /api/auth/verify-device/`
*   **Аутентификация:** Не требуется (используется email и код).
*   **Тело запроса (Request Body):
    ```json
    {
        "email": "user@example.com",
        "code": "string_otp_from_email"
    }
    ```
*   **Успешный ответ (200 OK):
    ```json
    {
        "message": "Устройство успешно подтверждено. Вход выполнен.",
        "username": "string",
        "access": "your_access_token",
        "refresh": "your_refresh_token"
        // Cookie device_tkn будет установлен автоматически сервером
    }
    ```

### 5. Запрос на повторную отправку письма верификации
*   **Эндпоинт:** `POST /api/auth/send-email-verification/`
*   **Аутентификация:** Требуется JWT.
*   **Тело запроса:** Пустое.
*   **Успешный ответ (200 OK):
    ```json
    {
        "message": "Письмо для подтверждения email отправлено."
    }
    ```
*   **Ошибка (400 BAD REQUEST), если email уже подтвержден:
    ```json
    {
        "error": "Email уже подтвержден."
    }
    ```

### 6. Профиль пользователя
*   **Получение профиля:** `GET /api/auth/profile/`
    *   **Аутентификация:** Требуется JWT.
    *   **Успешный ответ (200 OK):
        ```json
        {
            "id": 0,
            "username": "string",
            "email": "user@example.com",
            "first_name": "string_or_null",
            "last_name": "string_or_null",
            "email_verified": true,
            "is_active": true,
            "two_factor_enabled": false,
            "referral_code": "string_unique_code",
            "language": "ru",
            "theme": "dark",
            "referral_count": 0,
            "marketing_optin": false,
            "last_login_ip": "string_ip_address_or_null",
            "date_joined": "datetime_iso_format",
            "total_deposit_amount": "0.00", // Заглушка, будет реальное значение
            "total_payout_amount": "0.00", // Заглушка
            "active_investment": "0.00", // Заглушка
            "functionality_limited_until": "datetime_iso_format_or_null"
        }
        ```
*   **Обновление профиля:** `PATCH /api/auth/profile/`
    *   **Аутентификация:** Требуется JWT.
    *   **Тело запроса (Request Body) - можно отправлять только изменяемые поля:
        ```json
        {
            "first_name": "string",
            "last_name": "string",
            "language": "en", // ("ru", "en", ...)
            "theme": "light", // ("dark", "light", ...)
            "marketing_optin": true
        }
        ```
    *   **Успешный ответ (200 OK):
        ```json
        {
            "message": "Профиль обновлён"
        }
        ```
    *   **Ошибка (403 FORBIDDEN), если функционал ограничен:
        ```json
        {
            "error": "Обновление профиля временно ограничено после сброса 2FA. Пожалуйста, подождите.",
            "limited_until": "datetime_iso_format"
        }
        ```

### 7. Статус безопасности
*   **Эндпоинт:** `GET /api/auth/security-status/`
*   **Аутентификация:** Требуется JWT.
*   **Успешный ответ (200 OK):
    ```json
    {
        "email_verified": true,
        "two_factor_enabled": false,
        "last_login_ip": "string_ip_address_or_null"
    }
    ```

### 8. Управление 2FA
*   **Инициация включения 2FA:** `POST /api/auth/2fa/enable/`
    *   **Аутентификация:** Требуется JWT.
    *   **Тело запроса:** Пустое.
    *   **Успешный ответ (200 OK):
        ```json
        {
            "secret": "string_base32_secret_key",
            "uri": "otpauth://totp/Terminal7:username?secret=SECRET&issuer=Terminal7"
        }
        ```
*   **Подтверждение включения 2FA:** `POST /api/auth/2fa/confirm/`
    *   **Аутентификация:** Требуется JWT.
    *   **Тело запроса (Request Body):
        ```json
        {
            "token": "string_6_digit_totp_code"
        }
        ```
    *   **Успешный ответ (200 OK):
        ```json
        {
            "message": "2FA успешно включен."
        }
        ```
*   **Запрос на сброс 2FA:** `POST /api/auth/2fa/reset/request/`
    *   **Аутентификация:** Не требуется.
    *   **Тело запроса (Request Body):
        ```json
        {
            "email": "user@example.com"
        }
        ```
    *   **Успешный ответ (200 OK):
        ```json
        {
            "message": "Код для сброса 2FA отправлен на ваш email."
        }
        ```
*   **Подтверждение сброса 2FA:** `POST /api/auth/2fa/reset/confirm/`
    *   **Аутентификация:** Не требуется.
    *   **Тело запроса (Request Body):
        ```json
        {
            "email": "user@example.com",
            "code": "string_otp_from_email_for_reset"
        }
        ```
    *   **Успешный ответ (200 OK):
        ```json
        {
            "message": "2FA успешно сброшен. Функционал будет ограничен на 24 часа."
        }
        ```

### 9. История входов
*   **Эндпоинт:** `GET /api/auth/login-history/`
*   **Аутентификация:** Требуется JWT.
*   **Успешный ответ (200 OK) (пагинированный):
    ```json
    {
        "count": 0,
        "next": "url_or_null",
        "previous": "url_or_null",
        "results": [
            {
                "timestamp": "datetime_iso_format",
                "ip_address": "string_ip_address_or_null",
                "user_agent": "string_user_agent_or_null"
            }
        ]
    }
    ```

### 10. Лог активности
*   **Эндпоинт:** `GET /api/auth/activity-log/`
*   **Аутентификация:** Требуется JWT.
*   **Успешный ответ (200 OK) (пагинированный):
    ```json
    {
        "count": 0,
        "next": "url_or_null",
        "previous": "url_or_null",
        "results": [
            {
                "timestamp": "datetime_iso_format",
                "action_type": "USER_LOGGED_IN", // Код действия
                "get_action_type_display": "User Logged In", // Человекочитаемое описание
                "details": { /* JSON объект с деталями, если есть */ },
                "ip_address": "string_ip_address_or_null"
            }
        ]
    }
    ```

### 11. Управление доверенными устройствами
*   **Получение списка доверенных устройств:** `GET /api/auth/trusted-devices/`
    *   **Аутентификация:** Требуется JWT.
    *   **Успешный ответ (200 OK) (пагинированный, если устройств много, хотя обычно нет):
        ```json
        {
            "count": 0,
            "next": "url_or_null",
            "previous": "url_or_null",
            "results": [
                {
                    "id": 0,
                    "user_agent": "string_user_agent_or_null",
                    "ip_address": "string_ip_address_or_null",
                    "added_at": "datetime_iso_format",
                    "last_login_at": "datetime_iso_format_or_null"
                }
            ]
        }
        ```
*   **Удаление доверенного устройства:** `DELETE /api/auth/trusted-devices/<device_id>/`
    *   **Аутентификация:** Требуется JWT.
    *   **Успешный ответ (204 NO CONTENT).**

## Приложение `cross_arbitrage` (Префикс: `/api/investments/`)

### 1. Статус инвестиционных счетов
*   **Эндпоинт:** `GET /api/investments/status/`
*   **Аутентификация:** Требуется JWT.
*   **Описание:** Возвращает список всех инвестиционных счетов пользователя по разным сетям.
*   **Успешный ответ (200 OK):**
    ```json
    [
        {
            "user": 1,
            "balance": "1000.00",
            "activated": true,
            "network": "BEP20",
            "network_display": "BEP20 (BNB Smart Chain)",
            // ... другие поля InvestmentAccountSerializer
        },
        {
            "user": 1,
            "balance": "500.00",
            "activated": false,
            "network": "TRC20",
            "network_display": "TRC20 (Tron)",
            // ...
        }
    ]
    ```

### 2. Активация инвестиционного счета
*   **Эндпоинт:** `POST /api/investments/activate/`
*   **Аутентификация:** Требуется JWT.
*   **Описание:** Активирует инвестиционный счет для указанной сети.
*   **Тело запроса (Request Body):
    ```json
    {
        "network": "BEP20" // Сеть счета для активации: TRC20, BEP20, ARBITRUM
    }
    ```
*   **Успешный ответ (200 OK):
    ```json
    {
        "message": "Счёт активирован",
        "activation_date": "datetime_iso_format"
    }
    ```

### 3. Создание запроса на вывод USDT
*   **Эндпоинт:** `POST /api/investments/withdraw/deposit/` (Имя URL `create_withdrawal_request`)
*   **Аутентификация:** Требуется JWT.
*   **Описание:** Создает запрос на вывод средств с баланса указанной сети.
*   **Тело запроса (Request Body):**
    ```json
    {
        "amount": "100.50", // Сумма для вывода
        "network": "TRC20" // Сеть, с которой производится вывод: "TRC20", "BEP20", "ARBITRUM"
    }
    ```
*   **Успешный ответ (201 CREATED):**
    ```json
    {
        "message": "Запрос на вывод средств отправлен в обработку.",
        "withdrawal_request": {
            // ... объект WithdrawalRequestSerializer
        }
    }
    ```
*   **Примечания:** Целевой кошелек для вывода (`target_wallet`) берется из настроек `InvestmentAccount`, который должен быть предварительно настроен.

### 4. История выводов
*   **Эндпоинт:** `GET /api/investments/withdrawals/history/`
*   **Аутентификация:** Требуется JWT.
*   **Успешный ответ (200 OK) (пагинированный):** Возвращает список всех запросов на вывод по всем сетям.

### 5. Другие эндпоинты `cross_arbitrage`
*   Остальные эндпоинты (`/config/`, история депозитов и начислений) остаются без изменений в логике вызова, но их данные теперь будут привязаны к конкретным счетам по сетям.

**Важно:**
*   Конкретные URL-пути для других эндпоинтов нужно уточнять в `cross_arbitrage/urls.py`.
*   Формат ответа для этих эндпоинтов будет определяться соответствующими сериализаторами.
*   **Получение JWT токена:** Фронтенд должен получить JWT токен (access и refresh) после успешного логина (`/api/auth/login/`) или верификации устройства (`/api/auth/verify-device/`) и сохранять его для последующих аутентифицированных запросов. Необходимо реализовать логику обновления access токена с помощью refresh токена (стандартный эндпоинт для `simple-jwt` - `/api/token/refresh/`).

Этот список должен дать хорошее представление о том, как фронтенд может взаимодействовать с вашим бэкендом. Рекомендую также сверяться с `API_DOCUMENTATION.md` в приложении `cross_arbitrage` и, возможно, сгенерировать Swagger/OpenAPI документацию для более точного и интерактивного исследования API. 