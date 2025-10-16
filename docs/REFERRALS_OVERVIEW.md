# 🎁 Реферальная система - Обзор

## 📊 Структура системы

### Модели данных

#### InvestmentTool (Инвестиционные инструменты)
```python
class InvestmentTool(models.Model):
    name = CharField(max_length=100, unique=True)  # "Cross Arbitrage", "Flexible Arbitrage"
    strategy_key = CharField(max_length=50, unique=True, db_index=True)  # "cross_arbitrage"
    is_active = BooleanField(default=True)  # Активен ли инструмент
```

#### ReferralAccrual (Реферальные начисления)
```python
class ReferralAccrual(models.Model):
    recipient = ForeignKey(User, related_name='referral_bonuses')  # Получатель бонуса
    source_user = ForeignKey(User, related_name='generated_referral_income')  # Источник прибыли
    level = PositiveSmallIntegerField(choices=[(1, 'Level 1'), (2, 'Level 2')])  # Уровень реферала
    investment_tool = ForeignKey(InvestmentTool, on_delete=models.PROTECT)  # Инструмент
    amount = DecimalField(max_digits=20, decimal_places=8)  # Сумма бонуса
    source_profit_amount = DecimalField(max_digits=20, decimal_places=8)  # Исходная прибыль
    percentage = DecimalField(max_digits=5, decimal_places=4)  # Процент начисления
    created_at = DateTimeField(auto_now_add=True)  # Дата начисления
```

## 🎯 Логика начислений

### Уровни рефералов
- **L1 (Первый уровень)**: 7% от прибыли реферала (настраивается в `ReferralSettings`)
- **L2 (Второй уровень)**: 3% от прибыли реферала реферала (настраивается в `ReferralSettings`)
- **Настройки**: Управляются через модель `ReferralSettings` в админке

### Источники прибыли
```python
# referrals/tasks.py
PROFIT_MODELS = {
    'flexible_arbitrage': 'flexible_arbitrage.FlexiblePayout',
    'cross_arbitrage': 'cross_arbitrage.DailyPayout',
    'spot_scalping': 'spot_scalping.DailyPayout',
    'inter_exchange': 'inter_exchange.DailyPayout',
    'defi_bot': 'defi_bot.DailyPayout',
}
```

### Периодичность начислений
- **Celery задача**: `process_referral_accruals`
- **Расписание**: каждые 12 часов (настраивается в `ReferralSettings.accrual_interval_hours`)
- **Период обработки**: последние 12 часов
- **Celery Beat**: зарегистрирована в `CELERY_BEAT_SCHEDULE`
- **Логирование**: Warning-логи при отсутствии модели профита для активного инструмента

## 🔄 Процесс начисления

### 1. Получение данных о прибыли
```python
# Для каждой активной стратегии
for tool in active_tools:
    ProfitModel = apps.get_model(model_string)
    
    # Определяем поле с датой
    date_field = 'timestamp' if tool.strategy_key == 'flexible_arbitrage' else 'date'
    
    # Получаем прибыль за период
    profits = ProfitModel.objects.filter(**{
        f'{date_field}__gte': start_time,
        f'{date_field}__lt': end_time
    }).select_related('account__user', 'account__user__referred_by', 'account__user__referred_by__referred_by')
```

### 2. Начисление бонусов
```python
for profit in profits:
    source_user = profit.account.user
    profit_amount = profit.amount
    
    # L1 реферер
    level_1_referrer = source_user.referred_by
    if level_1_referrer:
        create_accrual(level_1_referrer, source_user, 1, tool, profit_amount, LEVEL_1_PERCENT)
        
        # L2 реферер
        level_2_referrer = level_1_referrer.referred_by
        if level_2_referrer:
            create_accrual(level_2_referrer, source_user, 2, tool, profit_amount, LEVEL_2_PERCENT)
```

### 3. Создание начисления
```python
def create_accrual(recipient, source_user, level, tool, source_profit, percentage):
    bonus_amount = (source_profit * percentage).quantize(Decimal('1e-8'))
    
    if bonus_amount <= 0:
        return
    
    with transaction.atomic():
        # Создаем запись о начислении
        ReferralAccrual.objects.create(
            recipient=recipient,
            source_user=source_user,
            level=level,
            investment_tool=tool,
            amount=bonus_amount,
            source_profit_amount=source_profit,
            percentage=percentage
        )
        
        # Зачисляем на Flexible Arbitrage счет
        FlexibleAccountModel = apps.get_model('flexible_arbitrage.FlexibleInvestmentAccount')
        account, created = FlexibleAccountModel.objects.get_or_create(
            user=recipient,
            network='TRC20',
            defaults={'balance': bonus_amount}
        )
        
        if not created:
            account.balance += bonus_amount
            account.save(update_fields=['balance'])
```

