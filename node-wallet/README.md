# Node.js Сервисы (`node-wallet`)

Этот каталог содержит Node.js приложения, отвечающие за операции с кошельками, обработку выплат и мониторинг депозитов в проекте "my-platform".

## Компоненты

### 1. API Сервис Кошельков (`services/api.js`)

-   **Назначение:** Предоставляет внутренний HTTP API для генерации новых криптовалютных кошельков.
-   **Основные функции:**
    -   Генерация адресов и приватных ключей для сетей TRC20 (Tron), Arbitrum (ETH), BEP20 (BSC).
    -   Шифрование приватных ключей перед их возвратом вызывающей стороне (Django).
-   **Запуск:** Запускается как отдельный сервис в Docker. Команда по умолчанию в `Dockerfile` (`CMD ["node", "services/api.js"]`).
-   **Документация по API:** См. [`API.md`](./API.md) для деталей эндпоинтов (`/healthz`, `/generate_wallet`).

### 2. Воркер Обработки Выплат (`workers/payout_worker.js`)

-   **Назначение:** Отвечает за обработку запросов на выплаты (ежедневные начисления и вывод средств пользователями).
-   **Основные функции:**
    -   Подписывается на Redis-канал (`payouts_cross_arbitrage`).
    -   При получении сообщения (тип `daily_payout_cross_arbitrage` или `withdraw_full_balance_cross_arbitrage`):
        -   Вызывает `services/payout_engine.js` для выполнения **реальных** блокчейн-транзакций по отправке USDT.
        -   Обновляет статус соответствующей записи (`DailyPayout` или `WithdrawalRequest`) в Django через PATCH-запросы, указывая результат транзакции (хеш, успех/ошибка).
-   **Запуск:** Запускается как отдельный сервис в Docker. Команда запуска переопределяется в `docker-compose.yml` на `node workers/payout_worker.js`.

### 3. Воркер Мониторинга Депозитов (`workers/deposit_monitor.js`)

-   **Назначение:** Автоматически отслеживает поступления USDT на временные кошельки пользователей и инициирует процесс их сбора (свипа) на центральные кошельки.
-   **Основные функции:**
    -   Периодически запрашивает у Django список временных кошельков, ожидающих депозита (`/api/investments/temp-wallets/pending-deposit/`).
    -   Проверяет баланс USDT на этих кошельках в соответствующих сетях (TRC20, Arbitrum, BEP20).
    -   При обнаружении депозита:
        1.  Уведомляет Django о поступлении средств (`/api/investments/temp-wallets/notify-deposit/`).
        2.  Запрашивает у Django зашифрованный приватный ключ для данного временного кошелька (`/api/investments/temp-wallets/<id>/encrypted-key/`).
        3.  Расшифровывает приватный ключ.
        4.  Вызывает `services/payout_engine.js` для выполнения свипа:
            -   Сначала, при необходимости, пополняет временный кошелек нативной валютой (TRX, ETH, BNB) для покрытия комиссии за транзакцию свипа (средства для этого берутся с центральных кошельков, ключи от которых указаны в `.env`).
            -   Затем переводит все USDT с временного кошелька на центральный кошелек.
        5.  Уведомляет Django о результате операции свипа (`/api/investments/temp-wallets/notify-sweep/`), включая хеши транзакций и возможные ошибки.
-   **Запуск:** Запускается как отдельный сервис в Docker. Команда запуска переопределяется в `docker-compose.yml` на `node workers/deposit_monitor.js`.

### 4. Движок Платежей (`services/payout_engine.js`)

-   **Назначение:** Центральный сервис для оркестрации выполнения блокчейн-транзакций (обычные выплаты и свипы).
-   **Основные функции:**
    -   `handlePayoutRequest`: Проверяет баланс основного кошелька, затем вызывает соответствующий сервис (`tronService.js` или `evmService.js`) для отправки USDT получателю.
    -   `handleSweepRequest`: Координирует процесс свипа. Сначала вызывает `prepareWalletForSweep...` (в `tronService.js` или `evmService.js`) для пополнения временного кошелька нативной валютой для комиссии, затем вызывает `sweep...` для перевода USDT.
-   **Не запускается как отдельный процесс**, а используется другими модулями (`payout_worker.js`, `deposit_monitor.js`).

### 5. Блокчейн Сервисы (`services/tron.js`, `services/evmService.js`)

-   **Назначение:** Предоставляют низкоуровневые функции для взаимодействия с блокчейнами TRON и EVM-совместимыми сетями (Arbitrum, BSC/BEP20).
-   **Основные функции:**
    -   Получение балансов (нативной валюты и USDT).
    -   Отправка нативной валюты.
    -   Отправка токенов USDT.
    -   Подготовка кошельков к свипу (пополнение нативной валютой).
    -   Свип токенов USDT.
-   Используют библиотеки `tronweb` и `ethers`.
-   **Не запускаются как отдельные процессы.**

### 6. Утилиты (`utils/`)

