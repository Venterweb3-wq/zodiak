# Аудит Django проекта (31-07-2024)

## 1. Настройки проекта (`django/myproject/settings/`)

### 1.1. `base.py`

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

### 1.2. `dev.py`

*   **Что сделано:**
    *   Настройки для среды разработки.
    *   Импорт из `base.py`.
    *   Использует `python-decouple` для загрузки настроек из `.env`.
    *   `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY`, `DATABASES` настроены через `config()`.
    *   Выводит "Загружены настройки DEVELOPMENT".
*   **Логика работы:** Адаптирует базовые настройки для разработки, обеспечивая безопасность и удобство.

## 2. Приложение `core` (`django/myproject/apps/core/`)

### 2.1. `models.py`

*   **Что сделано:**
    *   **`User(AbstractUser)`:** Кастомная модель пользователя с полями для настроек профиля, верификации email, маркетинга, реферальной системы, 2FA, IP последнего входа, ограничения функционала. Методы `get_totp_uri()`, `generate_2fa_secret()`.
    *   **`EmailVerification`:** Коды верификации email.
    *   **`OneTimeCode`:** Одноразовые коды для различных целей (сброс 2FA, подтверждение устройства).
    *   **`LoginHistory`:** История входов (IP, User-Agent).
    *   **`ActivityLog`:** Логирование действий пользователя.
    *   **`TrustedDevice`:** Управление доверенными устройствами (хеш токена из cookie, первоначальный "отпечаток", IP, User-Agent, метки времени). Методы `generate_initial_fingerprint()`, `set_new_token()`.
*   **Логика работы:** Ядро управления пользователями, аутентификацией, безопасностью и отслеживанием активности.

### 2.2. `serializers.py`

*   **Что сделано:**
    *   **`RegisterSerializer`:** Регистрация (пароли, условия, реф. код, CAPTCHA). Создает неактивного пользователя.
    *   **`LoginSerializer`:** Вход (username, password, 2FA токен).
    *   **`EmailVerificationSerializer`:** (Не используется явно в текущих views для POST).
    *   **`Enable2FASerializer`:** Генерация секрета 2FA и URI.
    *   **`Confirm2FASerializer`:** Подтверждение и включение 2FA.
    *   **`UserProfileSerializer`:** Отображение профиля (включая заглушки для финансовых данных).
    *   **`UserProfileUpdateSerializer`:** Обновление профиля.
    *   **`SecurityStatusSerializer`:** Отображение статуса безопасности.
    *   **`Request2FAResetSerializer`:** Запрос сброса 2FA.
    *   **`Confirm2FAResetSerializer`:** Подтверждение сброса 2FA.
    *   **`LoginHistorySerializer`:** Сериализация истории входов.
    *   **`ActivityLogSerializer`:** Сериализация логов активности.
    *   **`VerifyDeviceSerializer`:** Проверка нового устройства по OTP.
    *   **`TrustedDeviceSerializer`:** Отображение доверенных устройств.
*   **Логика работы:** Валидация, преобразование данных (модели <-> JSON), инкапсуляция части логики обработки данных.

### 2.3. `views.py`

*   **Что сделано:**
    *   **`log_activity`:** Вспомогательная функция для `ActivityLog`.
    *   **`RegisterView`:** Регистрация, отправка email верификации.
    *   **`LoginView`:** Вход, проверка доверенных устройств (cookie, OTP).
    *   **`VerifyEmailView`:** Активация email по ссылке.
    *   **`Enable2FAView`:** Инициация настройки 2FA.
    *   **`Confirm2FAView`:** Завершение настройки 2FA.
    *   **`ProfileView`:** Просмотр и обновление профиля (с проверкой `functionality_limited_until`).
    *   **`SecurityStatusView`:** Отображение статуса безопасности.
    *   **`ResendVerificationEmailView`:** Повторная отправка email верификации.
    *   **`Request2FAResetView`:** Запрос сброса 2FA (OTP на email).
    *   **`Confirm2FAResetView`:** Подтверждение сброса 2FA (отключает 2FA, устанавливает `functionality_limited_until`).
    *   **`LoginHistoryView`:** Отображение истории входов.
    *   **`ActivityLogView`:** Отображение логов активности.
    *   **`VerifyDeviceView`:** Проверка нового устройства по OTP (создает `TrustedDevice`, устанавливает cookie, логинит).
    *   **`TrustedDeviceManagementView`:** Просмотр и удаление доверенных устройств.
