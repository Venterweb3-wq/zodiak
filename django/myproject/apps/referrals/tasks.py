from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.apps import apps
from django.db import transaction, IntegrityError
import logging

from .models import InvestmentTool, ReferralAccrual, ReferralSettings
from myproject.apps.core.models import User

logger = logging.getLogger(__name__)

# Сопоставление ключа стратегии и модели, где хранится прибыль
PROFIT_MODELS = {
    'flexible_arbitrage': 'flexible_arbitrage.FlexiblePayout',
    'cross_arbitrage': 'cross_arbitrage.DailyPayout',
    'spot_scalping': 'spot_scalping.DailyPayout',
    'inter_exchange': 'inter_exchange.DailyPayout',
    'defi_bot': 'defi_bot.DailyPayout',
}

@shared_task(name="process_referral_accruals")
def process_referral_accruals():
    # Получаем настройки реферальной программы
    settings_obj = ReferralSettings.get_active_settings()
    if not settings_obj.is_active:
        return "Referral program is disabled."
    
    end_time = timezone.now()
    start_time = end_time - timedelta(hours=settings_obj.accrual_interval_hours)

    active_tools = InvestmentTool.objects.filter(is_active=True)
    if not active_tools:
        return "No active investment tools."

    for tool in active_tools:
        model_string = PROFIT_MODELS.get(tool.strategy_key)
        if not model_string:
            logger.warning(f"No profit model found for investment tool: {tool.strategy_key}")
            continue

        try:
            ProfitModel = apps.get_model(model_string)
        except LookupError:
            logger.warning(f"Model {model_string} not found for investment tool: {tool.strategy_key}")
            continue
        
        # Определяем поле с датой в зависимости от модели
        date_field = 'timestamp' if tool.strategy_key == 'flexible_arbitrage' else 'date'
        
        # Получаем все записи о прибыли за последний период
        # Оптимизация: используем select_related для предзагрузки пользователей и их рефереров (до 2-го уровня),
        # чтобы избежать проблемы N+1 внутри цикла.
        profits = ProfitModel.objects.filter(**{
            f'{date_field}__gte': start_time,
            f'{date_field}__lt': end_time
        }).select_related(
            'account__user',
            'account__user__referred_by',
            'account__user__referred_by__referred_by'
        )

        for profit in profits:
            # Благодаря select_related, все следующие обращения к связанным объектам не будут делать новых запросов к БД.
            source_user = profit.account.user
            profit_amount = profit.amount

            # Реферер 1-го уровня
            level_1_referrer = source_user.referred_by
            if level_1_referrer:
                create_accrual(level_1_referrer, source_user, 1, tool, profit_amount, settings_obj.level_1_percent, model_string, profit.id)

                # Реферер 2-го уровня
                level_2_referrer = level_1_referrer.referred_by
                if level_2_referrer:
                    create_accrual(level_2_referrer, source_user, 2, tool, profit_amount, settings_obj.level_2_percent, model_string, profit.id)
    
    return f"Processed referral accruals for period {start_time} to {end_time}."


def create_accrual(recipient, source_user, level, tool, source_profit, percentage, source_model, source_object_id):
    """Создает запись о начислении и обновляет баланс пользователя."""
    bonus_amount = (source_profit * percentage).quantize(Decimal('1e-8'))
    
    if bonus_amount <= 0:
        return

    try:
        with transaction.atomic():
            # Создаем запись о начислении
            ReferralAccrual.objects.create(
                recipient=recipient,
                source_user=source_user,
                level=level,
                investment_tool=tool,
                amount=bonus_amount,
                source_profit_amount=source_profit,
                percentage=percentage,
                source_model=source_model,
                source_object_id=str(source_object_id)
            )
            
            # Находим и обновляем счет flexible_arbitrage для USDT (TRC20 по умолчанию)
            # ВАЖНО: Предполагаем, что реферальные бонусы зачисляются на flexible_arbitrage счет в сети TRC20
            FlexibleAccountModel = apps.get_model('flexible_arbitrage.FlexibleInvestmentAccount')
            account, created = FlexibleAccountModel.objects.get_or_create(
                user=recipient,
                network='TRC20',
                defaults={'balance': bonus_amount}
            )
            
            if not created:
                account.balance += bonus_amount
                account.save(update_fields=['balance'])

    except IntegrityError:
        # Игнорируем дубликаты - начисление уже существует
        logger.debug(f"Referral accrual already exists for recipient {recipient.username}, level {level}, source {source_model}:{source_object_id}")
    except Exception as e:
        logger.error(f"Failed to create referral accrual for {recipient.username}: {e}") 