from celery import shared_task
from django.utils import timezone
from decimal import Decimal
from .models import InvestmentAccount, DailyPayout, InvestmentConfig, WithdrawalRequest
from datetime import date, timedelta
import redis
from django.conf import settings
import json
from django.db.models import F

# Consider moving Redis settings to Django settings if they might change by environment
REDIS_HOST = 'redis'
REDIS_PORT = 6379
# Define this in settings.py and import it, e.g., from django.conf import settings
# REDIS_PAYOUT_CHANNEL = getattr(settings, 'REDIS_PAYOUT_CHANNEL_CROSS_ARBITRAGE', 'payouts_cross_arbitrage') 
REDIS_CHANNEL = 'payouts_cross_arbitrage'  # Make channel name specific to this app or context

@shared_task(name='generate_daily_payouts_cross_arbitrage')
def generate_daily_payouts():
    today = timezone.localdate()

    try:
        config = InvestmentConfig.objects.get(strategy='cross_arbitrage', is_active=True)
    except InvestmentConfig.DoesNotExist:
        return "[Cross Arbitrage Payout Task] ❌ Strategy 'cross_arbitrage' is disabled or not found."
    except InvestmentConfig.MultipleObjectsReturned:
        config = InvestmentConfig.objects.filter(strategy='cross_arbitrage', is_active=True).last()

    # Оптимизированный запрос:
    # 1. Фильтруем активные аккаунты.
    # 2. Исключаем те, у которых уже есть выплата за сегодня.
    # 3. Исключаем заблокированные, вычисляя дату разблокировки на лету.
    # 4. Выбираем только те, у кого есть целевой кошелек.
    accounts_to_process = InvestmentAccount.objects.filter(
        activated=True,
        target_wallet__isnull=False
    ).exclude(
        daily_payouts_cross_arbitrage__date=today
    ).annotate(
        unlock_date=F('activation_date') + timedelta(days=1) * F('lock_days')
    ).filter(
        unlock_date__lte=today
    )

    payouts_to_create = []
    daily_rate = config.payout_rate

    # Используем .iterator() для экономии памяти при большом количестве аккаунтов
    for account in accounts_to_process.iterator():
        payout_amount = (account.balance * daily_rate).quantize(Decimal('0.000001'))

        if payout_amount <= Decimal('0.000000'):
            continue

        payouts_to_create.append(
            DailyPayout(
                account=account,
                date=today,
                amount=payout_amount,
                success=False
            )
        )

    if not payouts_to_create:
        return f"No new payouts to generate for {today}."

    # Массовое создание записей и отправка в Redis
    created_payouts = DailyPayout.objects.bulk_create(payouts_to_create)
    
    messages_to_publish = []
    for payout_obj in created_payouts:
        if not payout_obj.account.target_wallet or not payout_obj.account.target_wallet_network:
            print(f"[Cross Arbitrage Payout Task] ⚠️ Account {payout_obj.account.user.username} missing target info. Skipping Redis message.")
            continue

        message_data = {
            'type': 'daily_payout_cross_arbitrage',
            'payout_app': 'cross_arbitrage',
            'payout_id': payout_obj.id,
            'user_id': payout_obj.account.user.id,
            'account_id': payout_obj.account.id,
            'to_address': payout_obj.account.target_wallet,
            'amount': str(payout_obj.amount),
            'token': "USDT",
            'network': payout_obj.account.target_wallet_network
        }
        messages_to_publish.append(message_data)

    if messages_to_publish:
        try:
            redis_client = redis.Redis.from_url(settings.REDIS_URL_FOR_PUBSUB)
            for msg_data in messages_to_publish:
                redis_client.publish(REDIS_CHANNEL, json.dumps(msg_data))
        except Exception as e:
            print(f"Error publishing daily payouts to Redis: {e}")

    return f"Generated {len(created_payouts)} daily payouts for {today}."

@shared_task(name='publish_withdrawal_request_cross_arbitrage')
def publish_withdrawal_request(withdrawal_id):
    try:
        withdrawal_request = WithdrawalRequest.objects.get(id=withdrawal_id)
        account = withdrawal_request.account
        
        message_data = {
            'type': 'withdraw_cross_arbitrage',
            'payout_app': 'cross_arbitrage',
            'request_id': str(withdrawal_request.id),
            'user_id': account.user.id,
            'amount': str(withdrawal_request.amount),
            'target_wallet': withdrawal_request.target_wallet,
            'network': withdrawal_request.network
        }

        redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)
        # Канал должен соответствовать каналу стратегии
        redis_client.publish('payouts_cross_arbitrage', json.dumps(message_data))
        
        print(f"Published withdrawal request {withdrawal_id} to Redis.")
        return f"Published withdrawal request {withdrawal_id}"
    except WithdrawalRequest.DoesNotExist:
        print(f"ERROR: WithdrawalRequest with id {withdrawal_id} not found.")
        return f"WithdrawalRequest {withdrawal_id} not found."
    except Exception as e:
        print(f"CRITICAL: Failed to publish withdrawal request {withdrawal_id}. Error: {e}")
        # Здесь можно добавить логику повторной попытки
        raise
