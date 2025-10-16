# Руководство по локальному тестированию системы выплат и депозитов

Данное руководство описывает шаги для настройки и проведения локального тестирования взаимодействия между Django-проектом и Node.js воркерами (`payout_worker.js`, `deposit_monitor.js`) и API (`node-wallet/services/api.js`).

## Общая схема локального окружения

1.  **База данных (PostgreSQL):** Запущена и доступна.
2.  **Redis:** Запущен и доступен.
3.  **Django проект:** Запущен на локальном порту (например, `http://localhost:8000`).
    *   Обслуживает API для фронтенда/пользователя.
    *   Обслуживает API для Node.js воркеров.
    *   Взаимодействует с Node.js Wallet API для генерации временных кошельков.
4.  **Node.js Wallet API (`node-wallet/services/api.js`):** Запущен на локальном порту (например, `http://localhost:3001`).
    *   Обслуживает эндпоинт `/generate_wallet`.
    *   Использует `utils/crypto.js` для шифрования приватных ключей.
5.  **Node.js `payout_worker.js`:** Запущен, подключен к Redis и слушает канал `payouts_cross_arbitrage`.
6.  **Node.js `deposit_monitor.js`:** Запущен, периодически опрашивает Django API и инициирует операции сбора средств (sweep).

## Этап 1: Настройка окружения

### 1.1 Переменные окружения (`.env` файлы)

Убедитесь, что у вас корректно настроены файлы `.env` для Django и Node.js проектов.

**Для Django (в корне Django проекта, например, `django/.env`):**
```env
# Настройки базы данных
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_HOST=localhost # или ваш хост БД
POSTGRES_PORT=5432    # или ваш порт БД

# Настройки Redis
REDIS_HOST=localhost
REDIS_PORT=6379

DJANGO_SETTINGS_MODULE=myproject.settings.dev # или ваш файл настроек для разработки
SECRET_KEY=your_django_secret_key # Убедитесь, что он установлен
DEBUG=True

# Токен для аутентификации Node.js воркеров в Django
NODE_WORKER_API_TOKEN="your_secret_node_worker_token"

# URL и токен для доступа Django к Node.js Wallet API
NODEJS_WALLET_API_URL="http://localhost:3001" # Укажите порт, на котором будет работать node-wallet/services/api.js
NODEJS_INTERNAL_API_TOKEN="your_secret_token_for_django_to_access_nodejs_api"
```

**Для Node.js (в корне `node-wallet` проекта, например, `node-wallet/.env`):**
```env
# Настройки Redis (должны совпадать с Django)
REDIS_HOST=localhost
REDIS_PORT=6379

# URL Django API
DJANGO_API_BASE_URL="http://localhost:8000" # Укажите порт, на котором работает Django
DJANGO_APP_API_PREFIX="/api/investments" # Если используется префикс в Django URL

# Токен для аутентификации в Django API (тот же, что NODE_WORKER_API_TOKEN в Django .env)
NODE_WORKER_API_TOKEN="your_secret_node_worker_token"

# Ключ для шифрования/дешифрования приватных ключей кошельков
# ВАЖНО: Должен быть 64-символьной hex-строкой (32 байта)
# Этот ключ должен быть одинаковым для node-wallet/services/api.js (шифрование)
# и deposit_monitor.js (дешифрование через utils/crypto.js)
WALLET_ENCRYPTION_KEY="ваша_64_символьная_hex_строка_ключа_шифрования"

# Токен для авторизации запросов к /generate_wallet (тот же, что NODEJS_INTERNAL_API_TOKEN в Django .env)
INTERNAL_API_TOKEN="your_secret_token_for_django_to_access_nodejs_api"

# Порт для Node.js Wallet API (node-wallet/services/api.js)
PORT=3001

# Переменные для payout_engine.js (адреса основных кошельков, RPC URL и т.д.)
# Для локального тестирования потока данных, реальные RPC могут не требоваться если вы мокаете транзакции.
# TRON_MAIN_WALLET_ADDRESS=...
# TRON_MAIN_WALLET_PRIVATE_KEY=...
# EVM_MAIN_WALLET_ADDRESS=...
# EVM_MAIN_WALLET_PRIVATE_KEY=...
# ARBITRUM_NODE_URL=...
# BSC_NODE_URL=...
# TRON_NODE_URL=... # Если используется tronweb напрямую

# Минимальные балансы для payout_engine
MIN_USDT_BALANCE_MAIN_WALLET=50
MIN_TRX_BALANCE_MAIN_WALLET=100
MIN_ETH_BALANCE_MAIN_WALLET_ARBITRUM=0.01
MIN_BNB_BALANCE_MAIN_WALLET_BSC=0.02

# Для deposit_monitor.js
DEPOSIT_MONITOR_INTERVAL_MS=30000 # интервал опроса в мс
MIN_USDT_DEPOSIT_TO_PROCESS=0.01  # минимальная сумма депозита для обработки
```

