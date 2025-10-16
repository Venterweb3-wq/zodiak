# 🚀 TODO: Следующие шаги

## 🔒 Безопасность и надежность

### 1. ✅ Идемпотентность начислений ReferralAccrual
**Проблема:** Возможны дубликаты начислений при повторном запуске задачи
**Решение:**
```python
# ✅ Добавлены поля source_model и source_object_id в модель
class ReferralAccrual(models.Model):
    # ... существующие поля ...
    source_model = CharField(max_length=100, help_text="Model name of the profit source")
    source_object_id = CharField(max_length=50, help_text="ID of the specific profit record")
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['recipient', 'level', 'investment_tool', 'source_model', 'source_object_id'],
                name='unique_referral_accrual'
            )
        ]

# ✅ В задаче добавлена обработка IntegrityError
def create_accrual(recipient, source_user, level, tool, source_profit, percentage):
    idempotency_key = f"{recipient.id}_{source_user.id}_{level}_{tool.id}_{source_profit}_{timezone.now().date()}"
    
    try:
        with transaction.atomic():
            # Проверяем существование
            if ReferralAccrual.objects.filter(idempotency_key=idempotency_key).exists():
                return  # Уже начислено
            
            # Создаем начисление
            ReferralAccrual.objects.create(
                # ... поля ...
                idempotency_key=idempotency_key
            )
    except IntegrityError:
        # Игнорируем дубликаты
        pass
```

### 2. Вынести проценты в настройки
**Проблема:** Жестко заданные проценты в коде (0.70 в сериализаторе vs 7%/3% в задаче)
**Решение:**
```python
# Создать модель настроек
class ReferralSettings(models.Model):
    level_1_percentage = DecimalField(max_digits=5, decimal_places=4, default=0.07)
    level_2_percentage = DecimalField(max_digits=5, decimal_places=4, default=0.03)
    accrual_interval_hours = IntegerField(default=12)
    is_active = BooleanField(default=True)
    
    class Meta:
        verbose_name = "Настройки реферальной системы"
        verbose_name_plural = "Настройки реферальной системы"

# Обновить сериализатор
class ReferralDashboardSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        # Получаем настройки из БД
        settings = ReferralSettings.objects.first()
        level_1_percent = settings.level_1_percentage if settings else Decimal('0.07')
        # ... использовать настройки вместо 0.70
```

### 3. Добавить предупреждающие логи
**Проблема:** Молчаливые ошибки при отсутствии моделей
**Решение:**
```python
# В задаче process_referral_accruals
for tool in active_tools:
    model_string = PROFIT_MODELS.get(tool.strategy_key)
    if not model_string:
        logger.warning(f"Profit model not found for strategy: {tool.strategy_key}")
        continue
    
    try:
        ProfitModel = apps.get_model(model_string)
    except LookupError as e:
        logger.error(f"Failed to get model {model_string}: {e}")
        continue
    
    # ... остальная логика
```

## 🛡️ Дополнительная безопасность

### 4. Слой Idempotency Key для чувствительных операций
**Проблема:** Отсутствие защиты от повторных запросов
**Решение:**
```python
# Создать middleware или декоратор
class IdempotencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if request.method in ['POST', 'PUT', 'PATCH']:
            idempotency_key = request.headers.get('Idempotency-Key')
            if idempotency_key:
                # Проверяем кэш/БД на существование ключа
                if self.is_key_used(idempotency_key):
                    return JsonResponse({'error': 'Request already processed'}, status=409)
                # Сохраняем ключ
                self.save_key(idempotency_key)
        
        response = self.get_response(request)
        return response

# Применить к чувствительным эндпоинтам
@method_decorator(idempotency_required, name='dispatch')
class CreateDepositView(APIView):
    # ... логика
```

### 5. Улучшить валидацию паролей
**Текущее состояние:** Только буквы + цифры
**Предложения:**
```python
class EnhancedPasswordValidator:
    def validate(self, password, user=None):
        if len(password) < 12:
            raise ValidationError("Пароль должен содержать минимум 12 символов")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Пароль должен содержать заглавные буквы")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Пароль должен содержать строчные буквы")
        
        if not re.search(r'\d', password):
            raise ValidationError("Пароль должен содержать цифры")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Пароль должен содержать специальные символы")
```

