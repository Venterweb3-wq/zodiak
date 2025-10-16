# tasks.py 
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from decimal import Decimal

from .models import FlexibleInvestmentAccount, FlexiblePayout

# Эти значения лучше вынести в Django settings или в модель конфигурации
FLEXIBLE_DAILY_INTEREST_RATE = Decimal('0.01')  # 1% в день
PAYOUT_INTERVALS_PER_DAY = 24 * (60 // 10) # 144 интервалов по 10 минут в день
INTEREST_RATE_PER_INTERVAL = FLEXIBLE_DAILY_INTEREST_RATE / PAYOUT_INTERVALS_PER_DAY

@shared_task(name='generate_flexible_payouts')
def generate_flexible_payouts():
    print(f"Starting generate_flexible_payouts task at {timezone.now()}")
    
    # Выбираем только активные аккаунты с балансом > 0
    accounts = FlexibleInvestmentAccount.objects.filter(balance__gt=Decimal('0.00'))
    
    if not accounts.exists():
        print("No active FlexibleInvestmentAccounts with balance found to process.")
        return "No accounts with positive balance to process."

    accounts_to_update = []
    payouts_to_create = []
    now = timezone.now()

    for account in accounts:
        try:
            profit_amount = (account.balance * INTEREST_RATE_PER_INTERVAL).quantize(Decimal('1e-8'))

            if profit_amount > Decimal('0.00000000'):
                # Обновляем объект в памяти
                account.balance += profit_amount
                account.last_payout_time = now
                accounts_to_update.append(account)
                
                # Создаем объект выплаты в памяти
                payouts_to_create.append(
                    FlexiblePayout(account=account, amount=profit_amount, timestamp=now)
                )
        except Exception as e:
            print(f"Error calculating profit for account {account.id} (User: {account.user.username}): {e}")

    # Выполняем массовые операции после цикла
    try:
        with transaction.atomic():
            if payouts_to_create:
                FlexiblePayout.objects.bulk_create(payouts_to_create)
                print(f"Successfully created {len(payouts_to_create)} payout records.")

            if accounts_to_update:
                FlexibleInvestmentAccount.objects.bulk_update(accounts_to_update, ['balance', 'last_payout_time', 'updated_at'])
                print(f"Successfully updated {len(accounts_to_update)} account balances.")

    except Exception as e:
        # Важно логировать ошибки массовых операций
        print(f"!!! CRITICAL: Bulk operation failed: {e}")
        # Здесь можно добавить логику для повторной попытки или уведомления администратора
        return f"Task failed during bulk operations: {e}"

    processed_count = len(accounts_to_update)
    print(f"Finished generate_flexible_payouts task. Processed {processed_count} accounts.")
    return f"Task finished. Processed {processed_count} accounts." 