*   **Логика работы:** Точки входа API, используют сериализаторы, модели, управляют аутентификацией, разрешениями, троттлингом, выполняют бизнес-логику.

### 2.4. `urls.py` (приложения `core`)

*   **Что сделано:** Определены URL-пути для всех представлений `core`.
*   **Логика работы:** Маршрутизация запросов внутри приложения `core`.

## 3. Конфигурационные файлы проекта (`django/myproject/`)

### 3.1. `__init__.py`

*   **Что сделано:** Импортирует `celery_app`.
*   **Логика работы:** Гарантирует загрузку Celery при старте Django.

### 3.2. `asgi.py`

*   **Что сделано:** Файл практически пуст (содержит только перенос строки).
*   **Логика работы:** Точка входа для ASGI-серверов. Требует настройки, если используются асинхронные возможности Django (например, Channels).

### 3.3. `wsgi.py`

*   **Что сделано:** Файл практически пуст (содержит только перенос строки).
*   **Логика работы:** Точка входа для WSGI-серверов. **Критически важно исправить**, так как Gunicorn (из `Dockerfile`) ожидает объект `application`.

### 3.4. `urls.py` (проектный)

*   **Что сделано:** Основные URL-маршруты, включая админку и URL-конфигурации приложений `core` и `cross_arbitrage`.
*   **Логика работы:** Корневой файл URL-конфигурации, делегирует запросы приложениям.

### 3.5. `celery.py`

*   **Что сделано:**
    *   Устанавливает `DJANGO_SETTINGS_MODULE` (по умолчанию `myproject.settings.dev`).
    *   Создает экземпляр `Celery('myproject')`.
    *   Загружает конфигурацию из `django.conf:settings` (namespace `CELERY`).
    *   Включает `app.autodiscover_tasks()`.
    *   Пример задачи `debug_task`.
*   **Логика работы:** Инициализация и конфигурация Celery для фоновых и периодических задач.

## 4. Docker и окружение

### 4.1. `django/.dockerignore`

*   **Что сделано:** Исключает ненужные файлы и директории из контекста сборки Docker (Git, Python-кэш, IDE, локальные секреты). Закомментированы строки для `mediafiles/` и `staticfiles_collected/`.
*   **Логика работы:** Уменьшает размер образа, повышает безопасность.

### 4.2. `django/Dockerfile`

*   **Что сделано:**
    *   Базовый образ `python:3.11-slim-buster`.
    *   Установка переменных окружения (`DJANGO_SETTINGS_MODULE=myproject.settings.prod`).
    *   Установка системных зависимостей (`build-essential`, `libpq-dev`).
    *   Копирование `requirements.txt` и установка зависимостей Python.
    *   Создание непривилегированного пользователя `django_user`.
    *   Копирование `entrypoint.sh`.
    *   Копирование кода проекта.
    *   Создание директорий для статики/медиа и назначение прав.
    *   Сбор статики (`collectstatic`).
    *   Переключение на `django_user`.
    *   `EXPOSE 8000`.
    *   `ENTRYPOINT ["/app/entrypoint.sh"]`.
    *   `CMD ["gunicorn", ..., "myproject.wsgi:application"]`.
*   **Логика работы:** Описывает сборку production-ready Docker-образа.

### 4.3. `django/entrypoint.sh`

*   **Что сделано:** Применяет миграции (`manage.py migrate`) перед запуском основной команды (Gunicorn).
*   **Логика работы:** Обеспечивает актуальность схемы БД при старте контейнера.

### 4.4. `django/manage.py`

*   **Что сделано:** Стандартный `manage.py`. Устанавливает `DJANGO_SETTINGS_MODULE` в `myproject.settings.dev` по умолчанию для локального использования.
*   **Логика работы:** Командная утилита Django.

### 4.5. `django/requirements.txt`

*   **Что сделано:** Перечислены все Python-зависимости с версиями (Django, DRF, Celery, psycopg2, Gunicorn, python-decouple и т.д.).
*   **Логика работы:** Обеспечивает воспроизводимость установки зависимостей.

## Общая логика работы кода

1.  **Запрос к API** -> **Маршрутизация (urls.py)** -> **Middleware** -> **Представление (View)**.
2.  **View** использует **Сериализатор** для валидации данных и взаимодействия с **Моделями**.
3.  **Модели** представляют данные в **Базе данных** (PostgreSQL).
4.  **View** возвращает **Ответ** (JSON).
5.  **Celery** используется для **фоновых/периодических задач**, взаимодействуя с Redis. 