## 🎛️ Админка и UX

### 6. Админ-хаб с карточками
**Проблема:** Сложная навигация в админке
**Решение:**
```python
# Создать кастомную админку
class Terminal7AdminSite(admin.AdminSite):
    site_header = "Terminal7 Administration"
    site_title = "Terminal7 Admin"
    index_title = "Welcome to Terminal7 Administration"
    
    def index(self, request, extra_context=None):
        # Добавить кастомные карточки
        extra_context = extra_context or {}
        extra_context['dashboard_cards'] = [
            {
                'title': 'Пользователи',
                'count': User.objects.count(),
                'url': '/admin/core/user/',
                'icon': '👥'
            },
            {
                'title': 'Реферальные начисления',
                'count': ReferralAccrual.objects.count(),
                'url': '/admin/referrals/referralaccrual/',
                'icon': '🎁'
            },
            # ... другие карточки
        ]
        return super().index(request, extra_context)

# Заменить стандартную админку
admin_site = Terminal7AdminSite(name='terminal7_admin')
```

### 7. Дашборды и аналитика
**Добавить:**
- **График начислений** по времени
- **Топ рефералов** по доходам
- **Статистика по стратегиям** - какие приносят больше
- **Мониторинг ошибок** - failed accruals, errors

## 🔧 Техническая оптимизация

### 8. Кэширование часто запрашиваемых данных
```python
# Кэширование статистики рефералов
@cache_page(60 * 15)  # 15 минут
def referral_dashboard(request):
    # ... логика дашборда

# Кэширование настроек
@cached_property
def referral_settings(self):
    return ReferralSettings.objects.first()
```

### 9. Асинхронная обработка тяжелых операций
```python
# Вынести тяжелые вычисления в Celery
@shared_task
def calculate_referral_statistics(user_id):
    # ... сложные вычисления
    return statistics_data

# В API использовать async task
def get_dashboard(request):
    task = calculate_referral_statistics.delay(request.user.id)
    return Response({'task_id': task.id})
```

### 10. Мониторинг и алерты
```python
# Добавить метрики Prometheus
from django_prometheus.models import PrometheusModelMixin

class ReferralAccrual(PrometheusModelMixin, models.Model):
    # ... поля
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Увеличить счетчик начислений
        prometheus_metrics.referral_accruals_total.inc()

# Настроить алерты
ALERT_RULES = {
    'high_failed_accruals': 'rate(referral_accruals_failed[5m]) > 0.1',
    'low_accrual_volume': 'rate(referral_accruals_total[1h]) < 10',
}
```

## 📊 Аналитика и отчеты

### 11. Расширенная аналитика
- **A/B тестирование** процентов начисления
- **Сегментация пользователей** по активности
- **Прогнозирование** доходов от рефералов
- **ROI анализ** по источникам трафика

### 12. Экспорт данных
```python
# Добавить экспорт в админке
class ReferralAccrualAdmin(admin.ModelAdmin):
    actions = ['export_to_csv', 'export_to_excel']
    
    def export_to_csv(self, request, queryset):
        # ... логика экспорта
```

## 🚀 Масштабирование

### 13. Горизонтальное масштабирование
- **Шардирование** по пользователям
- **Read replicas** для аналитики
- **Кэширование** в Redis
- **CDN** для статических файлов

### 14. Микросервисная архитектура
- **Выделить реферальный сервис** в отдельный микросервис
- **API Gateway** для маршрутизации
- **Event-driven** архитектура для уведомлений

---

**Приоритеты:**
1. 🔥 **Критично**: Идемпотентность начислений (1)
2. 🔥 **Критично**: Исправление процентов (2)
3. ⚠️ **Важно**: Логирование ошибок (3)
4. ⚠️ **Важно**: Idempotency Key (4)
5. 📈 **Улучшения**: Остальные пункты

**Временные рамки:**
- **Неделя 1**: Пункты 1-3 (критичные исправления)
- **Неделя 2**: Пункты 4-6 (безопасность и UX)
- **Неделя 3**: Пункты 7-10 (оптимизация)
- **Неделя 4**: Пункты 11-14 (аналитика и масштабирование)
