# Полный аудит стека проекта (31-07-2024)

## Часть 1: Django Backend

### 1. Настройки проекта (`django/myproject/settings/`)

#### 1.1. `base.py`

*   **Что сделано:**
    *   Основной файл настроек, определяющий базовую конфигурацию.
    *   **Пути и URL:** `BASE_DIR`, `ROOT_URLCONF`.
    *   **Приложения (`INSTALLED_APPS`):** Стандартные Django, сторонние (`rest_framework`, `corsheaders`, `django_celery_beat`, `axes`), кастомные приложения (`core`, `referrals`, `cross_arbitrage` и т.д.).
    *   **Промежуточное ПО (`MIDDLEWARE`):** Стандартный набор, включая `CorsMiddleware`, `SecurityMiddleware`, `AxesMiddleware`.
    *   **Шаблоны (`TEMPLATES`):** Базовая конфигурация.
    *   **Базы данных (`DATABASES`):** PostgreSQL, считывание параметров из переменных окружения.
    *   **Модель пользователя (`AUTH_USER_MODEL`):** `core.User`.
    *   **Celery:** `CELERY_BROKER_URL` (Redis), `CELERY_RESULT_BACKEND` (Redis), `CELERY_CACHE_BACKEND`, `CELERY_BEAT_SCHEDULER` (DB), `CELERY_BEAT_SCHEDULE` с задачами (включая раскомментированные `args` и `kwargs`).
    *   **Статика и Медиа:** `STATIC_URL`, `MEDIA_URL`, `STATIC_ROOT`, `MEDIA_ROOT`.
    *   **Интернационализация:** Базовые настройки.
    *   **Безопасность:** `SECURE_BROWSER_XSS_FILTER`, `X_FRAME_OPTIONS`. Раскомментированы и включены `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`.
    *   **Email:** `EMAIL_BACKEND` (консоль).
    *   **reCAPTCHA:** Ключи (пустые), `NOCAPTCHA = True`.
    *   **Django Axes:** Раскомментированы и настроены основные параметры.
    *   **Бэкенды аутентификации (`AUTHENTICATION_BACKENDS`):** `AxesStandaloneBackend`, `ModelBackend`. Раскомментирован кастомный валидатор `LetterAndDigitValidator`.
    *   **Django REST framework (`REST_FRAMEWORK`):** JWT-аутентификация, разрешения, пагинация, троттлинг.
    *   **Валидаторы паролей (`AUTH_PASSWORD_VALIDATORS`):** Стандартный набор. Ссылка на кастомный валидатор присутствует, но сам он в списке закомментирован.
*   **Логика работы:** Фундамент конфигурации, расширяемый другими файлами настроек.

#### 1.2. `dev.py`

