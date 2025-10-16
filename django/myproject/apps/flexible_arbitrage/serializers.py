# serializers.py 
from rest_framework import serializers
from .models import (
    FlexibleInvestmentAccount, 
    FlexiblePayout, 
    FlexibleDeposit, 
    FlexibleWithdrawal,
    FlexibleTemporaryWallet,
    NETWORK_CHOICES,
)
from django.conf import settings
from decimal import Decimal

# Значение по умолчанию для комиссии, если не переопределено в settings
FLEXIBLE_WITHDRAWAL_COMMISSION = getattr(settings, 'FLEXIBLE_ARBITRAGE_WITHDRAWAL_COMMISSION', Decimal('5.00'))

class RequestFlexibleTemporaryWalletSerializer(serializers.Serializer):
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)
    # amount = serializers.DecimalField(max_digits=18, decimal_places=8, min_value=Decimal('0.00000001'), required=False) # Если нужно передавать ожидаемую сумму

class FlexibleTemporaryWalletSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    class Meta:
        model = FlexibleTemporaryWallet
        fields = (
            'id', 
            'user',
            'network', 
            'network_display',
            'address', 
            'status', 
            'status_display',
            'detected_amount',
            'created_at', 
            'expires_at',
            'sweep_tx_id'
        )
        read_only_fields = ('id', 'user', 'address', 'status', 'status_display', 'network_display', 'detected_amount', 'created_at', 'expires_at', 'sweep_tx_id')

class NotifyFlexibleDepositSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=255)
    transaction_id = serializers.CharField(max_length=255) # TXID пополнения пользователем
    amount = serializers.DecimalField(max_digits=18, decimal_places=8)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES) # Сеть, на которой обнаружен депозит

    def validate_wallet_address(self, value):
        try:
            FlexibleTemporaryWallet.objects.get(address=value, status=FlexibleTemporaryWallet.TEMP_WALLET_STATUS_PENDING_DEPOSIT)
        except FlexibleTemporaryWallet.DoesNotExist:
            raise serializers.ValidationError("Temporary wallet not found or not awaiting deposit.")
        return value

class NotifyFlexibleSweepStatusSerializer(serializers.Serializer):
    wallet_address = serializers.CharField(max_length=255)
    sweep_tx_id = serializers.CharField(max_length=255, allow_blank=True, required=False)
    status = serializers.ChoiceField(choices=[
        FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_SUCCESS,
        FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_FAILED,
    ])
    error_message = serializers.CharField(required=False, allow_blank=True)
    network = serializers.ChoiceField(choices=NETWORK_CHOICES) # Сеть, на которой был свип
    amount_swept = serializers.DecimalField(max_digits=18, decimal_places=8, required=False) # Фактически отправленная сумма

    def validate_wallet_address(self, value):
        try:
            # Проверяем, что кошелек существует и находится в подходящем статусе для обновления о свипе
            FlexibleTemporaryWallet.objects.get(address=value, status__in=[
                FlexibleTemporaryWallet.TEMP_WALLET_STATUS_DEPOSIT_RECEIVED,
                FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_INITIATED
            ])
        except FlexibleTemporaryWallet.DoesNotExist:
            raise serializers.ValidationError("Temporary wallet not found or not in a valid state for sweep notification.")
        return value

    def validate(self, data):
        if data['status'] == FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_FAILED and not data.get('error_message'):
            raise serializers.ValidationError({"error_message": "Error message is required if sweep failed."})
        if data['status'] == FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_SUCCESS and not data.get('sweep_tx_id'):
            raise serializers.ValidationError({"sweep_tx_id": "Sweep transaction ID is required if sweep was successful."})
        if data['status'] == FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_SUCCESS and data.get('amount_swept') is None:
            raise serializers.ValidationError({"amount_swept": "Amount swept is required if sweep was successful."})
        return data

class PendingFlexibleTemporaryWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlexibleTemporaryWallet
        fields = ('id', 'address', 'network') # Только необходимая информация для воркера

class FlexibleInvestmentAccountStatsSerializer(serializers.ModelSerializer):
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    class Meta:
        model = FlexibleInvestmentAccount
        fields = ('network', 'network_display', 'balance', 'last_payout_time', 'updated_at')

class FlexibleDepositCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=18, decimal_places=8, min_value=Decimal('0.00000001'))
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)
    transaction_id = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)

    def validate_network(self, value):
        # Дополнительная валидация сети, если требуется
        return value

class FlexibleWithdrawalCreateSerializer(serializers.Serializer):
    amount_requested = serializers.DecimalField(max_digits=18, decimal_places=8, min_value=Decimal('0.00000001'))
    network = serializers.ChoiceField(choices=NETWORK_CHOICES)
    wallet_address = serializers.CharField(max_length=255)

    def validate_network(self, value):
        # Дополнительная валидация сети, если требуется
        return value
    
    def validate_wallet_address(self, value):
        # TODO: Добавить валидацию адреса кошелька в зависимости от сети
        if len(value) < 10: # Очень простая проверка, нужна реальная валидация
            raise serializers.ValidationError("Некорректный адрес кошелька.")
        return value

    def validate_amount_requested(self, value):
        # Проверка, что сумма вывода больше комиссии
        if value <= FLEXIBLE_WITHDRAWAL_COMMISSION:
            raise serializers.ValidationError(f"Сумма вывода должна быть больше комиссии ({FLEXIBLE_WITHDRAWAL_COMMISSION} USDT).")
        return value

class FlexibleDepositHistorySerializer(serializers.ModelSerializer):
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    class Meta:
        model = FlexibleDeposit
        fields = ('amount', 'network', 'network_display', 'user_transaction_id', 'timestamp')

class FlexibleWithdrawalHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    network_display = serializers.CharField(source='get_network_display', read_only=True)
    class Meta:
        model = FlexibleWithdrawal
        fields = (
            'amount_requested', 
            'commission', 
            'amount_received', 
            'network', 
            'network_display',
            'wallet_address',
            'status', 
            'status_display',
            'transaction_id',
            'timestamp',
            'processed_at',
            'notes'
        )

class FlexiblePayoutHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = FlexiblePayout
        fields = ('amount', 'timestamp') 