# models.py 
from django.db import models
from django.conf import settings
from decimal import Decimal
from django.utils import timezone

# Network choices - можно вынести в settings или отдельный модуль констант
NETWORK_TRC20 = 'TRC20'
NETWORK_BEP20 = 'BEP20'
NETWORK_ARBITRUM = 'Arbitrum' # Arbitrum One
NETWORK_CHOICES = [
    (NETWORK_TRC20, 'TRC20 (Tron)'),
    (NETWORK_BEP20, 'BEP20 (BNB Smart Chain)'),
    (NETWORK_ARBITRUM, 'Arbitrum One'),
]

# Статусы для FlexibleTemporaryWallet
# TEMP_WALLET_STATUS_PENDING_GENERATION = 'PENDING_GENERATION' # Ожидает генерации адреса от Node.js
# TEMP_WALLET_STATUS_PENDING_DEPOSIT = 'PENDING_DEPOSIT'    # Ожидает депозита пользователя
# TEMP_WALLET_STATUS_DEPOSIT_DETECTED = 'DEPOSIT_DETECTED' # Депозит обнаружен, ожидается свип
# TEMP_WALLET_STATUS_SWEEP_INITIATED = 'SWEEP_INITIATED'   # Свип инициирован
# TEMP_WALLET_STATUS_SWEEP_SUCCESS = 'SWEEP_SUCCESS'      # Средства успешно переведены на главный кошелек
# TEMP_WALLET_STATUS_SWEEP_FAILED = 'SWEEP_FAILED'        # Ошибка при свипе
# TEMP_WALLET_STATUS_EXPIRED = 'EXPIRED'                # Кошелек истек (если применимо)
# TEMP_WALLET_STATUS_ERROR = 'ERROR'                    # Общая ошибка

# TEMP_WALLET_STATUS_CHOICES = [
#     (TEMP_WALLET_STATUS_PENDING_GENERATION, 'Pending Generation'),
#     (TEMP_WALLET_STATUS_PENDING_DEPOSIT, 'Pending Deposit'),
#     (TEMP_WALLET_STATUS_DEPOSIT_DETECTED, 'Deposit Detected'),
#     (TEMP_WALLET_STATUS_SWEEP_INITIATED, 'Sweep Initiated'),
#     (TEMP_WALLET_STATUS_SWEEP_SUCCESS, 'Sweep Success'),
#     (TEMP_WALLET_STATUS_SWEEP_FAILED, 'Sweep Failed'),
#     (TEMP_WALLET_STATUS_EXPIRED, 'Expired'),
#     (TEMP_WALLET_STATUS_ERROR, 'Error'),
# ]

class FlexibleTemporaryWallet(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flexible_temp_wallets')
    network = models.CharField(max_length=50, choices=NETWORK_CHOICES)
    address = models.CharField(max_length=255, unique=True, null=True, blank=True, db_index=True) # Станет not null после генерации
    encrypted_private_key = models.TextField(null=True, blank=True) # Зашифрованный приватный ключ
    
    # Сумма, которую ожидали (может быть неактуально для flexible, если принимаем любую)
    # amount_expected = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    detected_amount = models.DecimalField(max_digits=18, decimal_places=8, null=True, blank=True)
    
    # status = models.CharField(max_length=30, choices=TEMP_WALLET_STATUS_CHOICES, default=TEMP_WALLET_STATUS_PENDING_GENERATION, db_index=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True) # Если временные кошельки имеют срок действия
    
    sweep_tx_id = models.CharField(max_length=255, blank=True, null=True, db_index=True) # ID транзакции свипа
    error_message = models.TextField(blank=True, null=True) # Сообщение об ошибке, если что-то пошло не так

    # Новые статусы согласно запросу
    TEMP_WALLET_STATUS_PENDING_GENERATION = "pending_generation"
    TEMP_WALLET_STATUS_PENDING_DEPOSIT = "pending_deposit"
    TEMP_WALLET_STATUS_DEPOSIT_RECEIVED = "deposit_received"
    TEMP_WALLET_STATUS_SWEEP_INITIATED = "sweep_initiated"
    TEMP_WALLET_STATUS_SWEEP_SUCCESS = "sweep_success"
    TEMP_WALLET_STATUS_SWEEP_FAILED = "sweep_failed"
    TEMP_WALLET_STATUS_ERROR = "error"

    TEMP_WALLET_STATUSES = [
        (TEMP_WALLET_STATUS_PENDING_GENERATION, "Ожидает генерации"),
        (TEMP_WALLET_STATUS_PENDING_DEPOSIT, "Ожидает депозита"),
        (TEMP_WALLET_STATUS_DEPOSIT_RECEIVED, "Депозит получен"),
        (TEMP_WALLET_STATUS_SWEEP_INITIATED, "Свип инициирован"),
        (TEMP_WALLET_STATUS_SWEEP_SUCCESS, "Свип успешен"),
        (TEMP_WALLET_STATUS_SWEEP_FAILED, "Свип неуспешен"),
        (TEMP_WALLET_STATUS_ERROR, "Ошибка обработки"),
    ]

    status = models.CharField(
        max_length=32, # Увеличим немного для новых длинных имен статусов
        choices=TEMP_WALLET_STATUSES,
        default=TEMP_WALLET_STATUS_PENDING_GENERATION, # Начальный статус при создании объекта во view
        db_index=True
    )

    class Meta:
        verbose_name = "Flexible Temporary Wallet"
        verbose_name_plural = "Flexible Temporary Wallets"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.get_network_display()} Temp Wallet ({self.address or 'N/A'}) - {self.status}"

