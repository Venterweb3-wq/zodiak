# Inter Exchange API Documentation

Базовый URL: `/api/investments/`

## Аутентификация

-   Для эндпоинтов, требующих аутентификации пользователя (`IsAuthenticated`), необходимо передавать JWT токен в заголовке:
    `Authorization: Bearer <USER_JWT_TOKEN>`
-   Для эндпоинтов, предназначенных для Node.js воркера (`IsNodeWorker`), необходимо передавать специальный токен в заголовке:
    `Authorization: Bearer <NODE_WORKER_API_TOKEN>`

---

## Эндпоинты

### 1. Статус инвестиционного счета

-   **URL:** `/status/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Получает все инвестиционные счета для текущего пользователя по разным сетям.
-   **Response (200 OK):** Список объектов `InvestmentAccountSerializer`
    ```json
    [
        {
            "user": 1,
            "balance": "1000.000000",
            "activated": true,
            "target_wallet": "0xYourTargetWalletAddress",
            "target_wallet_network": "BEP20",
            "lock_days": 30,
            "activation_date": "2023-10-26T12:00:00Z",
            "is_locked": false,
            "network": "BEP20",
            "network_display": "BEP20 (BNB Smart Chain)"
        },
        {
            "user": 1,
            "balance": "500.000000",
            "activated": false,
            "target_wallet": null,
            "target_wallet_network": null,
            "lock_days": 30,
            "activation_date": null,
            "is_locked": true,
            "network": "TRC20",
            "network_display": "TRC20 (Tron)"
        }
    ]
    ```

### 2. Конфигурация инвестиционной стратегии

-   **URL:** `/config/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated` (или `AllowAny` в зависимости от настроек View)
-   **Description:** Возвращает публичную конфигурацию для активной инвестиционной стратегии 'inter_exchange'.
-   **Response (200 OK):** `InvestmentConfigPublicSerializer`
    ```json
    {
        "strategy": "inter_exchange",
        "payout_rate": "0.00120", 
        "lock_days": 30, 
        "min_deposit": "100.000000", 
        "is_active": true
    }
    ```
-   **Response (404 Not Found):**
    ```json
    {
        "detail": "Конфигурация стратегии 'inter_exchange' не найдена или не активна."
    }
    ```

### 3. Создание депозита

-   **URL:** `/deposit/`
-   **Method:** `POST`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Создает новую запись о депозите (пополнении) для инвестиционного счета пользователя.
-   **Request Body:** `CreateDepositSerializer`
    ```json
    {
        "amount": "500.00", // Сумма депозита
        "tx_hash": "0xTransactionHashFromBlockchain" // Хэш транзакции пополнения
    }
    ```
-   **Response (201 Created):** `InvestmentDepositSerializer`
    ```json
    {
        "id": 1,
        "account": 1, // ID InvestmentAccount
        "amount": "500.00",
        "tx_hash": "0xTransactionHashFromBlockchain",
        "created_at": "2023-10-26T13:00:00Z"
    }
    ```
-   **Response (400 Bad Request):**
    ```json
    {
        "amount": ["Ensure this value is greater than or equal to 100.00."], // Пример ошибки валидации
        "tx_hash": ["This field may not be blank."]
    }
    ```

### 4. История депозитов пользователя (InvestmentDeposit)

-   **URL:** `/deposits/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Возвращает историю всех депозитов (пополнений `InvestmentDeposit`) для текущего аутентифицированного пользователя, отсортированную по дате создания (новые первыми).
-   **Response (200 OK):** List of `InvestmentDepositSerializer`
    ```json
    [
        {
            "id": 2,
            "account": 1,
            "amount": "200.000000",
            "tx_hash": "0xAnotherTransactionHash",
            "status": "✅ Успешно",
            "created_at": "2023-10-27 10:00"
        },
        {
            "id": 1,
            "account": 1,
            "amount": "500.00",
            "tx_hash": "0xTransactionHashFromBlockchain",
            "created_at": "2023-10-26T13:00:00Z"
        }
    ]
    ```
-   **Response (404 Not Found):**
    ```json
    {
        "error": "Investment account not found."
    }
    ```

### 5. Активация инвестиционного счета

-   **URL:** `/activate/`
-   **Method:** `POST`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Активирует инвестиционный счет пользователя для указанной сети, если он еще не активен и на балансе достаточно средств.
-   **Request Body:** `ActivateInvestmentSerializer`
    ```json
    {
        "network": "BEP20" // Сеть счета для активации: TRC20, BEP20, ARBITRUM
    }
    ```
-   **Response (200 OK):**
    ```json
    {
        "message": "Счёт активирован",
        "activation_date": "2023-10-26T14:00:00Z"
    }
    ```
-   **Response (400 Bad Request):**
    ```json
    {
        "network": ["This field is required."],
        "non_field_errors": ["Этот счет уже активирован.", "Для активации требуется минимальный депозит X USDT."] 
    }
    ```

