import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from faker import Faker
from faker_crypto import CryptoAddress
from decimal import Decimal

# Импорт моделей из вашего приложения core
from myproject.apps.core.models import (
    User, LoginHistory, ActivityLog, TrustedDevice, 
    OneTimeCode, EmailVerification
)
# Импорт моделей из вашего приложения cross_arbitrage
from myproject.apps.cross_arbitrage.models import (
    InvestmentAccount, InvestmentDeposit, DailyPayout, 
    TemporaryWallet, InvestmentConfig, WithdrawalRequest, NETWORK_CHOICES
)

DEFAULT_PASSWORD = "password123"
NUM_USERS = 5

class Command(BaseCommand):
    help = 'Populates the database with test data'

    def handle(self, *args, **options):
        fake = Faker()
        fake.add_provider(CryptoAddress)
        self.stdout.write(self.style.SUCCESS('Starting to populate the database...'))

        # 1. Создание InvestmentConfig (если еще не существует)
        investment_config, created = InvestmentConfig.objects.get_or_create(
            strategy='cross_arbitrage_default',
            defaults={
                'payout_rate': Decimal('0.0015'), # 0.15% daily
                'lock_days': 30,
                'min_deposit': Decimal('50.00'),
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created default InvestmentConfig: {investment_config.strategy}'))
        else:
            self.stdout.write(self.style.NOTICE(f'InvestmentConfig {investment_config.strategy} already exists.'))

        users = []
        for i in range(NUM_USERS):
            # 2. Создание Пользователей (User)
            username = fake.user_name() + str(i) # добавляем i для уникальности
            while User.objects.filter(username=username).exists():
                username = fake.user_name() + str(random.randint(100,999))
            
            email = fake.email()
            while User.objects.filter(email=email).exists():
                email = fake.email()

            user = User.objects.create(
                username=username,
                email=email,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                password=make_password(DEFAULT_PASSWORD),
                is_staff=random.choice([True, False]),
                is_superuser=False, # Не создаем суперпользователей пачками
                is_active=random.choice([True, True, False]), # Больше активных
                email_verified=random.choice([True, True, False]),
                marketing_optin=random.choice([True, False]),
                language=random.choice(['en', 'ru', 'es']),
                theme=random.choice(['light', 'dark']),
                last_login_ip=fake.ipv4(),
                functionality_limited_until=None # Можно добавить логику для этого
            )
            users.append(user)
            self.stdout.write(self.style.SUCCESS(f'Created User: {user.username}'))

            if not user.email_verified:
                EmailVerification.objects.create(user=user)
                self.stdout.write(f'  - Created EmailVerification for {user.username}')

            # 3. Создание Истории Входов (LoginHistory)
            for _ in range(random.randint(1, 5)):
                LoginHistory.objects.create(
                    user=user,
                    ip_address=fake.ipv4(),
                    user_agent=fake.user_agent(),
                    # timestamp создается автоматически (auto_now_add)
                )
            self.stdout.write(f'  - Created LoginHistory for {user.username}')
            
            # 4. Создание Лога Активности (ActivityLog)
            activity_types = [choice[0] for choice in ActivityLog.ACTION_TYPES]
            for _ in range(random.randint(2, 7)):
                ActivityLog.objects.create(
                    user=user,
                    action_type=random.choice(activity_types),
                    details={"info": fake.sentence()},
                    ip_address=fake.ipv4()
                )
            self.stdout.write(f'  - Created ActivityLog for {user.username}')

            # 5. Создание Доверенных Устройств (TrustedDevice) - для некоторых пользователей
            if random.choice([True, False, False]): # Примерно для трети пользователей
                TrustedDevice.objects.create(
                    user=user,
                    user_agent=fake.user_agent(),
                    ip_address=fake.ipv4(),
                    # device_token_hash и token_salt будут установлены при реальном использовании
                    last_login_at=timezone.now() - timedelta(days=random.randint(1, 30))
                )
                self.stdout.write(f'  - Created TrustedDevice for {user.username}')
            
            # 6. Создание Одноразовых Кодов (OneTimeCode) - для некоторых
            if random.choice([True, False, False, False]): # Реже
                OneTimeCode.objects.create(
                    user=user,
                    code=fake.lexify(text='??????').upper() + fake.numerify(text='##'),
                    expires_at=timezone.now() + timedelta(minutes=10),
                    purpose=random.choice(['2fa_reset', 'device_verification', 'password_reset'])
                )
                self.stdout.write(f'  - Created OneTimeCode for {user.username}')

            # --- Данные для cross_arbitrage ---
            
            # 7. Создание Инвестиционного Счета (InvestmentAccount)
            inv_account = InvestmentAccount.objects.create(
                user=user,
                balance=Decimal(0),
                activated=random.choice([True, True, False]),
                target_wallet=fake.ethereum_address() if random.choice([True,False]) else None,
                target_wallet_network=random.choice([choice[0] for choice in NETWORK_CHOICES]) if random.choice([True,False]) else None,
                lock_days=investment_config.lock_days
            )
            if inv_account.activated:
                inv_account.activation_date = timezone.now() - timedelta(days=random.randint(0, inv_account.lock_days // 2))
                inv_account.save()
            self.stdout.write(f'  - Created InvestmentAccount for {user.username} (Active: {inv_account.activated})')

            # 8. Создание Депозитов (InvestmentDeposit)
            if inv_account.activated:
                num_deposits = random.randint(1, 3)
                current_balance = Decimal(0)
                for _ in range(num_deposits):
                    amount = Decimal(random.uniform(float(investment_config.min_deposit), 5000.00)).quantize(Decimal('0.000001'))
                    InvestmentDeposit.objects.create(
                        account=inv_account,
                        amount=amount,
                        tx_hash=fake.sha256()
                    )
                    current_balance += amount
                inv_account.balance = current_balance # Обновляем баланс счета
                inv_account.save()
                self.stdout.write(f'    - Created {num_deposits} InvestmentDeposits for {user.username}, new balance: {inv_account.balance}')

            # 9. Создание Ежедневных Выплат (DailyPayout)
            if inv_account.activated and inv_account.balance > 0 and inv_account.activation_date:
                days_since_activation = (timezone.now() - inv_account.activation_date).days
                num_payouts = random.randint(1, min(days_since_activation, 15)) # Максимум 15 выплат для примера
                payout_balance = inv_account.balance # Используем текущий баланс для расчета выплат
                for i in range(num_payouts):
                    payout_date = inv_account.activation_date.date() + timedelta(days=i + 1)
                    if payout_date >= timezone.now().date():
                        break 
                    
                    # Простая логика расчета выплаты, можно усложнить
                    payout_amount = (payout_balance * investment_config.payout_rate).quantize(Decimal('0.000001'))
                    if payout_amount <= 0: continue

                    DailyPayout.objects.create(
                        account=inv_account,
                        date=payout_date,
                        amount=payout_amount,
                        success=True, # Предполагаем успех
                        tx_hash=fake.sha256()
                    )
                    payout_balance -= payout_amount # Уменьшаем баланс для следующих расчетов выплат (упрощенно)
                self.stdout.write(f'    - Created {num_payouts} DailyPayouts for {user.username}')

            # 10. Создание Временных Кошельков (TemporaryWallet)
            temp_wallet_status_choices = [choice[0] for choice in TemporaryWallet.STATUS_CHOICES]
            temp_wallet_network_choices = [choice[0] for choice in TemporaryWallet.NETWORK_CHOICES]
            TemporaryWallet.objects.create(
                user=user,
                address=fake.ethereum_address(),
                encrypted_private_key=fake.sha256(), # Просто хеш для примера
                network=random.choice(temp_wallet_network_choices),
                status=random.choice(temp_wallet_status_choices),
                expires_at=timezone.now() + timedelta(hours=random.randint(1, 24)) if random.choice([True, False]) else None,
                detected_amount=Decimal(random.uniform(10,1000)).quantize(Decimal('0.01')) if random.choice([True, False]) else None
            )
            self.stdout.write(f'  - Created TemporaryWallet for {user.username}')

            # 11. Создание Запросов на Вывод (WithdrawalRequest) - если есть что выводить
            if inv_account.activated and inv_account.balance > Decimal('10.00'):
                if random.choice([True, False, False]): # Не для всех
                    withdrawal_amount = (inv_account.balance * Decimal(random.uniform(0.1, 0.5))).quantize(Decimal('0.000001'))
                    if withdrawal_amount > Decimal('5.00'): # Минимальная сумма вывода
                        WithdrawalRequest.objects.create(
                            account=inv_account,
                            amount=withdrawal_amount,
                            network=inv_account.target_wallet_network or random.choice([c[0] for c in NETWORK_CHOICES]),
                            target_wallet=inv_account.target_wallet or fake.ethereum_address(),
                            status=random.choice([WithdrawalRequest.STATUS_PENDING, WithdrawalRequest.STATUS_PROCESSING, WithdrawalRequest.STATUS_COMPLETED])
                            # tx_hash and error_message - опционально
                        )
                        # Упрощенно, не вычитаем из баланса inv_account здесь, это для примера лога
                        self.stdout.write(f'    - Created WithdrawalRequest for {user.username} of {withdrawal_amount}')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully populated database with {NUM_USERS} users and related data.'))
        self.stdout.write(self.style.WARNING(f'All created users have the default password: "{DEFAULT_PASSWORD}"')) 