### 1.2 Запуск зависимостей
*   Запустите сервер PostgreSQL.
*   Запустите сервер Redis.

### 1.3 Запуск Django проекта
1.  Перейдите в директорию вашего Django проекта.
2.  Активируйте виртуальное окружение: `source venv/bin/activate` (или аналогичная команда для вашей ОС).
3.  Установите зависимости: `pip install -r requirements.txt`.
4.  Примените миграции: `python manage.py migrate`.
5.  Создайте суперпользователя (если еще не создан): `python manage.py createsuperuser`.
6.  Запустите Django development server: `python manage.py runserver 0.0.0.0:8000` (или на указанном вами порту).

### 1.4 Заполнение Реестра Стратегий
1.  Войдите в админ-панель Django (`http://localhost:8000/admin/`).
2.  Перейдите в раздел `Core` -> `Investment Strategies`.
3.  Создайте записи для **каждой** инвестиционной стратегии, которую вы хотите тестировать. Node.js воркеры не будут работать без этих записей.
    -   **Strategy key:** `cross_arbitrage`, `spot_scalping`, `flexible_arbitrage` и т.д.
    -   **Api prefix:** `/api/investments/`, `/api/spot-scalping/`, `/api/flexible/` и т.д.
    -   **Redis channel:** `payouts_cross_arbitrage`, `payouts_spot_scalping` и т.д. (оставьте пустым для `flexible_arbitrage`).

### 1.5 Запуск Node.js Wallet API (`node-wallet/services/api.js`)
1.  Перейдите в директорию `node-wallet`.
2.  Установите зависимости: `npm install`.
3.  Запустите API сервис: `node services/api.js`.
    *   Убедитесь, что он слушает на порту, указанном в `NODEJS_WALLET_API_URL` (например, 3001).
    *   Проверьте логи на предмет успешного запуска и отсутствия ошибок, связанных с `INTERNAL_API_TOKEN`.

### 1.6 Запуск Node.js воркеров
В отдельных терминалах (находясь в директории `node-wallet`):
1.  Запустите `payout_worker.js`: `node workers/payout_worker.js`.
    *   Проверьте логи на предмет успешного подключения к Redis.
2.  Запустите `deposit_monitor.js`: `node workers/deposit_monitor.js`.
    *   Проверьте логи на предмет успешного старта и отсутствия ошибок конфигурации.
    *   **Убедитесь, что воркер успешно получил список стратегий из Django.**

## Этап 2: Модификации для упрощения тестирования (без реальных транзакций)

Для тестирования логики обмена сообщениями и обновления статусов без реальных блокчейн-транзакций, которые требуют настроенных кошельков с газом, реальных RPC-серверов и т.д., вы можете временно модифицировать следующие файлы в `node-wallet`:

