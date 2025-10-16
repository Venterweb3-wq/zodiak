# 🛡️ Политика безопасности

## 🔐 Парольные политики

### Валидация паролей
```python
# password_validators.py
class LetterAndDigitValidator:
    def validate(self, password, user=None):
        if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
            raise ValidationError(
                _("Пароль должен содержать хотя бы одну букву и одну цифру."),
                code='password_no_letter_or_digit',
            )
```

### Требования к паролям
- **Минимум 8 символов**
- **Обязательно: хотя бы одна буква (A-Z, a-z)**
- **Обязательно: хотя бы одна цифра (0-9)**
- **Проверка на общие пароли** (Django встроенная)
- **Проверка на числовые пароли** (Django встроенная)
- **Проверка на схожесть с пользовательскими данными** (Django встроенная)

### ✅ Хеширование паролей
```python
# settings/base.py
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',  # ✅ Основной
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',  # Fallback
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]

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
    {
        'NAME': 'myproject.apps.core.password_validators.LetterAndDigitValidator',
    }
]
```

**TODO:** Проверить использование Argon2 хешера (по умолчанию Django использует PBKDF2)

## 🔐 2FA (Двухфакторная аутентификация)

### Поток включения 2FA
1. **POST `/api/auth/2fa/enable/`** - генерация секрета TOTP
2. **POST `/api/auth/2fa/confirm/`** - подтверждение с TOTP кодом
3. **Активация** - `user.two_factor_enabled = True`

### Поток сброса 2FA
1. **POST `/api/auth/2fa/reset/request/`** - запрос кода на email
2. **POST `/api/auth/2fa/reset/confirm/`** - подтверждение с кодом
3. **Отключение** - `user.two_factor_enabled = False`
4. **Ограничения** - `user.functionality_limited_until = now + 24 hours`

### ✅ Ограничения после сброса 2FA
```python
# views.py - ProfileView
if user.functionality_limited_until and user.functionality_limited_until > timezone.now():
    return Response(
        {"error": "Обновление профиля временно ограничено после сброса 2FA. Пожалуйста, подождите.",
         "limited_until": user.functionality_limited_until.isoformat()},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Особенности:**
- **Период ограничения**: 24 часа после сброса 2FA
- **Поле**: `functionality_limited_until` в модели User
- **Текущая блокировка**: Только обновление профиля
- **TODO**: Добавить проверки в другие чувствительные операции (смена пароля, 2FA операции)
```

### TOTP настройки
- **Алгоритм**: TOTP (RFC 6238)
- **Период**: 30 секунд
- **Длина кода**: 6 цифр
- **Секрет**: Base32 encoded (32 символа)
- **URI формат**: `otpauth://totp/Terminal7:{username}?secret={secret}&issuer=Terminal7`

## 🚦 Throttling и Rate Limiting

### ✅ Настройки throttling
```python
# settings/base.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',   # Анонимные пользователи
        'user': '1000/hour',  # Аутентифицированные пользователи
        'login': '5/hour',    # Вход в систему
        'sensitive': '10/hour', # Чувствительные операции
    }
}
```

### Применение throttling по эндпоинтам

| Эндпоинт | Throttle Scope | Лимит | Применение |
|----------|----------------|-------|------------|
| `/api/auth/register/` | `AnonRateThrottle` | 20/мин | Регистрация |
| `/api/auth/login/` | `AnonRateThrottle` | 20/мин | Вход |
| `/api/auth/2fa/reset/request/` | `AnonRateThrottle` | 20/мин | Сброс 2FA |
| `/api/auth/verify-device/` | `AnonRateThrottle` | 20/мин | Подтверждение устройства |
| `/api/auth/profile/` | `UserRateThrottle` | 100/мин | Профиль |
| `/api/auth/security-status/` | `UserRateThrottle` | 100/мин | Статус безопасности |
| `/api/auth/login-history/` | `UserRateThrottle` | 100/мин | История входов |
| `/api/auth/activity-log/` | `UserRateThrottle` | 100/мин | Лог активности |
| `/api/auth/trusted-devices/` | `UserRateThrottle` | 100/мин | Управление устройствами |

### django-axes настройки
```python
# settings/base.py
AXES_FAILURE_LIMIT = 5  # Количество неудачных попыток до блокировки
AXES_COOLOFF_TIME = 0.5  # Время блокировки в часах (30 минут)
AXES_RESET_ON_SUCCESS = True  # Сброс счетчика при успешном входе
AXES_LOCKOUT_PARAMETERS = ['username', 'ip_address']  # Блокировка по IP + username
```

## 🔑 Кастомные permissions

### IsNodeWorker
```python
# permissions.py
class IsNodeWorker(BasePermission):
    def has_permission(self, request, view):
        expected_token = getattr(settings, 'NODE_WORKER_API_TOKEN', None)
        if not expected_token:
            return False
        
        auth_header = request.headers.get("Authorization", "")
        token_type, _, client_token = auth_header.partition(' ')
        
        if token_type.lower() != "bearer" or not client_token:
            return False
        
        return client_token == expected_token
```

### Применение permissions