*   **Что сделано:**
    *   Настройки для среды разработки.
    *   Импорт из `base.py`.
    *   Использует `python-decouple` для загрузки настроек из `.env`.
    *   `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `DATABASES` настроены через `config()`.
    *   Выводит "Загружены настройки DEVELOPMENT".
*   **Логика работы:** Адаптирует базовые настройки для разработки, обеспечивая безопасность и удобство.

*(Предполагается наличие `prod.py` для production-настроек, используемых в Docker)*

### 2. Приложение `core` (`django/myproject/apps/core/`)

#### 2.1. `models.py`
*   **`User(AbstractUser)`:** Кастомная модель пользователя (настройки профиля, верификация email, маркетинг, реферальная система, 2FA, IP, ограничение функционала).
*   **`EmailVerification`:** Коды верификации email.
*   **`OneTimeCode`:** Одноразовые коды (сброс 2FA, подтверждение устройства).
*   **`LoginHistory`:** История входов.
*   **`ActivityLog`:** Логирование действий.
*   **`TrustedDevice`:** Управление доверенными устройствами.

#### 2.2. `serializers.py`
*   Сериализаторы для регистрации, входа, управления 2FA, профиля, статуса безопасности, сброса 2FA, истории входов, логов активности, проверки и управления доверенными устройствами.

#### 2.3. `views.py`
*   API эндпоинты для всех функций, предоставляемых сериализаторами и моделями, включая сложную логику входа с проверкой доверенных устройств и OTP.

#### 2.4. `urls.py` (приложения `core`)
*   URL-маршруты для всех представлений `core`.

### 3. Приложение `cross_arbitrage` (`django/myproject/apps/cross_arbitrage/`)

#### 3.1. `models.py`
*   **`InvestmentAccount`:** Модель для инвестиционных счетов.
*   **`DailyPayout`:** Модель для ежедневных выплат.
*   **`TemporaryWallet`:** Модель для временных кошельков (обновлены `NETWORK_CHOICES`).
*   **`WithdrawalRequest`:** Ключевая модель для вывода USDT. Поля: `investment_account`, `amount`, `network`, `target_wallet`, `status` (с выбором: 'pending', 'processing', 'success', 'failed', 'cancelled'), `tx_hash` (уникальный, индексированный), `requested_at`, `processed_at`, `remarks`.

#### 3.2. `serializers.py`
*   **`CreateWithdrawalRequestSerializer`:** Создание запросов на вывод. Валидация, создание `WithdrawalRequest`, уменьшение баланса `InvestmentAccount`, публикация в Redis (канал `withdrawals_cross_arbitrage`, тип `withdrawal_request_cross_arbitrage`). Реализован откат.
*   **`WithdrawalRequestSerializer`:** Отображение истории выводов.
*   **`WithdrawalRequestUpdateSerializer`:** Для Node.js воркера (обновление статуса, `tx_hash`, `remarks`).
*   Сериализаторы для других моделей приложения (`InvestmentAccount`, `DailyPayout` и т.д.).

#### 3.3. `views.py`
*   **`WithdrawDepositView` (или аналогичный):** Использует `CreateWithdrawalRequestSerializer` для создания запросов на вывод.
*   **`WithdrawalHistoryView`:** Отображение истории выводов.
*   **`WithdrawalRequestUpdateView`:** Эндпоинт для Node.js воркера для обновления `WithdrawalRequest` (использует `WithdrawalRequestUpdateSerializer`, права `IsNodeWorker`, устанавливает `processed_at`).

#### 3.4. `urls.py` (приложения `cross_arbitrage`)
*   URL-маршруты для создания запроса на вывод, просмотра истории, обновления воркером.

#### 3.5. `tasks.py`
*   **`generate_daily_payouts_cross_arbitrage`:** Celery задача. Генерирует ежедневные выплаты. Публикует сообщения в Redis (канал `payouts_cross_arbitrage`, тип `daily_payout_cross_arbitrage`) для Node.js воркера.

#### 3.6. `admin.py`
*   Регистрация моделей, включая `WithdrawalRequest` с кастомным отображением.

#### 3.7. `API_DOCUMENTATION.md`
*   Документация API для приложения.

### 4. Конфигурационные файлы проекта (`django/myproject/`)

#### 4.1. `__init__.py`
*   Импорт `celery_app` для корректной работы Celery.

#### 4.2. `asgi.py` & `wsgi.py`
*   **`asgi.py`:** Практически пуст. Требует настройки для ASGI-серверов, если используется асинхронный Django.
*   **`wsgi.py`:** Практически пуст. **Критически требует исправления** для работы Gunicorn.

#### 4.3. `urls.py` (проектный)
*   Корневая URL-конфигурация, включает URL-ы админки и приложений `core` и `cross_arbitrage`.

#### 4.4. `celery.py`
*   Инициализация и конфигурация Celery. Загрузка настроек из `django.conf:settings` (namespace `CELERY`). Автообнаружение задач.

### 5. Docker-специфичные файлы для Django

#### 5.1. `django/.dockerignore`
*   Исключает ненужные файлы из контекста сборки Docker.

#### 5.2. `django/Dockerfile`
*   Собирает production-ready образ для Django: базовый образ Python, установка зависимостей, копирование кода, сбор статики, настройка пользователя и запуск Gunicorn через `entrypoint.sh`.

#### 5.3. `django/entrypoint.sh`
*   Применяет миграции БД перед запуском основного приложения.

#### 5.4. `django/manage.py`
*   Стандартная утилита Django.

#### 5.5. `django/requirements.txt`
*   Список Python-зависимостей с версиями.

## Часть 2: Node.js Backend (`node-wallet`)

### 1. Управление зависимостями

#### 1.1. `package.json`
*   **Зависимости:** `axios`, `delay`, `node-fetch` (два HTTP клиента - рассмотреть унификацию), `redis` (v5), `uuid`.
*   **Метаданные:** Должен содержать `name`, `version`, `scripts` и т.д. (полная структура не предоставлена, но подразумевается).

#### 1.2. `package-lock.json`
*   Фиксирует точные версии всех зависимостей, обеспечивая воспроизводимость сборок. Используются актуальные версии.

### 2. Структура и компоненты

#### 2.1. Воркеры (`workers/`)
*   **`payout_worker.js`:**
    *   Подписывается на каналы Redis: `payouts_cross_arbitrage` (ежедневные выплаты) и `withdrawals_cross_arbitrage` (выводы USDT).
    *   Маршрутизирует сообщения соответствующим обработчикам.
    *   `processDailyPayout`: Отправляет PATCH на Django API (`/api/investments/payouts/{id}/`).
    *   `processWithdrawalRequest`: Отправляет PATCH на Django API (`/api/investments/withdrawals/{id}/`).
    *   **Логика:** Основной обработчик выплат, взаимодействует с Django через Redis и API.
*   **`deposit_monitor.js`:**
    *   **Предполагаемая логика:** Мониторит блокчейны на предмет входящих депозитов. Сообщает Django через API для обновления балансов/создания записей о депозитах.

#### 2.2. Сервисы (`services/`)
*   **`tron.js`:**
    *   Начальная структура: Инициализация TronWeb, загрузка конфигурации.
    *   Функции (частично реализованы/планируются): `getTRXBalance`, `getTRC20USDTBalance`, `sendTRC20`, `prepareWalletForSweepTRC20`, `sweepTRC20`.
*   **`evmService.js` / `web3.js`:**
    *   Планируется для аналогичных функций в EVM-сетях (Arbitrum, BEP20).
*   **`payout_engine.js`:**
    *   Планируется как оркестратор, вызывающий `tron.js` или `evmService.js` в зависимости от сети.
    *   **Логика:** Инкапсуляция взаимодействия с блокчейнами, предоставление интерфейса для воркеров.

#### 2.3. Утилиты (`utils/`)
*   Предположительно содержит вспомогательные функции.

#### 2.4. Конфигурация кода (`.eslintrc.js`, `.prettierrc`)
*   Настройки для ESLint и Prettier для поддержания качества и стиля кода.

#### 2.5. Dockerfile (`node-wallet/Dockerfile`)
*   Предположительно собирает образ Node.js: установка зависимостей, копирование кода, запуск воркеров.

#### 2.6. Документация (`API.md`, `README.md`)
*   `API.md` (возможно, внутреннее API Node.js), `README.md` (общее описание).

## Часть 3: Оркестрация и инфраструктура (`docker-compose.yml`)

*   **Сервисы:**
    *   `db`: PostgreSQL (volume `postgres_data`).
    *   `redis`: Redis сервер.
    *   `django`: Основное Django-приложение (собирается, volumes для статики/медиа, зависит от `db`, `redis`).
    *   `celery`: Celery worker (тот же образ, что и `django`, зависит от `django`, `redis`).
    *   `celery-beat`: Celery Beat scheduler (тот же образ, зависит от `django`, `redis`).
    *   `flower`: Мониторинг Celery (`mher/flower`, зависит от `redis`, `django`).
    *   `node-payout-worker`: Воркер Node.js для выплат (собирается из `node-wallet`, зависит от `redis`, `django`).
    *   `node-deposit-monitor`: Воркер Node.js для депозитов (собирается из `node-wallet`, зависит от `django`, `redis`).
    *   `node-api`: Сервис Node.js API (собирается из `node-wallet`, зависит от `redis`; команда запуска не ясна из комментариев).
    *   `nginx`: Nginx reverse-proxy (образ `nginx:stable-alpine`, публикует порт 80, проксирует к `django` и, возможно, `node-api`, раздает статику/медиа).
*   **Volumes:** `postgres_data`, `django_media`, `django_static_files`.
*   **Конфигурация:** Широко используется `env_file: .env`.
*   **Логика работы:** Оркеструет запуск, взаимодействие и конфигурацию всех компонентов системы в изолированных Docker-контейнерах.

## Часть 4: Глобальная логика системы и потоки данных

1.  **Архитектура:** Микросервисо-подобная. Django для основной бизнес-логики и API, Node.js для взаимодействия с блокчейнами и асинхронной обработки.
2.  **Взаимодействие Django <-> Node.js:**
    *   **Задачи от Django к Node.js:** Через Redis Pub/Sub (ежедневные выплаты, запросы на вывод USDT).
    *   **Обновления от Node.js к Django:** Через вызовы Django API (обновление статусов выплат, создание записей о депозитах).
3.  **Ключевой поток (Вывод USDT):**
    *   Пользователь -> Django API (создание `WithdrawalRequest`, статус `pending`, уменьшение баланса) -> Сообщение в Redis.
    *   Node.js (`payout_worker.js`) получает сообщение -> `payout_engine.js` -> соответствующий блокчейн-сервис (`tron.js`/`evmService.js`) выполняет транзакцию.
    *   Node.js воркер -> Django API (обновление `WithdrawalRequest` до `success`/`failed` с `tx_hash`).
4.  **Ключевой поток (Депозиты, предполагаемый):**
    *   Node.js (`deposit_monitor.js`) обнаруживает транзакцию в блокчейне.
    *   Node.js воркер -> Django API (создание записи о депозите, обновление баланса пользователя/счета).
5.  **Роль Nginx:** Единая точка входа, reverse-proxy, раздача статики/медиа.

## Часть 5: Сравнение с предыдущим состоянием и ключевые выводы

*   **Согласованность:** Текущий анализ подтверждает и расширяет выводы предыдущего аудита Django. Архитектура развивается в соответствии с намеченным планом.
*   **Новые компоненты/уточнения:**
    *   Явная роль `node-deposit-monitor.js`.
    *   Потенциальное наличие `node-api` сервиса.
    *   Более четкое понимание конфигурации Nginx и взаимодействия сервисов через `docker-compose.yml`.
*   **Сильные стороны:**
    *   Четкое разделение ответственности между Django и Node.js.
    *   Использование асинхронной обработки через Celery и Redis.
    *   Контейнеризация с Docker и оркестрация через Docker Compose.
    *   Продуманная система аутентификации и безопасности в `core` Django.
*   **Области для улучшения (будут детализированы в плане доработок):**
    *   Необходимость исправления `wsgi.py`.
    *   Завершение реализации блокчейн-сервисов в Node.js.
    *   Усиление логирования, обработки ошибок и идемпотентности в Node.js.
    *   Унификация HTTP-клиентов в Node.js.
    *   Полная настройка `prod.py` для Django. 