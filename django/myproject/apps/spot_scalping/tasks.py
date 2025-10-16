from celery import shared_task
from django.utils import timezone
from decimal import Decimal
from .models import InvestmentAccount, DailyPayout, InvestmentConfig, WithdrawalRequest
from datetime import date, timedelta
import redis
from django.conf import settings
import json
from django.db.models import F

REDIS_CHANNEL = 'payouts_spot_scalping'

@shared_task(name='generate_daily_payouts_spot_scalping')
def generate_daily_payouts():
    today = timezone.localdate()

    try:
        config = InvestmentConfig.objects.get(strategy='spot_scalping', is_active=True)
    except InvestmentConfig.DoesNotExist:
        return "[Spot Scalping Payout Task] ❌ Strategy 'spot_scalping' is disabled or not found."
    except InvestmentConfig.MultipleObjectsReturned:
        config = InvestmentConfig.objects.filter(strategy='spot_scalping', is_active=True).last()

    accounts_to_process = InvestmentAccount.objects.filter(
        activated=True,
        target_wallet__isnull=False
    ).exclude(
        daily_payouts_spot_scalping__date=today
    ).annotate(
        unlock_date=F('activation_date') + timedelta(days=1) * F('lock_days')
    ).filter(
        unlock_date__lte=today
    )

    payouts_to_create = []
    daily_rate = config.payout_rate

    for account in accounts_to_process.iterator():
        payout_amount = (account.balance * daily_rate).quantize(Decimal('0.000001'))
        if payout_amount <= Decimal('0.000000'):
            continue
        payouts_to_create.append(
            DailyPayout(account=account, date=today, amount=payout_amount, success=False)
        )

    if not payouts_to_create:
        return f"No new payouts for spot_scalping to generate for {today}."

    created_payouts = DailyPayout.objects.bulk_create(payouts_to_create)
    
    messages_to_publish = []
    for payout_obj in created_payouts:
        if not payout_obj.account.target_wallet or not payout_obj.account.target_wallet_network:
            print(f"[Spot Scalping Payout Task] ⚠️ Account {payout_obj.account.user.username} missing target info. Skipping Redis message.")
            continue
        message_data = {
            'type': 'daily_payout_spot_scalping',
            'payout_app': 'spot_scalping',
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
            print(f"Error publishing spot_scalping daily payouts to Redis: {e}")

    return f"Generated {len(created_payouts)} daily payouts for spot_scalping for {today}."

@shared_task(name='publish_withdrawal_request_spot_scalping')
def publish_withdrawal_request(withdrawal_id):
    try:
        withdrawal_request = WithdrawalRequest.objects.get(id=withdrawal_id)
        account = withdrawal_request.account
        
        message_data = {
            'type': 'withdraw_spot_scalping',
            'payout_app': 'spot_scalping',
            'request_id': str(withdrawal_request.id),
            'user_id': account.user.id,
            'amount': str(withdrawal_request.amount),
            'target_wallet': withdrawal_request.target_wallet,
            'network': withdrawal_request.network
        }

        redis_client = redis.Redis.from_url(settings.CELERY_BROKER_URL)
        redis_client.publish(REDIS_CHANNEL, json.dumps(message_data))
        
        return f"Published withdrawal request {withdrawal_id} for spot_scalping"
    except WithdrawalRequest.DoesNotExist:
        return f"WithdrawalRequest {withdrawal_id} not found."
    except Exception as e:
        raise