### 6. История ежедневных начислений (Daily Payouts)

-   **URL:** `/payouts/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Возвращает историю записей о ежедневных начислениях (процентов) для инвестиционного счета пользователя.
-   **Response (200 OK):** List of `DailyPayoutSerializer`
    ```json
    [
        {
            "id": 1,
            "account_user_username": "testuser",
            "date": "2023-10-27",
            "amount": "5.000000", 
            "tx_hash": "0xActualBlockchainTransactionHashForPayout", 
            "success": true 
        }
    ]
    ```

### 7. Обновление статуса выплаты (для Node Worker)

-   **URL:** `/payouts/<int:pk>/update/` (например, `/payouts/1/update/`)
-   **Method:** `PATCH`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Обновляет статус конкретной записи о ежедневной выплате. Используется Node.js воркером.
-   **Request Body:** `PayoutUpdateSerializer`
    ```json
    {
        "tx_hash": "0xActualBlockchainTransactionHashForPayout",
        "success": true 
    }
    ```
-   **Response (200 OK):** Updated `DailyPayoutSerializer`

### 8. История успешных ежедневных начислений

-   **URL:** `/payouts/successful/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Возвращает историю всех *успешных* ежедневных начислений.
-   **Response (200 OK):** List of `DailyPayoutSerializer` (только с `success: true`)

---

## Временные кошельки (Temporary Wallets)

### 9. Запрос на создание временного кошелька

-   **URL:** `/temporary-wallet/request/`
-   **Method:** `POST`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Запрашивает создание нового временного кошелька для пополнения баланса пользователя. Кошелек генерируется Node.js воркером асинхронно.
-   **Request Body:** `RequestTemporaryWalletSerializer`
    ```json
    {
        "network": "TRC20" // Доступные сети: TRC20, BEP20, ARBITRUM
    }
    ```
-   **Response (201 Created):** `TemporaryWalletSerializer` (с начальным статусом, например, 'pending_generation' или 'pending_deposit', если генерация быстрая)
    ```json
    {
        "id": 10,
        "user_username": "testuser",
        "address": "TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Адрес будет сгенерирован позже, если статус pending_generation
        "network": "TRC20",
        "network_display": "USDT - TRC20",
        "status": "pending_deposit", // или 'pending_generation'
        "status_display": "Ожидает депозита",
        "created_at": "2023-11-15 10:00:00",
        "updated_at": "2023-11-15 10:00:00",
        "expires_at": "2023-11-16 10:00:00" // Примерное время жизни кошелька
    }
    ```
-   **Response (400 Bad Request):** Ошибки валидации (например, если сеть не поддерживается или превышен лимит активных кошельков).

### 10. Уведомление о депозите на временный кошелек (для Node Worker)

-   **URL:** `/temp-wallets/notify-deposit/`
-   **Method:** `POST`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Используется Node.js воркером для уведомления Django о том, что на временный кошелек поступил депозит.
-   **Request Body:** `NotifyDepositSerializer`
    ```json
    {
        "address": "TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "tx_hash": "0xTransactionHashOfDeposit", // Опционально
        "amount": "150.75", // Сумма депозита в USDT
        "network": "TRC20"
    }
    ```
-   **Response (200 OK):**
    ```json
    {
        "message": "Депозит для кошелька TQXXXX... зарегистрирован. Статус обновлен на 'deposit_detected'."
    }
    ```
-   **Response (400 Bad Request / 404 Not Found / 409 Conflict):** Ошибки (например, кошелек не найден, неверные данные, некорректный статус кошелька, дубликат tx_hash).

### 11. Уведомление о статусе свипа с временного кошелька (для Node Worker)

-   **URL:** `/temp-wallets/notify-sweep/`
-   **Method:** `POST`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Используется Node.js воркером для обновления статуса свипа (перевода средств) с временного кошелька.
-   **Request Body:** `NotifySweepStatusSerializer`
    ```json
    {
        "address": "TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "status": "sweep_success", // Статусы: sweep_prep_pending, sweep_prep_failed, sweep_pending, sweep_success, sweep_failed
        "sweep_tx_hash": "0xTransactionHashOfSweep", // Хеш транзакции свипа (если успешно)
        "sweep_preparation_tx_hash": "0xTxHashForGasFee", // Хеш транзакции пополнения для комиссии (если применимо)
        "error_message": null, // Сообщение об ошибке, если статус ..._failed
        "detected_amount": "150.75" // Сумма, которая была на кошельке перед свипом (опционально, для сверки)
    }
    ```
-   **Response (200 OK):**
    ```json
    {
        "message": "Sweep status updated for wallet TQXXXX...",
        "wallet_status": "sweep_success"
    }
    ```
-   **Response (400 Bad Request / 404 Not Found):** Ошибки.

### 12. Список активных временных кошельков пользователя

