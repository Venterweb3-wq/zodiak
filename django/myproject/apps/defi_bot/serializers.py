from rest_framework import serializers
from .models import InvestmentAccount, InvestmentDeposit, DailyPayout, TemporaryWallet, InvestmentConfig, WithdrawalRequest, NETWORK_CHOICES
from decimal import Decimal
from django.utils import timezone # Needed for ActivateInvestmentSerializer and lock_time_remaining
from datetime import timedelta # Added for lock_time_remaining
from django.db import models # Added for models.Sum
import redis # Added for WithdrawDepositSerializer
import json  # Added for WithdrawDepositSerializer
from django.conf import settings
import re
from .tasks import publish_withdrawal_request

class InvestmentAccountSerializer(serializers.ModelSerializer):
    is_locked = serializers.SerializerMethodField()
    user_username = serializers.CharField(source='user.username', read_only=True)
    lock_time_remaining = serializers.SerializerMethodField()
    today_earned = serializers.SerializerMethodField()
    network_display = serializers.CharField(source='get_network_display', read_only=True)

    class Meta:
        model = InvestmentAccount
        fields = [
            'id',
            'user_username',
            'balance',
            'activated',
            'target_wallet',
            'target_wallet_network',
            'lock_days',
            'activation_date',
            'is_locked',
            'lock_time_remaining',
            'today_earned',
            'network',
            'network_display',
        ]
        read_only_fields = fields  # Защита от редактирования всего

    def get_is_locked(self, obj):
        return obj.is_locked()

    def get_lock_time_remaining(self, obj):
        from datetime import timedelta # Local import
        from django.utils import timezone # Local import (can also use the module-level one)

        if not obj.activated or not obj.activation_date:
            return obj.lock_days * 86400  # seconds

        lock_end = obj.activation_date + timedelta(days=obj.lock_days)
        remaining = lock_end - timezone.now()
        if remaining.total_seconds() <= 0:
            return 0
        return int(remaining.total_seconds())

    def get_today_earned(self, obj):
        from django.utils import timezone # Local import
        from django.db.models import Sum # Local import
        
        today = timezone.localdate()
        payout_sum = DailyPayout.objects.filter(
            account=obj,
            date=today,
            success=True
        ).aggregate(Sum('amount'))['amount__sum'] # Corrected alias to amount__sum
        return str(payout_sum or Decimal("0.000000"))


class InvestmentDepositSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M', read_only=True)
    amount = serializers.DecimalField(max_digits=18, decimal_places=8, coerce_to_string=True) # Явное указание для ясности

    class Meta:
        model = InvestmentDeposit
        fields = ['id', 'account', 'amount', 'tx_hash', 'status', 'created_at']
        read_only_fields = ['account'] # 'account' устанавливается в CreateDepositSerializer

    def get_status(self, obj):
        if obj.tx_hash and obj.tx_hash.startswith('0x'): # Добавим проверку на валидный хэш
            # Можно добавить более сложную логику, если есть другие признаки подтверждения
            return "✅ Успешно"
        # Если у вас есть отдельное поле в модели для статуса, лучше использовать его
        return "🕓 В ожидании"


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='account.user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    requested_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    processed_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)
    amount = serializers.DecimalField(max_digits=18, decimal_places=6, coerce_to_string=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id',
            'user_username',
            'account', 
            'amount',
            'network',
            'network_display',
            'target_wallet',
            'status',
            'status_display',
            'tx_hash',
            'requested_at',
            'processed_at',
            'error_message'
        ]
        read_only_fields = fields # Делаем все поля из fields read_only для этого сериализатора


class CreateDepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=20, decimal_places=6, min_value=Decimal('0.000001'))
    tx_hash = serializers.CharField(max_length=256)
    # Consider adding 'network' if deposits can come from different networks 
    # and you need to associate the tx_hash with a specific TemporaryWallet or network.

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Сумма депозита должна быть положительной.")
        return value

    def validate_tx_hash(self, value):
        if InvestmentDeposit.objects.filter(tx_hash=value).exists():
            raise serializers.ValidationError("Этот хеш транзакции уже зарегистрирован.")
        # Potentially, add validation for tx_hash format or check against a node if possible.
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        account, created = InvestmentAccount.objects.get_or_create(user=user)
        
        # Logic for handling deposits, e.g., associating with a TemporaryWallet if applicable
        # For now, just creating the deposit record and updating balance.

        deposit = InvestmentDeposit.objects.create(
            account=account,
            amount=validated_data['amount'],
            tx_hash=validated_data['tx_hash']
        )
        
        # Update balance
        account.balance += validated_data['amount']
        account.save(update_fields=['balance'])
        
        return deposit


