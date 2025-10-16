from .base import *
from decouple import config

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=False, cast=bool)

# SECURITY WARNING: SECRET_KEY must be set in the production environment.
# This overrides the default key from base.py and will cause the app to crash if not set.
SECRET_KEY = config('SECRET_KEY')

# УБЕДИТЕСЬ, ЧТО УКАЗАЛИ ПРАВИЛЬНЫЕ ХОСТЫ В .ENV ФАЙЛЕ ДЛЯ ПЕРЕМЕННОЙ ALLOWED_HOSTS
# The app will fail to start if ALLOWED_HOSTS is not set in the environment.
ALLOWED_HOSTS_str = config('ALLOWED_HOSTS')
ALLOWED_HOSTS = [s.strip() for s in ALLOWED_HOSTS_str.split(',') if s.strip()]

# Переопределяем базу данных для production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB'),
        'USER': config('POSTGRES_USER'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('DB_HOST', default='db'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

# Internationalization
LANGUAGE_CODE = 'ru-ru'

# Email settings for Production
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')

# CORS settings
# CORS_ALLOW_ALL_ORIGINS = False # Уже установлено в base.py
CORS_ALLOWED_ORIGINS_STR = config('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in CORS_ALLOWED_ORIGINS_STR.split(',') if origin.strip()]

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': config('DJANGO_LOG_FORMATTER', default='simple'),
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('DJANGO_LOG_LEVEL_ROOT', default='WARNING'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL_DJANGO', default='INFO'),
            'propagate': False,
        },
        'celery': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL_CELERY', default='INFO'),
            'propagate': False,
        },
        'myproject.apps': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL_APPS', default='INFO'),
            'propagate': False,
        },
    },
}

# Node.js Wallet API communication settings
NODE_WALLET_API_HOST = config('NODE_WALLET_API_HOST', default='http://node-api')
NODE_WALLET_API_PORT = config('NODE_WALLET_API_PORT', default='3001')
NODE_WALLET_INTERNAL_API_TOKEN = config('NODE_WALLET_INTERNAL_API_TOKEN')

# Token for Node.js workers to authenticate with Django API
NODE_WORKER_API_TOKEN = config('NODE_WORKER_API_TOKEN')

# Отключаем NOCAPTCHA для продакшена
NOCAPTCHA = config('NOCAPTCHA', default=False, cast=bool)

# print("Загружены настройки PRODUCTION") # Using print in production settings is not recommended. Use logging instead. 