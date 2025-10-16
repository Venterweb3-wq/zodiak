from .base import *  # Наследуемся от base.py
from decouple import config # Оставим decouple, если он используется для DEBUG или специфичных dev переменных

# Переопределяем/добавляем настройки специфичные для разработки

# Для удобства разработки, возвращаем ключам значения по умолчанию, 
# которые были убраны из base.py для безопасности.
# В prod.py они по-прежнему будут обязательными.
SECRET_KEY = config('SECRET_KEY', default='super-secret-dev-key')

DEBUG = config('DEV_DEBUG', default=True, cast=bool) # Используем свою переменную или просто DEBUG = True

# ALLOWED_HOSTS для разработки. base.py может не определять ALLOWED_HOSTS, либо определять его для prod.
# Если base.py определяет ALLOWED_HOSTS, мы его здесь переопределим.
dev_allowed_hosts_str = config('DEV_ALLOWED_HOSTS', default='localhost,127.0.0.1,.ngrok.io')
ALLOWED_HOSTS = [host.strip() for host in dev_allowed_hosts_str.split(',') if host.strip()]

# Добавляем приложения только для разработки
# Убедимся, что INSTALLED_APPS уже существует и является списком после импорта из base.py
if 'INSTALLED_APPS' in locals() and isinstance(INSTALLED_APPS, list):
    # Проверим, нет ли уже sslserver, чтобы не добавлять дубликат
    if 'sslserver' not in INSTALLED_APPS:
        INSTALLED_APPS += ['sslserver']
    # if 'debug_toolbar' not in INSTALLED_APPS: # Пример для debug_toolbar
    #     INSTALLED_APPS += ['debug_toolbar'] 
else:
    # Если INSTALLED_APPS не определен в base.py (маловероятно) или не список, создаем его
    # Это защитный механизм, но base.py должен его определять корректно
    print("ПРЕДУПРЕЖДЕНИЕ: INSTALLED_APPS не был корректно загружен из base.py в dev.py. Пересоздаю.")
    INSTALLED_APPS = [ # Скопируйте сюда ВЕСЬ список из base.py и добавьте 'sslserver'
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'rest_framework',
        'corsheaders',
        'django_celery_beat',
        'axes',
        'myproject.apps.core',
        'myproject.apps.referrals',
        'myproject.apps.cross_arbitrage',
        'myproject.apps.quick_investments',
        'myproject.apps.payout_engine',
        'myproject.apps.bot_gateway',
        'myproject.apps.market_service',
        'myproject.apps.vclub',
        'myproject.apps.tokenhub',
        'myproject.apps.p2p',
        'myproject.apps.wallets',
        'myproject.apps.supplier_panel',
        'sslserver', # Добавили
    ]


# Для локальной разработки, выводим email в консоль (base.py уже ставит console, но для явности можно оставить)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Если в base.py DATABASES уже настроены через os.getenv с подходящими default для разработки,
# то их переопределение здесь не обязательно, если только вы не хотите использовать, например, sqlite для dev.
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db_dev.sqlite3', # Используем BASE_DIR из base.py
#     }
# }

# Убираем лишние print, если они есть в base.py или prod.py, чтобы не было путаницы
# print("Загружены настройки DEVELOPMENT") # Этот print оставляем, чтобы знать, что dev.py активен
print(f"Настройки DEVELOPMENT загружены. DEBUG = {DEBUG}")
# 🔓 Отключаем принудительный HTTPS в DEV
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# 🔓 Разрешаем все источники для CORS в DEV
CORS_ALLOW_ALL_ORIGINS = True