class ActivateInvestmentSerializer(serializers.Serializer):
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)

    def validate(self, data):
        request = self.context['request']
        network = data.get('network')
        
        try:
            account = InvestmentAccount.objects.get(user=request.user, network=network)
        except InvestmentAccount.DoesNotExist:
            raise serializers.ValidationError("Инвестиционный счет для данной сети не найден.")

        if account.activated:
            raise serializers.ValidationError('Этот счет уже активирован.')

        # Fetch the active config for defi_bot
        config = InvestmentConfig.objects.filter(strategy='defi_bot', is_active=True).first()
        if not config:
            raise serializers.ValidationError("Инвестиционная стратегия в данный момент неактивна.")
            
        if account.balance < config.min_deposit:
            raise serializers.ValidationError(f"Для активации требуется минимальный депозит {config.min_deposit} USDT.")

        data['account'] = account
        data['config'] = config
        return data

    def save(self):
        account = self.validated_data['account']
        config = self.validated_data['config']
        
        account.activated = True
        account.activation_date = timezone.now()
        account.lock_days = config.lock_days
        account.save(update_fields=['activated', 'activation_date', 'lock_days'])
        return account


class DailyPayoutSerializer(serializers.ModelSerializer):
    account_user_username = serializers.CharField(source='account.user.username', read_only=True)
    class Meta:
        model = DailyPayout
        fields = ['id', 'account_user_username', 'date', 'amount', 'tx_hash', 'success'] # Add ID
        read_only_fields = ['id', 'account_user_username']


# Serializer for TemporaryWallet might be useful for admin or specific operations
class TemporaryWalletSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    created_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    updated_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    expires_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)

    class Meta:
        model = TemporaryWallet
        fields = [
            'id',
            'user_username',
            'address',
            'network',
            'network_display',
            'status',
            'status_display',
            'created_at',
            'updated_at',
            'expires_at',
        ]
        read_only_fields = fields

# Новый сериализатор для запроса временного кошелька
class RequestTemporaryWalletSerializer(serializers.Serializer):
    network = serializers.ChoiceField(choices=TemporaryWallet.NETWORK_CHOICES)

    def validate_network(self, value):
        return value

# Новый сериализатор для уведомления о депозите от Node.js
class NotifyDepositSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=128)
    tx_hash = serializers.CharField(max_length=256, allow_blank=True, required=False, allow_null=True)
    amount = serializers.DecimalField(max_digits=20, decimal_places=8)
    network = serializers.ChoiceField(choices=TemporaryWallet.NETWORK_CHOICES)

    def validate_address(self, value):
        if not value:
            raise serializers.ValidationError("Адрес не может быть пустым.")
        return value

    def validate(self, data):
        return data

# Новый сериализатор для уведомления о статусе свипа от Node.js
class NotifySweepStatusSerializer(serializers.Serializer):
    address = serializers.CharField(max_length=128)
    status = serializers.ChoiceField(choices=TemporaryWallet.STATUS_CHOICES)
    sweep_tx_hash = serializers.CharField(max_length=256, allow_blank=True, required=False, allow_null=True)
    sweep_preparation_tx_hash = serializers.CharField(max_length=256, allow_blank=True, required=False, allow_null=True)
    error_message = serializers.CharField(allow_blank=True, required=False, allow_null=True)
    detected_amount = serializers.DecimalField(max_digits=20, decimal_places=8, required=False, allow_null=True)

    def validate_status(self, value):
        valid_statuses_for_update = [
            TemporaryWallet.STATUS_SWEEP_PREP_PENDING,
            TemporaryWallet.STATUS_SWEEP_PREP_FAILED,
            TemporaryWallet.STATUS_SWEEP_PENDING,
            TemporaryWallet.STATUS_SWEEP_SUCCESS,
            TemporaryWallet.STATUS_SWEEP_FAILED,
        ]
        if value not in valid_statuses_for_update:
            raise serializers.ValidationError(f"Недопустимый статус '{value}' для обновления через этот эндпоинт.")
        return value

    def validate(self, data):
        return data

class PayoutUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyPayout
        fields = ['tx_hash', 'success']

class CreateWithdrawalRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=6)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        account = InvestmentAccount.objects.filter(user=user).first()

        if not account:
            raise serializers.ValidationError("Инвестиционный счёт не найден.")
        if not account.activated:
            raise serializers.ValidationError("Инвестиционный счёт не активирован.")
        if account.is_locked():
            raise serializers.ValidationError("Вывод невозможен, срок заморозки депозита еще не истёк.")
        
        requested_amount = attrs['amount']
        if account.balance < requested_amount:
            raise serializers.ValidationError(f"Недостаточно средств. Доступно для вывода: {account.balance} USDT.")

        attrs['account'] = account
        return attrs

    def create(self, validated_data):
        account = validated_data['account']
        user = account.user
        requested_amount = validated_data['amount']

        withdrawal_request = WithdrawalRequest.objects.create(
            account=account,
            amount=requested_amount,
            network=validated_data['network'],
            target_wallet=account.target_wallet,
            status='pending'
        )

        account.balance -= requested_amount
        account.save(update_fields=['balance'])

        REDIS_WITHDRAWAL_CHANNEL = 'withdrawals_defi_bot'

        msg = {
            "type": "withdrawal_request_defi_bot",
            "app_name": "defi_bot",
            "withdrawal_request_id": withdrawal_request.id,
            "user_id": user.id,
            "account_id": account.id,
            "amount": str(requested_amount),
            "to_address": account.target_wallet,
            "token": "USDT", 
            "network": validated_data['network']
        }

        try:
            redis_client = redis.Redis.from_url(settings.REDIS_URL_FOR_PUBSUB)
            redis_client.publish(REDIS_WITHDRAWAL_CHANNEL, json.dumps(msg).encode('utf-8'))
        except redis.exceptions.ConnectionError as e:
            account.balance += requested_amount
            account.save(update_fields=['balance'])
            withdrawal_request.delete()
            print(f"Redis connection error during withdrawal request creation: {e}") 
            raise serializers.ValidationError(
                "Не удалось отправить запрос на вывод. Пожалуйста, попробуйте позже."
            )
        return withdrawal_request

class WithdrawalRequestUpdateSerializer(serializers.ModelSerializer):
    tx_hash = serializers.CharField(max_length=256, required=False, allow_null=True, allow_blank=True)
    error_message = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = WithdrawalRequest
        fields = ['status', 'tx_hash', 'error_message']

class InvestmentConfigPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentConfig
        fields = ['strategy', 'payout_rate', 'lock_days', 'min_deposit', 'is_active']

class WithdrawDepositSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=6)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)

    def validate(self, attrs):
        request = self.context['request']
        amount = attrs.get('amount')
        network = attrs.get('network')

        try:
            account = InvestmentAccount.objects.get(user=request.user, network=network)
        except InvestmentAccount.DoesNotExist:
            raise serializers.ValidationError("Инвестиционный счет для данной сети не найден.")

        if account.is_locked():
            raise serializers.ValidationError("Вывод средств невозможен, так как счет заморожен.")

        if amount > account.balance:
            raise serializers.ValidationError("Недостаточно средств на балансе.")
            
        if not account.target_wallet or not account.target_wallet_network:
             raise serializers.ValidationError("Целевой кошелек для вывода не настроен в профиле.")

        attrs['account'] = account
        return attrs

    def save(self, **kwargs):
        account = self.validated_data['account']
        amount = self.validated_data['amount']
        
        withdrawal_request = WithdrawalRequest.objects.create(
            account=account,
            amount=amount,
            network=account.target_wallet_network,
            target_wallet=account.target_wallet,
            status=WithdrawalRequest.STATUS_PENDING
        )
        # Вызываем фоновую задачу для отправки в Redis
        publish_withdrawal_request.delay(str(withdrawal_request.id))
        return withdrawal_request

# Новый сериализатор для списка ожидающих кошельков (для Node.js)
class PendingTemporaryWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemporaryWallet
        fields = ['id', 'address', 'network']