-   **URL:** `/temporary-wallets/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Возвращает список активных (не истекших и не успешно обработанных) временных кошельков для текущего пользователя.
-   **Response (200 OK):** List of `TemporaryWalletSerializer`
    ```json
    [
        {
            "id": 10,
            "user_username": "testuser",
            "address": "TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "network": "TRC20",
            "network_display": "USDT - TRC20",
            "status": "pending_deposit",
            "status_display": "Ожидает депозита",
            "created_at": "2023-11-15 10:00:00",
            "updated_at": "2023-11-15 10:00:00",
            "expires_at": "2023-11-16 10:00:00"
        }
        // ... другие активные кошельки
    ]
    ```

### 13. Список временных кошельков, ожидающих депозит (для Node Worker)

-   **URL:** `/temporary-wallets/pending-deposit/`
-   **Method:** `GET`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Возвращает список временных кошельков, которые находятся в статусе 'pending_deposit' или 'deposit_detected' (в зависимости от логики воркера), для мониторинга депозитов.
-   **Response (200 OK):** List of `PendingTemporaryWalletSerializer`
    ```json
    [
        {
            "id": 10,
            "address": "TQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "network": "TRC20"
        },
        {
            "id": 11,
            "address": "0xYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
            "network": "BEP20"
        }
        // ... другие кошельки для мониторинга
    ]
    ```

### 14. Получение зашифрованного приватного ключа временного кошелька (для Node Worker)

-   **URL:** `/temp-wallets/<int:wallet_id>/encrypted-key/` (например, `/temp-wallets/10/encrypted-key/`)
-   **Method:** `GET`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Позволяет Node.js воркеру получить зашифрованный приватный ключ для временного кошелька, чтобы выполнить операцию свипа.
-   Ключ доступен только для кошельков в статусах, предполагающих готовность к свипу (например, 'deposit_detected', 'sweep_prep_failed').
-   **Response (200 OK):**
    ```json
    {
        "encrypted_private_key": "U2FsdGVkX1+..." // Зашифрованный ключ
    }
    ```
-   **Response (403 Forbidden / 404 Not Found):** Если кошелек не найден или запрос ключа для текущего статуса кошелька не разрешен.

---

## Запросы на вывод средств (Withdrawal Requests)

### 15. Создание запроса на вывод средств

-   **URL:** `/withdrawals/create/`
-   **Method:** `POST`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Создает новый запрос на вывод средств с баланса пользователя в указанной сети.
-   **Request Body:** `WithdrawDepositSerializer`
    ```json
    {
        "amount": "100.50", // Сумма для вывода
        "network": "TRC20" // Сеть, с которой производится вывод
    }
    ```
-   **Response (201 Created):** `WithdrawalRequestSerializer` (с начальным статусом 'pending')
    ```json
    {
        "message": "Запрос на вывод средств отправлен в обработку.",
        "withdrawal_request": {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            "account": 1,
            "amount": "100.500000",
            "network": "TRC20",
            "target_wallet": "TPayoutWalletAddressForUser",
            "status": "pending",
            "tx_hash": null,
            "requested_at": "2023-11-15 12:00:00",
            "processed_at": null
        }
    }
    ```
-   **Response (400 Bad Request):** Ошибки валидации (недостаточно средств, счет заблокирован, целевой кошелек не настроен и т.д.).

### 16. История запросов на вывод средств

-   **URL:** `/withdrawals/history/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:** Возвращает историю всех запросов на вывод средств для текущего пользователя.
-   **Response (200 OK):** List of `WithdrawalRequestSerializer`
    ```json
    [
        {
            "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            // ... остальные поля как в примере выше
            "status": "success",
            "status_display": "Success",
            "tx_hash": "0xWithdrawalTransactionHash",
            "processed_at": "2023-11-15 12:30:00"
        }
        // ... другие запросы
    ]
    ```

### 17. Обновление статуса запроса на вывод (для Node Worker)

-   **URL:** `/withdrawals/<uuid:pk>/update/` (например, `/withdrawals/a1b2c3d4-e5f6-7890-1234-567890abcdef/update/`)
-   **Method:** `PATCH`
-   **Permissions:** `IsNodeWorker`
-   **Description:** Обновляет статус запроса на вывод средств. Используется Node.js воркером после обработки транзакции.
-   **Request Body:** `WithdrawalRequestUpdateSerializer`
    ```json
    {
        "status": "success", // Возможные статусы: 'processing', 'success', 'failed'
        "tx_hash": "0xActualBlockchainTransactionHashForWithdrawal", // Если 'success'
        "error_message": null // Если 'failed'
    }
    ```
-   **Response (200 OK):** Updated `WithdrawalRequestSerializer`

---

**Примечание:** Примеры JSON являются иллюстративными и могут незначительно отличаться в зависимости от текущей реализации сериализаторов и моделей. Пожалуйста, сверяйтесь с актуальными определениями сериализаторов в коде. 