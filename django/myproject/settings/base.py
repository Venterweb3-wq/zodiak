import os
from pathlib import Path
from celery.schedules import crontab
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/
SECRET_KEY = config('SECRET_KEY')

# GeoIP Path Configuration
GEOIP_PATH = os.path.join(BASE_DIR, 'geoip')

# Основной файл конфигурации URL
ROOT_URLCONF = 'myproject.urls'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',
    'django_celery_beat',
    'axes',
    'django_prometheus',
    'rest_framework.authtoken',

    # Project apps
    'myproject.apps.core',
    'myproject.apps.referrals',
    'myproject.apps.cross_arbitrage',
    'myproject.apps.flexible_arbitrage',
    'myproject.apps.spot_scalping',
    'myproject.apps.inter_exchange',
    'myproject.apps.defi_bot',
    'myproject.apps.quick_investments',
    'myproject.apps.payout_engine',
    'myproject.apps.bot_gateway',
    'myproject.apps.market_service',
    'myproject.apps.vclub',
    'myproject.apps.tokenhub',
    'myproject.apps.p2p',
    'myproject.apps.wallets',
    'myproject.apps.supplier_panel',
    'myproject.apps.smc_settings', # Управление и просмотр сигналов SMC
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = False

# Added TEMPLATES configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'myproject/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config("POSTGRES_DB", default="terminal7"),
        'USER': config("POSTGRES_USER", default="postgres"),
        'PASSWORD': config("POSTGRES_PASSWORD", default="0102030405"),
        'HOST': config("DB_HOST", default="localhost"),
        'PORT': config("POSTGRES_PORT", default="5432"),
    }
}

AUTH_USER_MODEL = 'core.User'

CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/1'  # Using a different Redis DB for results
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_CACHE_BACKEND = 'django-cache'  # Optional: For caching

# Celery Beat Settings
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler' # To store schedules in DB
CELERY_BEAT_SCHEDULE = {
    'run-arbitrage-simulation-every-15-seconds': {
        'task': 'run_arbitrage_simulation',
        'schedule': 15.0,
    },
    'process-referral-accruals-every-12-hours': {
        'task': 'process_referral_accruals',
        'schedule': crontab(minute=0, hour='*/12'),
    },
    'generate-flexible-payouts-every-10-mins': {
        'task': 'generate_flexible_payouts',
        'schedule': crontab(minute='*/10'),
    },
    'daily-payouts-at-noon-cross-arbitrage': { 
        'task': 'generate_daily_payouts_cross_arbitrage', 
        'schedule': crontab(hour=12, minute=0),
    },
    'daily-payouts-at-noon-spot-scalping': {
        'task': 'generate_daily_payouts_spot_scalping',
        'schedule': crontab(hour=12, minute=5), # С небольшим смещением
    },
    'daily-payouts-at-noon-inter-exchange': {
        'task': 'generate_daily_payouts_inter_exchange',
        'schedule': crontab(hour=12, minute=10), # С небольшим смещением
    },
    'daily-payouts-at-noon-defi-bot': {
        'task': 'generate_daily_payouts_defi_bot',
        'schedule': crontab(hour=12, minute=15), # С небольшим смещением
    },
}

STATIC_URL = '/static/'
MEDIA_URL = '/media/'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Security settings (consider reviewing and uncommenting/adjusting for production)
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = True # Ensure your site is served over HTTPS
SESSION_COOKIE_SECURE = True # Ensure session cookies are only sent over HTTPS
CSRF_COOKIE_SECURE = True # Ensure CSRF cookies are only sent over HTTPS
# django.middleware.security.SecurityMiddleware should be high in MIDDLEWARE list for these to be effective

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # For development
DEFAULT_FROM_EMAIL = 'noreply@terminal7.io'

# reCAPTCHA settings for manual validation
RECAPTCHA_PUBLIC_KEY = config('RECAPTCHA_PUBLIC_KEY', default='') # Ваш публичный ключ reCAPTCHA
RECAPTCHA_PRIVATE_KEY = config('RECAPTCHA_PRIVATE_KEY', default='') # Ваш приватный ключ reCAPTCHA
# Если вы хотите отключить CAPTCHA для тестов (например, в dev.py):
NOCAPTCHA = True # Вы можете использовать эту настройку для условной валидации CAPTCHA

# Django Axes settings (примеры, настройте под свои нужды)
AXES_FAILURE_LIMIT = 5  # Количество неудачных попыток до блокировки
AXES_COOLOFF_TIME = 0.5  # Время блокировки в часах (например, 0.5 = 30 минут)
AXES_LOCKOUT_TEMPLATE = 'path/to/your/lockout_template.html' # Если хотите кастомную страницу блокировки
AXES_RESET_ON_SUCCESS = True # Сбрасывать счетчик неудачных попыток при успешном входе
AXES_HANDLER = 'axes.handlers.database.AxesDatabaseHandler' # или .cache.AxesCacheHandler
# Для DRF, возможно, потребуется настроить AXES_LOGIN_FAILURE_LIMIT и использовать декораторы в LoginView
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address'] # Блокировать по связке IP + username

# Authentication backends for django-axes
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',  # For django-axes
    'django.contrib.auth.backends.ModelBackend',  # Default Django auth backend
]

# Django REST framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        'rest_framework.permissions.IsAuthenticated',
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20, # Количество элементов на странице
    # Настройки троттлинга
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',  # Лимит для анонимных пользователей (например, регистрация, логин)
        'user': '100/minute', # Лимит для аутентифицированных пользователей
        # Вы можете добавить другие именованные группы для ScopedRateThrottle, если потребуется
        # 'register': '5/hour',
    }
}

# Password hashing
# https://docs.djangoproject.com/en/stable/ref/settings/#password-hashers
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]

# Password validation
# https://docs.djangoproject.com/en/stable/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    # Кастомный валидатор для проверки наличия букв и цифр, если потребуется более строгий контроль
    # Можно создать свой валидатор или использовать существующие библиотеки
    # Пример простого своего валидатора (нужно будет создать файл и класс):
    {
        'NAME': 'myproject.apps.core.password_validators.LetterAndDigitValidator',
    }
]

# Device Token Cookie Settings
DEVICE_TOKEN_COOKIE_NAME = 'device_tkn'
DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60  # 90 дней

# Sentry Configuration
SENTRY_DSN = config('SENTRY_DSN', default=None)
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.2, # Настройте нужный %
        send_default_pii=True
    )

# Token for authenticating Node.js bot workers
# It's recommended to set this in your .env file for production
BOT_WORKER_TOKEN = config('BOT_WORKER_TOKEN', default='my-super-secret-token') 

# --- MongoEngine Connection ---
from mongoengine import connect

connect(
    db=config("MONGO_DB_NAME", default="smartmoney"),
    host=config("MONGO_URI", default="mongodb://localhost:27017/smartmoney"),
    alias="default"
) 