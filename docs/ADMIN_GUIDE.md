# 🎛️ Руководство по админке Django

## 📊 Зарегистрированные модели

### 🎁 Referrals (Реферальная программа)

#### ReferralSettings (Настройки реферальной программы)
```python
@admin.register(ReferralSettings)
class ReferralSettingsAdmin(admin.ModelAdmin):
    list_display = ('level_1_percent', 'level_2_percent', 'accrual_interval_hours', 'is_active', 'updated_at')
    list_editable = ('is_active',)
    fields = ('level_1_percent', 'level_2_percent', 'accrual_interval_hours', 'is_active')
```

**Возможности:**
- Управление процентами начислений (L1: 7%, L2: 3%)
- Настройка интервала начислений (по умолчанию 12 часов)
- Включение/отключение реферальной программы
- Только одна активная настройка одновременно

#### InvestmentTool (Инвестиционные инструменты)
```python
@admin.register(InvestmentTool)
class InvestmentToolAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_key', 'is_active')
    list_editable = ('is_active',)
```

**Возможности:**
- Управление инструментами для начислений
- Активация/деактивация инструментов
- Связь с стратегиями (cross_arbitrage, flexible_arbitrage, etc.)

#### ReferralAccrual (Начисления)
```python
@admin.register(ReferralAccrual)
class ReferralAccrualAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'source_user', 'level', 'investment_tool', 'amount', 'source_model', 'source_object_id', 'created_at')
    list_filter = ('level', 'investment_tool', 'created_at', 'source_model')
    search_fields = ('recipient__username', 'source_user__username', 'source_object_id')
    readonly_fields = ('recipient', 'source_user', 'level', 'investment_tool', 'amount', 'source_profit_amount', 'percentage', 'source_model', 'source_object_id', 'created_at')
```

**Возможности:**
- Просмотр истории начислений
- Фильтрация по уровню, инструменту, дате
- Поиск по пользователям и ID источника
- Только для чтения (создание через Celery)

### 🎯 Core (Ядро системы)

#### User (Пользователи)
```python
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'email_verified', 'is_active', 'referral_code', 'referred_by', 'last_login_ip', 'functionality_limited_until')
    list_filter = ('is_active', 'email_verified', 'date_joined', 'last_login')
    search_fields = ('username', 'email', 'referral_code')
    readonly_fields = ('date_joined', 'last_login', 'last_login_ip')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('email_verified', 'referral_code', 'referred_by', 'marketing_optin', 'last_login_ip', 'functionality_limited_until')}),
    )
```

**Возможности:**
- Поиск по username, email, referral_code
- Фильтрация по статусу активности, верификации email, дате регистрации
- Отображение реферальной информации
- Мониторинг ограничений функционала

#### OneTimeCode (Одноразовые коды)
```python
@admin.register(OneTimeCode)
class OneTimeCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'code', 'created_at', 'expires_at', 'is_used')
    list_filter = ('purpose', 'is_used', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)
```

**Возможности:**
- Мониторинг всех OTP кодов
- Фильтрация по назначению (2FA, устройства)
- Отслеживание использования и истечения

#### LoginHistory (История входов)
```python
@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'ip_address', 'user_agent', 'country', 'city')
    list_filter = ('timestamp', 'country', 'city')
    search_fields = ('user__username', 'ip_address', 'user_agent', 'country', 'city')
    readonly_fields = ('timestamp',)
```

**Возможности:**
- Полная история входов с GeoIP данными
- Поиск по IP, User-Agent, местоположению
- Фильтрация по времени и географии

#### ActivityLog (Лог активности)
```python
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'action_type', 'details', 'ip_address')
    list_filter = ('action_type', 'timestamp')
    search_fields = ('user__username', 'action_type', 'details', 'ip_address')
    readonly_fields = ('timestamp',)
```

**Возможности:**
- Аудит всех действий пользователей
- Фильтрация по типу действия
- Поиск по деталям и IP

#### TrustedDevice (Доверенные устройства)
```python
@admin.register(TrustedDevice)
class TrustedDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_token_hash', 'ip_address', 'added_at', 'last_login_at')
    list_filter = ('added_at', 'last_login_at')
    search_fields = ('user__username', 'device_token_hash')
    readonly_fields = ('added_at', 'last_login_at', 'device_token_hash', 'user', 'ip_address', 'user_agent')
```

**Возможности:**
- Управление доверенными устройствами
- Мониторинг активности устройств
- Безопасное отображение хешей токенов

#### EmailVerification (Подтверждение email)
```python
@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__username', 'user__email', 'code')
    readonly_fields = ('created_at',)
```

**Возможности:**
- Мониторинг подтверждений email
- Отслеживание использования кодов
- Поиск по пользователям и кодам