## 📊 API эндпоинты

### Дашборд рефералов
```python
# GET /api/referrals/dashboard/
class ReferralDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get(self, request):
        user = request.user
        
        # Статистика рефералов
        referral_stats = user.referrals.aggregate(
            total_referrals=Count('id'),
            total_referral_earnings=Coalesce(Sum('referral_earnings__amount'), Decimal('0.0'))
        )
        
        # Детализация по уровням
        level_1_stats = user.referral_bonuses.filter(level=1).aggregate(
            count=Count('id'),
            total_amount=Coalesce(Sum('amount'), Decimal('0.0'))
        )
        
        level_2_stats = user.referral_bonuses.filter(level=2).aggregate(
            count=Count('id'),
            total_amount=Coalesce(Sum('amount'), Decimal('0.0'))
        )
        
        # Последние начисления
        recent_accruals = user.referral_bonuses.select_related(
            'source_user', 'investment_tool'
        ).order_by('-created_at')[:10]
        
        return Response({
            'total_referrals': referral_stats['total_referrals'],
            'total_earnings': referral_stats['total_referral_earnings'],
            'level_1': level_1_stats,
            'level_2': level_2_stats,
            'recent_accruals': ReferralAccrualSerializer(recent_accruals, many=True).data
        })
```

## 🔍 Фильтры и поиск

### В админке
- **По уровню**: L1/L2 рефералы
- **По инструменту**: источник прибыли
- **По дате**: период начислений
- **По пользователям**: получатель/источник

### В API
- **Период**: последние 10 начислений
- **Детализация**: по уровням и инструментам
- **Связанные данные**: пользователи и инструменты

## 💰 Зачисление бонусов

### Направление зачисления
- **Стратегия**: Flexible Arbitrage
- **Сеть**: TRC20 USDT
- **Автоматическое создание**: счетов при первом начислении

### Логика зачисления
```python
# Создание или обновление счета
account, created = FlexibleAccountModel.objects.get_or_create(
    user=recipient,
    network='TRC20',
    defaults={'balance': bonus_amount}
)

if not created:
    account.balance += bonus_amount
    account.save(update_fields=['balance'])
```

## 📈 Статистика и аналитика

### Метрики в дашборде
- **Общее количество рефералов**
- **Общий заработок от рефералов**
- **Статистика по уровням** (L1/L2)
- **Последние начисления**
- **Детализация по инструментам**

### Агрегация данных
```python
# Общая статистика
referral_stats = user.referrals.aggregate(
    total_referrals=Count('id'),
    total_referral_earnings=Coalesce(Sum('referral_earnings__amount'), Decimal('0.0'))
)

# По уровням
level_1_stats = user.referral_bonuses.filter(level=1).aggregate(
    count=Count('id'),
    total_amount=Coalesce(Sum('amount'), Decimal('0.0'))
)
```

## 🚨 Мониторинг и логирование

### Отслеживание ошибок
```python
try:
    with transaction.atomic():
        # Создание начисления и зачисление
        pass
except Exception as e:
    print(f"Failed to create referral accrual for {recipient.username}: {e}")
```

### Логирование операций
- **Успешные начисления** - в ReferralAccrual
- **Ошибки зачисления** - в консоль/логи
- **Статистика обработки** - в Celery результатах

## 🔧 Настройки системы

### Проценты начисления
```python
# referrals/tasks.py
LEVEL_1_PERCENT = Decimal('0.07')  # 7%
LEVEL_2_PERCENT = Decimal('0.03')  # 3%
ACCRUAL_TIMEDELTA = timedelta(hours=12)  # Период обработки
```

### Периодичность задач
```python
# settings/base.py
CELERY_BEAT_SCHEDULE = {
    'process-referral-accruals-every-12-hours': {
        'task': 'process_referral_accruals',
        'schedule': crontab(minute=0, hour='*/12'),
    },
}
```

## 🎯 Особенности реализации

### Оптимизация запросов
- **select_related** для избежания N+1 проблем
- **bulk_create** для массовых операций
- **iterator()** для больших наборов данных

### Транзакционность
- **atomic()** для обеспечения целостности
- **rollback** при ошибках
- **изоляция** операций

### Масштабируемость
- **Celery** для асинхронной обработки
- **Redis** для очередей
- **PostgreSQL** для ACID транзакций

---

**Связанные документы:**
- [BACKEND_OVERVIEW.md](./BACKEND_OVERVIEW.md) - обзор архитектуры
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - полный список эндпоинтов
- [MODELS_MAP.md](./MODELS_MAP.md) - схема моделей данных
