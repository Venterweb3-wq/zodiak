# Документация по API эндпоинтам приложения `flexible_arbitrage`

## Обзор приложения

Приложение `flexible_arbitrage` предназначено для управления гибкими инвестиционными счетами, позволяя пользователям вносить и выводить средства, а также получать проценты по своим инвестициям. Оно интегрируется с ядром системы (`core`) для привязки операций к пользователям и использует асинхронные задачи Celery для начисления выплат.

## Модели данных

- **`FlexibleTemporaryWallet`**: Модель для временных кошельков, используемых для депозитов. Содержит поля для статуса, адреса кошелька, сети, пользователя и зашифрованного ключа.
- **`FlexibleInvestmentAccount`**: Модель для инвестиционных счетов, связанных с пользователем. Отслеживает баланс, активацию, целевой кошелек и период блокировки.
- **`FlexiblePayout`**: Модель для выплат по инвестиционным счетам. Хранит дату, сумму и статус выплаты.
- **`FlexibleDeposit`**: Модель для депозитов, связанных с инвестиционным счетом. Содержит сумму и хеш транзакции.
- **`FlexibleWithdrawal`**: Модель для запросов на вывод средств. Включает сумму, статус, сеть и целевой кошелек.

## API Эндпоинты

### 1. Статус инвестиционных счетов
- **URL:** `/api/flexible_arbitrage/investment-status/`
- **Method:** `GET`
- **View:** `InvestmentStatusView`
- **Permissions:** `IsAuthenticated` (Только для аутентифицированных пользователей)
- **Описание:** Возвращает список всех инвестиционных счетов пользователя для стратегии гибкого арбитража.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "id": 1,
          "network": "TRC20",
          "balance": "100.000000",
          "activated": true,
          "target_wallet": "wallet_address",
          "target_wallet_network": "TRC20",
          "lock_days": 30,
          "activation_date": "2025-07-01T00:00:00Z",
          "is_locked": false
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме стандартных `401 Unauthorized` при отсутствии аутентификации.