#### InvestmentStrategy (Инвестиционные стратегии)
```python
@admin.register(InvestmentStrategy)
class InvestmentStrategyAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_key', 'api_prefix', 'redis_channel', 'is_active')
    list_editable = ('is_active',)
```

**Возможности:**
- Управление стратегиями
- Быстрое включение/отключение
- Настройка API и Redis каналов

### 🎁 Referrals (Реферальная система)

#### InvestmentTool (Инвестиционные инструменты)
```python
@admin.register(InvestmentTool)
class InvestmentToolAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_key', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'strategy_key')
```

**Возможности:**
- Управление инструментами для начислений
- Фильтрация по активности
- Поиск по названию и ключу

#### ReferralAccrual (Реферальные начисления)
```python
@admin.register(ReferralAccrual)
class ReferralAccrualAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'source_user', 'level', 'investment_tool', 'amount', 'created_at')
    list_filter = ('level', 'investment_tool', 'created_at')
    search_fields = ('recipient__username', 'source_user__username')
    readonly_fields = ('created_at',)
```

**Возможности:**
- Мониторинг всех начислений
- Фильтрация по уровню и инструменту
- Поиск по участникам

## 🏠 План админ-хаба

### 🎯 Ядро системы
**Карточки-разделы:**
- 👥 **Пользователи** - управление аккаунтами, рефералами
- 🔐 **Безопасность** - 2FA, устройства, коды
- 📊 **Аудит** - логи активности, история входов
- ⚙️ **Настройки** - стратегии, конфигурация

### 🎁 Рефералы
**Карточки-разделы:**
- 🎁 **Начисления** - мониторинг бонусов
- 🛠️ **Инструменты** - управление источниками
- 📈 **Статистика** - дашборд рефералов

### 💰 Финансы
**Карточки-разделы:**
- 💳 **Счета** - инвестиционные счета
- 💸 **Выплаты** - ежедневные начисления
- 💰 **Выводы** - запросы на вывод
- 🏦 **Кошельки** - временные кошельки

### 🤖 Боты
**Карточки-разделы:**
- 🤖 **Боты** - управление ботами
- 📊 **Аналитика** - рыночные данные
- 📈 **Сделки** - торговые операции
- 🔄 **Ребалансы** - межбиржевые переводы

## 🔍 Быстрые ссылки

### Часто используемые действия
1. **Поиск пользователя** - `User` → поиск по username/email
2. **Проверка безопасности** - `LoginHistory` + `ActivityLog`
3. **Мониторинг начислений** - `ReferralAccrual` → фильтр по дате
4. **Управление стратегиями** - `InvestmentStrategy` → редактирование
5. **Проверка устройств** - `TrustedDevice` → мониторинг активности

### Фильтры по умолчанию
- **Активные пользователи** - `User` → `is_active=True`
- **Недавние входы** - `LoginHistory` → последние 24 часа
- **Неиспользованные коды** - `OneTimeCode` → `is_used=False`
- **Активные стратегии** - `InvestmentStrategy` → `is_active=True`

### Экспорт данных
- **CSV экспорт** - доступен для всех моделей
- **Фильтрованные данные** - экспорт с примененными фильтрами
- **Массовые операции** - для моделей с `list_editable`

## 🚨 Мониторинг и алерты

### Критические события
- **Множественные неудачные входы** - `LoginHistory` + `django-axes`
- **Подозрительная активность** - `ActivityLog` с необычными действиями
- **Истекающие коды** - `OneTimeCode` с `expires_at` близко к `now()`
- **Заблокированные пользователи** - `User` с `functionality_limited_until`

### Рекомендуемые дашборды
1. **Обзор безопасности** - `LoginHistory` + `ActivityLog` + `TrustedDevice`
2. **Финансовая активность** - `ReferralAccrual` + инвестиционные модели
3. **Системные события** - `OneTimeCode` + `EmailVerification`
4. **Пользовательская активность** - `User` + связанные модели

## 🔧 Настройка админки

### Кастомизация списков
```python
# Пример для добавления в существующие админки
class CustomAdmin(admin.ModelAdmin):
    list_display = ('field1', 'field2', 'custom_method')
    list_filter = ('field1', 'date_field')
    search_fields = ('field1', 'field2')
    readonly_fields = ('created_at', 'updated_at')
    
    def custom_method(self, obj):
        return f"Custom: {obj.field1}"
    custom_method.short_description = "Custom Display"
```

### Группировка моделей
```python
# В admin.py
admin.site.site_header = "Terminal7 Administration"
admin.site.site_title = "Terminal7 Admin"
admin.site.index_title = "Welcome to Terminal7 Administration"

# Группировка в админке
admin.site.register(Model1, admin_class=Model1Admin)
admin.site.register(Model2, admin_class=Model2Admin)
```

---

**Связанные документы:**
- [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md) - обзор архитектуры
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - полный список эндпоинтов
- [MODELS_MAP.md](./MODELS_MAP.md) - схема моделей данных