*   **`services/tron.js` и `services/evmService.js`:**
    *   В функциях отправки транзакций (`sendTRC20`, `sendERC20`, `sweepTRC20`, `sweepERC20`) и подготовки кошельков (`prepareWalletForSweepTRC20`, `prepareWalletForSweepERC20`):
        *   Закомментируйте код, который выполняет реальные блокчейн-операции.
        *   Возвращайте промис с результатом, имитирующим успех, например:
            ```javascript
            // Пример для sendTRC20 в tron.js
            // async function sendTRC20(to, amount) {
            //   console.log(`[MOCK TRON] Sending ${amount} USDT to ${to}`);
            //   return Promise.resolve({ success: true, txID: 'mock_tron_txid_' + Date.now() });
            // }
            ```
    *   В функциях получения баланса (`getTRC20USDTBalance`, `getNativeBalance`, `getERC20USDTBalance`):
        *   Для адресов временных кошельков, которые вы будете использовать для тестирования депозитов, возвращайте предопределенную сумму (например, '10' для 10 USDT), чтобы `deposit_monitor.js` их обнаружил.
            ```javascript
            // Пример в getTRC20USDTBalance
            // if (address === "АДРЕС_ВАШЕГО_ТЕСТОВОГО_ВРЕМЕННОГО_КОШЕЛЬКА_TRC20") {
            //   console.log(`[MOCK TRON] Returning mock balance 10 USDT for ${address}`);
            //   return '10'; 
            // }
            ```
*   **`services/payout_engine.js`:**
    *   Функция `checkMainWalletBalance`: если вы мокаете функции получения баланса в `tron.js` и `evmService.js`, убедитесь, что они возвращают достаточные балансы для "основного кошелька", чтобы эта проверка проходила успешно.

## Этап 3: Тестирование сценариев

Используйте инструменты типа Postman, Insomnia или `curl` для отправки запросов к Django API. Внимательно следите за логами всех запущенных компонентов.

### Сценарий 1: Полный вывод средств (WithdrawalRequest)

1.  **Подготовка (Django Admin или API):**
    *   У пользователя должен быть `InvestmentAccount` (проверьте через `GET /api/investments/status/`).
    *   На `InvestmentAccount.balance` должны быть средства.
    *   У `InvestmentAccount` должны быть заданы `target_wallet` и `target_wallet_network`.
2.  **Действие пользователя (API Call):**
    *   Отправьте `POST` запрос на эндпоинт Django для создания запроса на вывод всего баланса (согласно вашей реализации, это может быть `/api/investments/withdraw/deposit/` или аналогичный, который создает `WithdrawalRequest`).
        *   Тело запроса: например, `{ "confirm": true }`.
3.  **Ожидаемое поведение:**
    *   Django создает `WithdrawalRequest` (статус `pending`).
    *   Django отправляет сообщение `withdraw_full_balance_cross_arbitrage` в Redis-канал `payouts_cross_arbitrage`.
    *   `payout_worker.js` получает сообщение.
    *   `payout_worker.js` вызывает `payoutEngine.handlePayoutRequest`.
    *   `payout_engine.js` (с вашими моками в `tron.js`/`evmService.js`) возвращает успешный результат (`{ success: true, txHash: 'mock_tx_hash' }`).
    *   `payout_worker.js` отправляет `PATCH` запрос на эндпоинт обновления `WithdrawalRequest` в Django (например, `/api/investments/withdrawal-requests/<uuid:pk>/update_status/`) со статусом `success` (или `completed`) и `tx_hash`.
    *   Django обновляет `WithdrawalRequest` (статус `success` или `completed`, `processed_at`, `tx_hash`) и списывает `amount` с `InvestmentAccount.balance`.
4.  **Проверка:**
    *   Статус и поля `WithdrawalRequest` в Django (через Admin или API).
    *   `InvestmentAccount.balance` в Django.
    *   Логи всех компонентов (Django, `payout_worker.js`, `payout_engine.js`).

### Сценарий 2: Депозит на временный кошелек и его сбор (Sweep)

1.  **Действие пользователя (API Call):**
    *   Отправьте `POST` запрос на `/api/investments/temp-wallets/request/` с телом, например: `{"network": "TRC20"}`.