| Permission | Эндпоинты | Описание |
|------------|-----------|----------|
| `AllowAny` | Регистрация, вход, подтверждение email, сброс 2FA, подтверждение устройств | Публичные эндпоинты |
| `IsAuthenticated` | Профиль, безопасность, история, устройства, инвестиции | Защищенные эндпоинты |
| `IsNodeWorker` | Внутренние API ботов, обновление статусов | Node.js боты |
| `HasActiveBotStrategy` | Bot Gateway API | Пользователи с активными стратегиями |

## 📊 Логи безопасности

### LoginHistory
**Кто пишет:**
- `LoginView` - при успешном входе
- `VerifyDeviceView` - при подтверждении устройства

**Что записывается:**
- IP адрес
- User-Agent
- Страна и город (GeoIP)
- Время входа

**Где читается:**
- `LoginHistoryView` - API для пользователей
- `LoginHistoryAdmin` - админка

### ActivityLog
**Кто пишет:**
- `RegisterView` - регистрация
- `LoginView` - вход
- `VerifyEmailView` - подтверждение email
- `Confirm2FAView` - включение 2FA
- `Request2FAResetView` - запрос сброса 2FA
- `Confirm2FAResetView` - сброс 2FA
- `ProfileView` - обновление профиля
- `TrustedDeviceManagementView` - удаление устройств

**Что записывается:**
- Тип действия
- Детали (JSON)
- IP адрес
- Время

**Где читается:**
- `ActivityLogView` - API для пользователей
- `ActivityLogAdmin` - админка

### Типы действий в ActivityLog
```python
ACTION_TYPES = (
    ('USER_REGISTERED', 'User Registered'),
    ('USER_LOGGED_IN', 'User Logged In'),
    ('USER_LOGGED_OUT', 'User Logged Out'),
    ('PROFILE_UPDATED', 'Profile Updated'),
    ('PASSWORD_CHANGED', 'Password Changed'),
    ('EMAIL_VERIFIED', 'Email Verified'),
    ('2FA_ENABLED', '2FA Enabled'),
    ('2FA_DISABLED', '2FA Disabled'),
    ('2FA_RESET_REQUESTED', '2FA Reset Requested'),
    ('2FA_RESET_COMPLETED', '2FA Reset Completed'),
    ('DEVICE_VERIFICATION_FAILED', 'Device Verification Failed'),
    ('DEVICE_VERIFIED_AND_LOGGED_IN', 'Device Verified and Logged In'),
    ('TRUSTED_DEVICE_REMOVED', 'Trusted Device Removed'),
    ('INVALID_DEVICE_COOKIE_ATTEMPT', 'Invalid Device Cookie Attempt'),
    ('NEW_DEVICE_OTP_SENT', 'New Device OTP Sent'),
)
```

## 🔒 Доверенные устройства

### Система токенов
- **Cookie**: `device_tkn` (90 дней)
- **Хеширование**: SHA-256
- **Хранение**: `TrustedDevice.device_token_hash`
- **Генерация**: `secrets.token_urlsafe(32)`

### Логика работы
1. **Проверка cookie** при входе
2. **Поиск в TrustedDevice** по хешу
3. **Обновление last_login_at** при успехе
4. **Отправка OTP** при отсутствии/невалидности

### Безопасность
- **HttpOnly cookie** - защита от XSS
- **Secure flag** - только HTTPS
- **SameSite=Lax** - защита от CSRF
- **Хеширование** - защита от утечек

## 🌍 GeoIP интеграция

### Определение местоположения
```python
# views.py
if geoip_reader and ip_address:
    try:
        response = geoip_reader.city(ip_address)
        country = response.country.name
        city = response.city.name
    except AddressNotFoundError:
        pass
```

### База данных
- **Файл**: `GeoLite2-City.mmdb`
- **Путь**: `settings.GEOIP_PATH`
- **Инициализация**: при загрузке модуля

## 📧 Email безопасность

### reCAPTCHA
```python
# serializers.py
def validate_captcha(self, value):
    if getattr(settings, 'NOCAPTCHA', False):
        return value
        
    response = requests.post(
        'https://www.google.com/recaptcha/api/siteverify',
        data={
            'secret': settings.RECAPTCHA_PRIVATE_KEY,
            'response': value
        },
        timeout=5
    )
    result = response.json()
    
    if not result.get('success'):
        raise serializers.ValidationError("Проверка CAPTCHA не пройдена.")
    return value
```

### OTP коды
- **Время жизни**: 15 минут
- **Длина**: 6 цифр (устройства), 16 символов (сброс 2FA)
- **Одноразовые**: автоматическое удаление после использования
- **Проверка истечения**: `expires_at > timezone.now()`

## 🔐 HTTPS настройки

```python
# settings/base.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
```

## 🚨 Мониторинг безопасности

### Prometheus метрики
- **URL**: `/metrics/`
- **Метрики**: запросы, ошибки, время ответа

### Sentry интеграция
```python
# settings/base.py
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.2,
        send_default_pii=True
    )
```

### Логирование
- **Django logging** - стандартные логи
- **ActivityLog** - бизнес-события
- **LoginHistory** - входы в систему

---

**Связанные документы:**
- [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md) - обзор архитектуры
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - полный список эндпоинтов
- [MODELS_MAP.md](./MODELS_MAP.md) - схема моделей данных
