from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
import uuid
from django.utils.translation import gettext_lazy as _

# Choices for networks - можно вынести в отдельный файл констант, если используется много где
NETWORK_CHOICES = [
    ('TRC20', _('TRC20 (Tron)')),
    ('BEP20', _('BEP20 (BNB Smart Chain)')),
    ('ARBITRUM', _('Arbitrum')),
    # Добавьте другие сети по мере необходимости
]

class InvestmentAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='investment_accounts_cross_arbitrage')
    network = models.CharField(max_length=50, choices=NETWORK_CHOICES, default='TRC20')
    balance = models.DecimalField(max_digits=20, decimal_places=6, default=Decimal('0.000000'))
    activated = models.BooleanField(default=False)
    target_wallet = models.CharField(max_length=128, blank=True, null=True)
    target_wallet_network = models.CharField(
        max_length=50, 
        choices=NETWORK_CHOICES, 
        blank=True, 
        null=True, 
        verbose_name=_("Target Wallet Network")
    )
    lock_days = models.IntegerField(default=30)
    activation_date = models.DateTimeField(blank=True, null=True)

    def is_locked(self):
        if not self.activation_date:
            return True # Not activated means it's effectively locked from payouts/withdrawals
        return (timezone.now() - self.activation_date).days < self.lock_days

    def __str__(self):
        return f"InvestmentAccount (Cross Arbitrage) {self.user.username} - {self.get_network_display()} — {self.balance} USDT"

    class Meta:
        unique_together = ('user', 'network')


class TemporaryWallet(models.Model):
    STATUS_PENDING_GENERATION = 'pending_generation'
    STATUS_PENDING_DEPOSIT = 'pending_deposit'
    STATUS_DEPOSIT_DETECTED = 'deposit_detected'
    STATUS_SWEEP_INITIATED = 'sweep_initiated'
    STATUS_SWEEP_SUCCESS = 'sweep_success'
    STATUS_SWEEP_FAILED = 'sweep_failed'
    STATUS_EXPIRED = 'expired'
    STATUS_ERROR = 'error'

    STATUS_CHOICES = [
        (STATUS_PENDING_GENERATION, 'Ожидает генерации'),
        (STATUS_PENDING_DEPOSIT, 'Ожидает депозита'),
        (STATUS_DEPOSIT_DETECTED, 'Депозит обнаружен'),
        (STATUS_SWEEP_INITIATED, 'Свип инициирован'),
        (STATUS_SWEEP_SUCCESS, 'Свип успешен'),
        (STATUS_SWEEP_FAILED, 'Ошибка свипа'),
        (STATUS_EXPIRED, 'Просрочен'),
        (STATUS_ERROR, 'Ошибка'),
    ]

    NETWORK_CHOICES = [
        ('TRC20', 'USDT - TRC20'),
        ('ARBITRUM', 'USDT - Arbitrum One'),
        ('BEP20', 'USDT - BNB Smart Chain (BEP20)'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='temp_wallets_cross_arbitrage'
    )
    address = models.CharField(max_length=128, unique=True, db_index=True)
    encrypted_private_key = models.TextField() # Было private_key_encrypted
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES, db_index=True)

    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING_GENERATION,
        db_index=True
    )
    
    deposit_tx_hash = models.CharField(max_length=256, blank=True, null=True)
    detected_amount = models.DecimalField(max_digits=20, decimal_places=6, null=True, blank=True)

    sweep_preparation_tx_hash = models.CharField(max_length=256, blank=True, null=True)
    sweep_tx_hash = models.CharField(max_length=256, blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(blank=True, null=True, db_index=True)

    def __str__(self):
        return f"TempWallet {self.address} ({self.network}) for {self.user.username} - Status: {self.get_status_display()}"

    class Meta:
        ordering = ['-created_at']
        # verbose_name = "Временный кошелек"
        # verbose_name_plural = "Временные кошельки"


class InvestmentDeposit(models.Model):
    account = models.ForeignKey(InvestmentAccount, on_delete=models.CASCADE, related_name='deposits_cross_arbitrage')
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    tx_hash = models.CharField(max_length=256, blank=True, null=True, unique=True) # TX hashes are usually longer and should be unique
    created_at = models.DateTimeField(auto_now_add=True)
    # Consider adding a status field (e.g., pending, confirmed, failed)

    def __str__(self):
        return f"Deposit of {self.amount} to {self.account.user.username} (Cross Arbitrage) - TX: {self.tx_hash[:10]}..."


class DailyPayout(models.Model):
    account = models.ForeignKey(InvestmentAccount, on_delete=models.CASCADE, related_name='daily_payouts_cross_arbitrage')
    date = models.DateField()
    amount = models.DecimalField(max_digits=20, decimal_places=6)
    tx_hash = models.CharField(max_length=256, blank=True, null=True) # TX hashes can be long
    success = models.BooleanField(default=False)
    # Consider adding a remarks/details field for payout status or errors

    class Meta:
        unique_together = ('account', 'date')
        ordering = ['-date'] # Show newest payouts first by default

    def __str__(self):
        status = "Success" if self.success else "Pending/Failed"
        return f"Daily Payout {self.date} for {self.account.user.username} (Cross Arbitrage) - {self.amount} USDT ({status})"


class InvestmentConfig(models.Model):
    strategy = models.CharField(
        max_length=64,
        unique=True,
        default='cross_arbitrage',
        help_text="Название стратегии (например, cross_arbitrage)"
    )
    payout_rate = models.DecimalField(
        max_digits=6,
        decimal_places=5,
        default=Decimal('0.0012'),
        help_text="Процент в день (например, 0.0012 = 0.12%)"
    )
    lock_days = models.IntegerField(
        default=30,
        help_text="Срок заморозки депозита (в днях)"
    )
    min_deposit = models.DecimalField(
        max_digits=20,
        decimal_places=6,
        default=Decimal('100.000000'),
        help_text="Минимальный депозит для активации"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Активна ли стратегия (если нет — выплаты не запускаются)"
    )
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.strategy}] {self.payout_rate} | {self.lock_days}д | min: {self.min_deposit}"


class WithdrawalRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'success' # Используем 'success' как в документации
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Success'), # Обновлено для консистентности
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    NETWORK_CHOICES = [ # Оставим это, полезно для будущего
        ('trc20', 'USDT - TRC20'),
        ('arbitrum', 'USDT - Arbitrum One'),
        ('bep20', 'USDT - BNB Smart Chain (BEP20)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    account = models.ForeignKey(
        InvestmentAccount,
        on_delete=models.CASCADE,
        related_name='withdrawal_requests'
    )
    amount = models.DecimalField(max_digits=18, decimal_places=6) # Сумма для вывода
    
    network = models.CharField(max_length=20, choices=NETWORK_CHOICES, blank=True, null=True)
    target_wallet = models.CharField(max_length=128, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    tx_hash = models.CharField(max_length=256, blank=True, null=True, unique=True, db_index=True, help_text="Хеш транзакции в блокчейне")
    
    error_message = models.TextField(blank=True, null=True, help_text="Сообщение об ошибке, если вывод не удался")

    requested_at = models.DateTimeField(auto_now_add=True, editable=False)
    processed_at = models.DateTimeField(blank=True, null=True, editable=False)

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Запрос на вывод"
        verbose_name_plural = "Запросы на вывод"

    def __str__(self):
        return f"Withdrawal Request {self.id} for {self.account.user.username} - {self.amount} - Status: {self.get_status_display()}"