-   **`crypto.js`**: Функции для AES-256-CBC шифрования и расшифровки приватных ключей. Использует `WALLET_ENCRYPTION_KEY` из `.env`.
-   **`wallet_generator.js`**: Функции для генерации адресов и приватных ключей для различных сетей.

## Переменные Окружения (Обязательные)

Для корректной работы всех сервисов в `node-wallet` необходимо определить следующие переменные в файле `.env` на верхнем уровне проекта:

\`\`\`env
# --- Для API Сервиса Кошельков (services/api.js) ---
PORT=3001 # Порт, на котором будет слушать API сервиса кошельков
INTERNAL_API_TOKEN=your_super_secret_token # Секретный токен для авторизации запросов к API кошельков (от Django)
TRON_API_KEY=ваш_api_ключ_от_trongrid # API ключ для TronGrid (используется в wallet_generator.js)

# --- Для Воркеров (payout_worker.js, deposit_monitor.js) и Блокчейн Сервисов ---
# Общие для Django API
DJANGO_API_BASE_URL=http://django:8000 # Полный базовый URL для Django API (для связи из Docker контейнера)
NODE_WORKER_API_TOKEN=ВАШ_СЕКРЕТНЫЙ_ТОКЕН_ДЛЯ_ВОРКЕРА # Токен для авторизации Node.js воркеров в Django API

# Настройки Deposit Monitor (workers/deposit_monitor.js)
DJANGO_APP_API_PREFIX=/api/investments # Префикс для эндпоинтов Django приложения (если отличается от корня)
DEPOSIT_MONITOR_INTERVAL_MS=30000 # Интервал проверки депозитов в миллисекундах
MIN_USDT_DEPOSIT_TO_PROCESS=0.01 # Минимальная сумма USDT для обработки депозита

# Ключ для шифрования/расшифровки приватных ключей (utils/crypto.js)
WALLET_ENCRYPTION_KEY=32_byte_hex_key_here_must_be_64_chars # 32-байтный HEX ключ (64 символа)

# --- TRON Network (services/tron.js, services/payout_engine.js) ---
TRON_NODE_URL=https://api.trongrid.io # URL ноды TronGrid или вашей собственной
TRON_MAIN_WALLET_ADDRESS=ВАШ_TRON_АДРЕС_ЦЕНТРАЛЬНОГО_КОШЕЛЬКА
TRON_MAIN_WALLET_PRIVATE_KEY=ВАШ_TRON_ПРИВАТНЫЙ_КЛЮЧ_ЦЕНТРАЛЬНОГО_КОШЕЛЬКА
TRC20_USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t # Адрес контракта USDT в сети TRON
TRX_AMOUNT_FOR_SWEEP_FEE=5000000 # Сумма TRX в SUN для пополнения временного кошелька (для комиссии свипа) (5 TRX = 5,000,000 SUN)
SWEEP_DESTINATION_ADDRESS= # Адрес вашего главного TRON кошелька для сбора USDT (если отличается от TRON_MAIN_WALLET_ADDRESS)
MIN_TRX_BALANCE_MAIN_WALLET=100 # Минимальный баланс TRX на основном кошельке для выплат
MIN_USDT_BALANCE_MAIN_WALLET=50 # Минимальный баланс USDT на основных кошельках после выплаты

# --- EVM Networks (services/evmService.js, services/payout_engine.js) ---
# Arbitrum
ARBITRUM_NODE_URL=https://your-arbitrum-node-url
ARBITRUM_USDT_CONTRACT_ADDRESS=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 # Адрес контракта USDT в сети Arbitrum
NATIVE_AMOUNT_FOR_SWEEP_FEE_ARBITRUM=0.001 # Сумма ETH для пополнения временного кошелька (для комиссии свипа)
MIN_ETH_BALANCE_MAIN_WALLET_ARBITRUM=0.01 # Минимальный баланс ETH на основном кошельке для выплат (Arbitrum)

# BSC (BEP20)
BSC_NODE_URL=https://your-bsc-node-url
BSC_USDT_CONTRACT_ADDRESS=0x55d398326f99059fF775485246999027B3197955 # Адрес контракта USDT в сети BSC
NATIVE_AMOUNT_FOR_SWEEP_FEE_BSC=0.002 # Сумма BNB для пополнения временного кошелька (для комиссии свипа)
MIN_BNB_BALANCE_MAIN_WALLET_BSC=0.02 # Минимальный баланс BNB на основном кошельке для выплат (BSC)

# Общие для EVM
EVM_MAIN_WALLET_ADDRESS=ВАШ_EVM_АДРЕС_ЦЕНТРАЛЬНОГО_КОШЕЛЬКА # Общий для Arbitrum и BSC
EVM_MAIN_WALLET_PRIVATE_KEY=ВАШ_EVM_ПРИВАТНЫЙ_КЛЮЧ_ЦЕНТРАЛЬНОГО_КОШЕЛЬКА # Общий для Arbitrum и BSC
EVM_SWEEP_DESTINATION_ADDRESS= # Адрес вашего главного EVM кошелька для сбора USDT (если отличается от EVM_MAIN_WALLET_ADDRESS)

# --- Для Payout Worker (workers/payout_worker.js) ---
# REDIS_HOST, REDIS_PORT, REDIS_URL - обычно наследуются из глобальных настроек Docker Compose
# DJANGO_API_HOST, DJANGO_API_PORT - используются для формирования DJANGO_API_BASE_URL
\`\`\`

## Сборка и Запуск через Docker

Все Node.js сервисы (`api`, `payout_worker`, `deposit_monitor`) собираются и запускаются с использованием Docker и Docker Compose.

-   **`Dockerfile`**: Находится в этой директории (`node-wallet/Dockerfile`). Он отвечает за сборку образа Node.js приложения.
-   **`docker-compose.yml`**: Находится в корне проекта. Он определяет, как запускать сервисы на основе образа, собранного `Dockerfile`.

### Процесс сборки Docker-образа (`Dockerfile`)

1.  **Этап сборки (`builder`):**
    -   Используется базовый образ `node:18-alpine`.
    -   Копируются `package.json` и `package-lock.json`.
    -   Устанавливаются **все** зависимости (`npm ci`), включая `devDependencies`, которые могут быть нужны для сборки или тестирования.
    -   Копируется весь исходный код приложения.

2.  **Производственный этап (финальный образ):**
    -   Используется тот же легкий базовый образ `node:18-alpine`.
    -   Создается специальный пользователь `appuser` без root-прав для повышения безопасности.
    -   Копируются только **необходимые** для работы приложения артефакты из этапа `builder`:
        -   `node_modules` (только производственные зависимости).
        -   Директории с исходным кодом (`services`, `utils`, `workers`).
        -   `package.json` и `package-lock.json`.
    -   Устанавливается `curl` (используется в `HEALTHCHECK` для `services/api.js`).
    -   Права на файлы передаются пользователю `appuser`.
    -   Приложение запускается от имени `appuser`.
    -   **`HEALTHCHECK`**: Настроен для проверки работоспособности `services/api.js` через эндпоинт `/healthz`.
    -   **`CMD ["node", "services/api.js"]`**: Команда по умолчанию для запуска контейнера. Эта команда используется, если в `docker-compose.yml` не указана другая команда для сервиса.

### Запуск через `docker-compose.yml`

В файле `docker-compose.yml` в корне проекта определены сервисы, использующие этот `Dockerfile`:
-   `node-payout-worker`
-   `node-deposit-monitor`
-   (вероятно, будет добавлен и сервис для `services/api.js`, если его еще нет, либо он может быть частью одного из воркеров, если его функционал не нужен отдельно)

Для каждого из этих сервисов:
-   `build.context` указывает на `./node-wallet`.
-   `build.dockerfile` указывает на `Dockerfile`.
-   `command` переопределяет команду по умолчанию из `Dockerfile` для запуска нужного скрипта (например, `node workers/payout_worker.js`).
-   `env_file` подключает общий `.env` файл.

**Чтобы собрать и запустить все сервисы (включая Node.js):**
Находясь в корневой директории проекта (где лежит `docker-compose.yml`), выполните:
\`\`\`bash
docker-compose up --build -d
\`\`\`
-   `--build`: Принудительно пересобирает образы, если в `Dockerfile` или коде были изменения.
-   `-d`: Запускает контейнеры в фоновом (detached) режиме.

Чтобы остановить сервисы:
\`\`\`bash
docker-compose down
\`\`\`

## Архитектура и Взаимодействие

Сервис состоит из нескольких ключевых компонентов:

1.  **API Service (`services/api.js`)**: Предоставляет HTTP API для Django для генерации кошельков.
2.  **Deposit Monitor (`workers/deposit_monitor.js`)**: Воркер, который отслеживает поступления на временные кошельки и инициирует их сбор.
3.  **Payout Worker (`workers/payout_worker.js`)**: Воркер, который обрабатывает запросы на выплаты из Redis.
4.  **Blockchain Services (`services/tron.js`, `services/evmService.js`)**: Модули для низкоуровневого взаимодействия с блокчейнами.
5.  **Payout Engine (`services/payout_engine.js`)**: Оркестратор, который использует блокчейн-сервисы для выполнения выплат и свипов.

### Динамическая конфигурация через "Реестр стратегий"

Ключевой особенностью архитектуры является динамическое получение конфигурации от Django. Воркеры (`deposit_monitor` и `payout_worker`) не имеют жестко закодированных URL или каналов Redis для каждой инвестиционной стратегии.

При запуске они обращаются к специальному эндпоинту в Django (`/api/auth/strategies/list/`), который возвращает список всех активных стратегий и их параметры (`api_prefix`, `redis_channel`).

-   **`deposit_monitor`** динамически формирует список URL для опроса временных кошельков.
-   **`payout_worker`** динамически формирует список каналов Redis для подписки.

**Это позволяет добавлять новые инвестиционные стратегии в Django без необходимости изменять или перезапускать код `node-wallet`.**

## Установка и запуск

### 1. Переменные окружения

Создайте файл `.env` в корневой директории `node-wallet` и заполните его необходимыми переменными. Пример см. в `LOCAL_TESTING_GUIDE.md` в корневом репозитории. 