### 2. Создание депозита
- **URL:** `/api/flexible_arbitrage/create-deposit/`
- **Method:** `POST`
- **View:** `CreateDepositView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Создает запрос на депозит для инвестиционного счета пользователя. Может инициировать создание временного кошелька, если он еще не создан.
- **Request Data (`CreateDepositSerializer`):**
  ```json
  {
      "network": "TRC20"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Временный кошелек создан",
      "wallet_address": "wallet_address",
      "network": "TRC20",
      "wallet_id": 123
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если счет уже активирован или другие ошибки валидации.

### 3. Активация инвестиционного счета
- **URL:** `/api/flexible_arbitrage/activate-investment/`
- **Method:** `POST`
- **View:** `ActivateInvestmentView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Активирует инвестиционный счет пользователя после достижения минимального депозита.
- **Request Data (`ActivateInvestmentSerializer`):**
  ```json
  {
      "network": "TRC20"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Инвестиционный счет активирован"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если баланс недостаточен для активации или счет уже активирован.

### 4. История выплат
- **URL:** `/api/flexible_arbitrage/payout-history/`
- **Method:** `GET`
- **View:** `PayoutHistoryView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Возвращает историю всех выплат по инвестиционным счетам пользователя.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "date": "2025-07-10",
          "amount": "1.200000",
          "success": true,
          "tx_hash": "transaction_hash"
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме `401 Unauthorized`.

### 5. История успешных выплат
- **URL:** `/api/flexible_arbitrage/successful-payout-history/`
- **Method:** `GET`
- **View:** `SuccessfulPayoutHistoryView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Возвращает только успешные выплаты по инвестиционным счетам пользователя.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "date": "2025-07-10",
          "amount": "1.200000",
          "success": true,
          "tx_hash": "transaction_hash"
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме `401 Unauthorized`.

### 6. История депозитов
- **URL:** `/api/flexible_arbitrage/deposit-history/`
- **Method:** `GET`
- **View:** `InvestmentDepositHistoryView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Возвращает историю депозитов по инвестиционным счетам пользователя.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "amount": "50.000000",
          "created_at": "2025-07-05T10:00:00Z",
          "tx_hash": "transaction_hash"
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме `401 Unauthorized`.

### 7. Запрос на вывод средств
- **URL:** `/api/flexible_arbitrage/withdraw-deposit/`
- **Method:** `POST`
- **View:** `WithdrawDepositView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Создает запрос на вывод средств с инвестиционного счета пользователя.
- **Request Data (`WithdrawDepositSerializer`):**
  ```json
  {
      "network": "TRC20",
      "amount": "50.000000",
      "target_wallet": "wallet_address"
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
      "message": "Запрос на вывод создан",
      "request_id": "uuid_string"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если недостаточно средств, счет заблокирован или другие ошибки валидации.

### 8. История запросов на вывод
- **URL:** `/api/flexible_arbitrage/withdrawal-history/`
- **Method:** `GET`
- **View:** `WithdrawalHistoryView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Возвращает историю запросов на вывод средств пользователя.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "id": "uuid_string",
          "amount": "50.000000",
          "status": "pending",
          "network": "TRC20",
          "target_wallet": "wallet_address",
          "requested_at": "2025-07-15T10:00:00Z",
          "processed_at": null,
          "tx_hash": null,
          "error_message": null
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме `401 Unauthorized`.

### 9. Запрос временного кошелька (для узлов)
- **URL:** `/api/flexible_arbitrage/request-temporary-wallet/`
- **Method:** `POST`
- **View:** `RequestFlexibleTemporaryWalletView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Запрашивает создание временного кошелька для депозита.
- **Request Data (`RequestFlexibleTemporaryWalletSerializer`):**
  ```json
  {
      "network": "TRC20"
  }
  ```
- **Success Response (200 OK или 201 Created):**
  ```json
  {
      "message": "Временный кошелек создан",
      "wallet_address": "wallet_address",
      "network": "TRC20",
      "wallet_id": 123
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если временный кошелек уже существует или другие ошибки.

### 10. Уведомление о депозите (для узлов)
- **URL:** `/api/flexible_arbitrage/notify-deposit/`
- **Method:** `POST`
- **View:** `NotifyFlexibleDepositView`
- **Permissions:** `IsNodeWorker` (Только для узлов)
- **Описание:** Уведомляет систему о поступлении депозита на временный кошелек.
- **Request Data (`NotifyDepositSerializer`):**
  ```json
  {
      "wallet_id": 123,
      "amount": "50.000000",
      "tx_hash": "transaction_hash"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Депозит зафиксирован"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если кошелек не найден или другие ошибки.

### 11. Уведомление о статусе свипа (для узлов)
- **URL:** `/api/flexible_arbitrage/notify-sweep-status/`
- **Method:** `POST`
- **View:** `NotifyFlexibleSweepStatusView`
- **Permissions:** `IsNodeWorker`
- **Описание:** Уведомляет систему о статусе операции свипа (перевода средств с временного кошелька).
- **Request Data (`NotifySweepStatusSerializer`):**
  ```json
  {
      "wallet_id": 123,
      "status": "success",
      "tx_hash": "transaction_hash",
      "error_message": null
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
      "message": "Статус свипа обновлен"
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Если кошелек не найден или статус некорректен.

### 12. Список временных кошельков пользователя
- **URL:** `/api/flexible_arbitrage/temporary-wallets/`
- **Method:** `GET`
- **View:** `UserFlexibleTemporaryWalletsListView`
- **Permissions:** `IsAuthenticated`
- **Описание:** Возвращает список временных кошельков пользователя.
- **Request Data:** Нет (пустое тело).
- **Success Response (200 OK):**
  ```json
  [
      {
          "id": 123,
          "status": "pending_deposit",
          "wallet_address": "wallet_address",
          "network": "TRC20",
          "created_at": "2025-07-05T10:00:00Z"
      },
      ...
  ]
  ```
- **Error Responses:** Нет специфических ошибок, кроме `401 Unauthorized`.

## Асинхронные задачи (Celery)

### 1. Генерация выплат
- **Задача:** `generate_flexible_payouts`
- **Описание:** Периодическая задача для начисления процентов по инвестиционным счетам на основе дневной ставки. Проверяет активированные счета, у которых прошел период блокировки, и создает записи о выплатах.
- **Параметры:** Использует настройки из `django.conf.settings` для определения минимальной суммы выплаты и дневной ставки.

## Примеры `curl`-запросов для API-эндпоинтов

Ниже приведены примеры использования `curl` для взаимодействия с API-эндпоинтами приложения `flexible_arbitrage`. Предполагается, что у вас есть токен авторизации (замените `your_auth_token` на действительный токен).

#### 1. Получение статуса инвестиционных счетов
```bash
curl -X GET \
  http://your-api-domain.com/api/flexible_arbitrage/investment-status/ \
  -H "Authorization: Bearer your_auth_token" \
  -H "Content-Type: application/json"
```
**Ожидаемый ответ (200 OK):**
```json
[
    {
        "id": 1,
        "network": "TRC20",
        "balance": "100.000000",
        "activated": true,
        "target_wallet": "wallet_address",
        "target_wallet_network": "TRC20",
        "lock_days": 30,
        "activation_date": "2025-07-01T00:00:00Z",
        "is_locked": false
    }
]
```

#### 2. Создание депозита
```bash
curl -X POST \
  http://your-api-domain.com/api/flexible_arbitrage/create-deposit/ \
  -H "Authorization: Bearer your_auth_token" \
  -H "Content-Type: application/json" \
  -d '{"network": "TRC20"}'
```
**Ожидаемый ответ (200 OK):**
```json
{
    "message": "Временный кошелек создан",
    "wallet_address": "wallet_address",
    "network": "TRC20",
    "wallet_id": 123
}
```

#### 3. Активация инвестиционного счета
```bash
curl -X POST \
  http://your-api-domain.com/api/flexible_arbitrage/activate-investment/ \
  -H "Authorization: Bearer your_auth_token" \
  -H "Content-Type: application/json" \
  -d '{"network": "TRC20"}'
```
**Ожидаемый ответ (200 OK):**
```json
{
    "message": "Инвестиционный счет активирован"
}
```

#### 4. Запрос на вывод средств
```bash
curl -X POST \
  http://your-api-domain.com/api/flexible_arbitrage/withdraw-deposit/ \
  -H "Authorization: Bearer your_auth_token" \
  -H "Content-Type: application/json" \
  -d '{"network": "TRC20", "amount": "50.000000", "target_wallet": "wallet_address"}'
```
**Ожидаемый ответ (201 Created):**
```json
{
    "message": "Запрос на вывод создан",
    "request_id": "uuid_string"
}
```

#### 5. Получение истории депозитов
```bash
curl -X GET \
  http://your-api-domain.com/api/flexible_arbitrage/deposit-history/ \
  -H "Authorization: Bearer your_auth_token" \
  -H "Content-Type: application/json"
```
**Ожидаемый ответ (200 OK):**
```json
[
    {
        "amount": "50.000000",
        "created_at": "2025-07-05T10:00:00Z",
        "tx_hash": "transaction_hash"
    }
]
```

Примечание: Замените `http://your-api-domain.com` на фактический домен вашего API. Убедитесь, что вы используете правильный токен авторизации для каждого запроса.

## Закомментированный код

### В файле `models.py`
- **Место:** Закомментированные статусы для модели `FlexibleTemporaryWallet` (например, `TEMP_WALLET_STATUS_PENDING_GENERATION`, `TEMP_WALLET_STATUS_PENDING_DEPOSIT`, `TEMP_WALLET_STATUS_DEPOSIT_DETECTED`, `TEMP_WALLET_STATUS_SWEEP_INITIATED`, `TEMP_WALLET_STATUS_SWEEP_SUCCESS`, `TEMP_WALLET_STATUS_SWEEP_FAILED`).
- **Назначение:** Эти константы предназначены для детального отслеживания жизненного цикла временного кошелька — от его генерации до завершения операций (депозит и свып). Они могли быть частью более сложной системы управления кошельками, которая на данный момент либо упрощена, либо временно отключена в пользу более простого подхода к статусам.
- **Предложение по использованию:**
  1. **Раскомментировать и внедрить:** Если в будущем потребуется более детальное управление временными кошельками (например, для улучшенного мониторинга или обработки ошибок на каждом этапе), эти статусы можно раскомментировать и использовать в логике приложения. Это позволит точно отслеживать каждый шаг процесса (генерация, ожидание депозита, обнаружение депозита, инициирование свипа, успешный или неуспешный свып).
  2. **Удалить для упрощения:** Если текущая система статусов достаточна и нет планов на внедрение более сложной логики, закомментированный код можно удалить для повышения читаемости файла. Это устранит ненужный "шум" в коде и сделает модель более лаконичной.
  3. **Рефакторинг:** В качестве альтернативы, можно вынести статусы в отдельный файл констант или использовать перечисления (`enum` из Python или Django-расширений вроде `django-enumfield`), что улучшит организацию кода и упростит его поддержку. Например:
     ```python
     from enum import Enum

     class TemporaryWalletStatus(Enum):
         PENDING_GENERATION = 'pending_generation'
         PENDING_DEPOSIT = 'pending_deposit'
         DEPOSIT_DETECTED = 'deposit_detected'
         SWEEP_INITIATED = 'sweep_initiated'
         SWEEP_SUCCESS = 'sweep_success'
         SWEEP_FAILED = 'sweep_failed'
     ```
     Это сделает статусы более типобезопасными и удобными для автодополнения в IDE.

## Итог

Приложение `flexible_arbitrage` предоставляет полный набор API-эндпоинтов для управления гибкими инвестиционными счетами, включая создание депозитов, активацию счетов, запросы на вывод средств и мониторинг временных кошельков. Оно тесно интегрировано с ядром системы (`core`) через модель `User` и, возможно, через модель `InvestmentStrategy` для определения параметров стратегии. Асинхронные задачи Celery обеспечивают автоматическое начисление процентов. Закомментированный код в `models.py` указывает на потенциально более сложную систему управления временными кошельками, и его дальнейшее использование или удаление зависит от планов по развитию функциональности.

Если у вас есть дополнительные вопросы или требуется дальнейшая детализация (например, примеры `curl`-запросов), дайте знать!

## Возможность выбора сети пользователем

В приложении `flexible_arbitrage` пользователи имеют возможность выбирать сеть для своих операций (депозитов, выводов и временных кошельков). Это реализовано через поле `network` в моделях и API-эндпоинтах. Доступные сети определены в `NETWORK_CHOICES` в модели `FlexibleInvestmentAccount` и других соответствующих моделях. На момент анализа кода доступны следующие сети:
- **TRC20** (Tron)
- **BEP20** (BNB Smart Chain)
- **ARBITRUM** (Arbitrum)

### Как пользователь выбирает сеть:
1. **При создании депозита или временного кошелька**: Пользователь указывает желаемую сеть в поле `network` в запросе к эндпоинтам, таким как `/api/flexible_arbitrage/create-deposit/` или `/api/flexible_arbitrage/request-temporary-wallet/`. Например, в теле запроса можно указать `"network": "TRC20"`.
2. **При активации счета**: Пользователь указывает сеть, к которой привязан счет, чтобы активировать его.
3. **При выводе средств**: Пользователь выбирает сеть для вывода средств через поле `network` в запросе к `/api/flexible_arbitrage/withdraw-deposit/`.

### Ограничения и валидация:
- Выбор сети валидируется на уровне API-сериализаторов и моделей. Если указана неподдерживаемая сеть, запрос отклоняется с ошибкой `400 Bad Request`.
- Уникальность счета пользователя для каждой сети обеспечивается через `unique_together` в мета-классе модели `FlexibleInvestmentAccount`, что предотвращает создание нескольких счетов для одной и той же сети.

### Возможные улучшения:
- Добавить эндпоинт для получения списка доступных сетей динамически, чтобы frontend-приложение могло отображать актуальный список без хардкода.
- Включить информацию о комиссиях или минимальных суммах для каждой сети, если это применимо, чтобы пользователь мог сделать информированный выбор.

Если у вас есть дополнительные пожелания по функциональности выбора сети или другие вопросы, дайте знать!