class FlexibleInvestmentAccount(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='flexible_investment_accounts')
    network = models.CharField(max_length=50, choices=NETWORK_CHOICES)
    balance = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('0.0'))
    last_payout_time = models.DateTimeField(default=timezone.now) # Обновляется при каждом начислении
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'network')
        verbose_name = "Flexible Investment Account"
        verbose_name_plural = "Flexible Investment Accounts"
        ordering = ['user', 'network']

    def __str__(self):
        return f"{self.user.username} - {self.get_network_display()} Account: {self.balance}"

class FlexiblePayout(models.Model):
    account = models.ForeignKey(FlexibleInvestmentAccount, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=18, decimal_places=8) 
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Flexible Payout"
        verbose_name_plural = "Flexible Payouts"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Payout of {self.amount} to {self.account.user.username} ({self.account.get_network_display()}) at {self.timestamp}"

class FlexibleDeposit(models.Model):
    account = models.ForeignKey(FlexibleInvestmentAccount, on_delete=models.CASCADE, related_name='deposits')
    temporary_wallet = models.OneToOneField(FlexibleTemporaryWallet, on_delete=models.SET_NULL, null=True, blank=True, related_name='deposit_record')
    amount = models.DecimalField(max_digits=18, decimal_places=8)
    network = models.CharField(max_length=50, choices=NETWORK_CHOICES)
    # transaction_id теперь может быть ID депозита пользователя на временный кошелек, если нужно его хранить отдельно
    # или ID свипа, но ID свипа есть в FlexibleTemporaryWallet. 
    # Для ясности, это может быть transaction_id исходного пополнения пользователем.
    user_transaction_id = models.CharField(max_length=255, blank=True, null=True, db_index=True) 
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Flexible Deposit"
        verbose_name_plural = "Flexible Deposits"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Deposit of {self.amount} by {self.account.user.username} ({self.network}) at {self.timestamp}"

class FlexibleWithdrawal(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_FAILED = 'FAILED'
    STATUS_REJECTED = 'REJECTED'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    account = models.ForeignKey(FlexibleInvestmentAccount, on_delete=models.CASCADE, related_name='withdrawals')
    amount_requested = models.DecimalField(max_digits=18, decimal_places=8)
    commission = models.DecimalField(max_digits=18, decimal_places=8, default=Decimal('5.0'))
    amount_received = models.DecimalField(max_digits=18, decimal_places=8)
    
    network = models.CharField(max_length=50, choices=NETWORK_CHOICES)
    wallet_address = models.CharField(max_length=255)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    transaction_id = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Flexible Withdrawal"
        verbose_name_plural = "Flexible Withdrawals"
        ordering = ['-timestamp']

    def save(self, *args, **kwargs):
        if not self.pk or self.amount_requested or self.commission: 
            self.amount_received = self.amount_requested - self.commission
        if self.status in [self.STATUS_COMPLETED, self.STATUS_FAILED, self.STATUS_REJECTED] and not self.processed_at:
            self.processed_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Withdrawal of {self.amount_requested} by {self.account.user.username} ({self.network}) to {self.wallet_address} - Status: {self.status}" 