2.  **Ожидаемое поведение (Генерация кошелька):**
    *   Django (`RequestTemporaryWalletView`) вызывает `POST` на эндпоинт `/generate_wallet` Node.js Wallet API (например, `http://localhost:3001/generate_wallet`).
    *   Node.js `services/api.js` (через `services/api_service.js`) генерирует адрес и приватный ключ.
    *   `api_service.js` шифрует приватный ключ с помощью `utils/crypto.js::encrypt`.
    *   Node.js Wallet API возвращает Django `{ "address": "...", "encryptedPrivateKey": "...", "network": "..." }`.
    *   Django создает `TemporaryWallet` в БД со статусом `pending_deposit`. **Запомните `address` и `id` этого кошелька для моков и проверок.**
3.  **Проверка (Генерация кошелька):**
    *   Наличие новой записи `TemporaryWallet` в БД Django.
    *   Логи Django и `node-wallet/services/api.js`.
4.  **Ожидаемое поведение (`deposit_monitor.js` - обнаружение депозита):**
    *   Через некоторое время `deposit_monitor.js` опросит Django (`GET /api/investments/temp-wallets/pending-deposit/`) и получит созданный кошелек.
    *   `deposit_monitor.js` вызовет функцию получения баланса (например, `tronService.getTRC20USDTBalance`). Эта функция (с вашим моком) должна вернуть сумму > `MIN_USDT_DEPOSIT_TO_PROCESS` для адреса созданного временного кошелька.
    *   `deposit_monitor.js` отправит `POST` на `/api/investments/temp-wallets/notify-deposit/` с адресом, суммой и сетью.
    *   Django (`NotifyDepositView`) обновит статус `TemporaryWallet` на `deposit_detected` и сохранит `detected_amount` и `deposit_tx_hash`.
5.  **Проверка (Обнаружение депозита):**
    *   Статус, `detected_amount`, `deposit_tx_hash` у `TemporaryWallet` в Django.
    *   Логи `deposit_monitor.js` и Django.
6.  **Ожидаемое поведение (`deposit_monitor.js` - сбор средств):**
    *   `deposit_monitor.js` запросит зашифрованный ключ: `GET /api/investments/temp-wallets/<id>/encrypted-key/`.
    *   Django (`TemporaryWalletEncryptedKeyView`) вернет зашифрованный ключ (проверка статуса `deposit_detected` должна пройти).
    *   `deposit_monitor.js` расшифрует ключ с помощью `utils/crypto.js::decrypt` (используя `WALLET_ENCRYPTION_KEY`).
    *   `deposit_monitor.js` вызовет `payoutEngine.handleSweepRequest` (с моками для `prepareWalletForSweep` и `sweep`). `handleSweepRequest` должен вернуть `{ success: true, txHash: 'mock_sweep_tx_hash', preparationTxHash: 'mock_prep_tx_hash' }`.
    *   `deposit_monitor.js` отправит `POST` на `/api/investments/temp-wallets/notify-sweep/` со статусом `sweep_success`, `detected_amount` и мок-хэшами.
    *   Django (`NotifySweepStatusView`) обновит статус `TemporaryWallet` на `sweep_success` и **зачислит `detected_amount` на баланс `InvestmentAccount` пользователя**.
7.  **Проверка (Сбор средств):**
    *   Статус `TemporaryWallet` в Django.
    *   `InvestmentAccount.balance` пользователя в Django (должен увеличиться на `detected_amount`).
    *   Логи `deposit_monitor.js`, `payout_engine.js` и Django.

## Важные моменты для локального тестирования

*   **Логи:** Внимательно следите за консольными логами всех сервисов. Это ваш основной инструмент отладки.
*   **Изолированное тестирование:** Перед полным сквозным тестом убедитесь, что каждый компонент работает отдельно (например, Django API отвечают корректно на запросы через Postman, Node.js скрипты запускаются без ошибок конфигурации).
*   **Переменные окружения:** Тщательно проверьте все переменные окружения, особенно токены авторизации и `WALLET_ENCRYPTION_KEY`.
*   **Очистка состояния:** Между тестами может потребоваться очистка данных (например, удаление тестовых `TemporaryWallet` или `WithdrawalRequest` из БД Django, сброс сообщений в Redis, если что-то пошло не так в предыдущем тесте).

Удачи с тестированием! 