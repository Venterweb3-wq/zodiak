from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from myproject.apps.core.permissions import IsNodeWorker
from rest_framework import status
from rest_framework.generics import UpdateAPIView, ListAPIView
import os
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import InvestmentAccount, InvestmentDeposit, DailyPayout, InvestmentConfig, TemporaryWallet, WithdrawalRequest
from .serializers import (
    InvestmentAccountSerializer,
    CreateDepositSerializer,
    ActivateInvestmentSerializer,
    DailyPayoutSerializer,
    InvestmentDepositSerializer,
    PayoutUpdateSerializer,
    CreateWithdrawalRequestSerializer,
    WithdrawDepositSerializer,
    WithdrawalRequestSerializer,
    InvestmentConfigPublicSerializer,
    TemporaryWalletSerializer,
    WithdrawalRequestUpdateSerializer,
    RequestTemporaryWalletSerializer,
    NotifyDepositSerializer,
    NotifySweepStatusSerializer,
    PendingTemporaryWalletSerializer
)
from django.shortcuts import get_object_or_404
from datetime import timedelta
import requests
from django.conf import settings
from decimal import Decimal
import json

class InvestmentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Получаем все счета для данного пользователя, или создаем для сетей по умолчанию, если их нет
        accounts = InvestmentAccount.objects.filter(user=request.user)
        if not accounts.exists():
            # Если у пользователя вообще нет счетов, можно создать для него счет по умолчанию
            # или просто вернуть пустой список, в зависимости от бизнес-логики.
            # Пока вернем пустой список.
            return Response([], status=status.HTTP_200_OK)
            
        serializer = InvestmentAccountSerializer(accounts, many=True)
        return Response(serializer.data)


class CreateDepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateDepositSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            deposit = serializer.save()
            return Response(InvestmentDepositSerializer(deposit).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivateInvestmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ActivateInvestmentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            account = serializer.save()
            return Response({"message": "Счёт активирован", "activation_date": account.activation_date})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PayoutHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        account = InvestmentAccount.objects.filter(user=request.user).first()
        if not account:
            # It might be better to return an empty list or a specific message 
            # if the account exists but has no payouts, 
            # but for a non-existent account, 404 is appropriate.
            # If get_or_create was used, account would always exist.
            # Consider if InvestmentAccount should always exist for an authenticated user.
            return Response({"message": "Инвестиционный счёт не найден."}, status=status.HTTP_404_NOT_FOUND)
        payouts = DailyPayout.objects.filter(account=account).order_by('-date')[:30]
        serializer = DailyPayoutSerializer(payouts, many=True)
        return Response(serializer.data)

class PayoutUpdateView(UpdateAPIView):
    queryset = DailyPayout.objects.all()
    serializer_class = PayoutUpdateSerializer
    permission_classes = [IsAuthenticated, IsNodeWorker]
    lookup_field = 'pk'

    # Optionally, override methods like perform_update for additional logic
    # def perform_update(self, serializer):
    #     instance = serializer.save()
    #     # Add any post-update logic here, e.g., sending a notification
    #     print(f"Payout {instance.id} updated by Node Worker. Success: {instance.success}, TX: {instance.tx_hash}")

class WithdrawDepositView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WithdrawDepositSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            withdrawal_request_instance = serializer.save()
            
            response_serializer = WithdrawalRequestSerializer(withdrawal_request_instance)
            return Response({
                "message": "Запрос на вывод средств отправлен в обработку.",
                "withdrawal_request": response_serializer.data 
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InvestmentConfigView(APIView):
    def get(self, request):
        config = InvestmentConfig.objects.filter(strategy='cross_arbitrage', is_active=True).last()
        if not config:
            return Response({"error": "Конфигурация стратегии недоступна"}, status=status.HTTP_404_NOT_FOUND)
        serializer = InvestmentConfigPublicSerializer(config)
        return Response(serializer.data)

class InvestmentDepositHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InvestmentDepositSerializer

    def get(self, request):
        try:
            account = InvestmentAccount.objects.get(user=request.user)
            deposits = InvestmentDeposit.objects.filter(account=account).order_by('-created_at')
            serializer = self.serializer_class(deposits, many=True)
            return Response(serializer.data)
        except InvestmentAccount.DoesNotExist:
            return Response({"error": "Investment account not found."}, status=status.HTTP_404_NOT_FOUND)

class SuccessfulDailyPayoutHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DailyPayoutSerializer

    def get(self, request):
        try:
            account = InvestmentAccount.objects.get(user=request.user)
            # Фильтруем по success=True для "успешных выводов" (ежедневных начислений)
            payouts = DailyPayout.objects.filter(account=account, success=True).order_by('-date')
            serializer = self.serializer_class(payouts, many=True)
            return Response(serializer.data)
        except InvestmentAccount.DoesNotExist:
            return Response({"error": "Investment account not found for payouts."}, status=status.HTTP_404_NOT_FOUND)

class WithdrawalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        account = InvestmentAccount.objects.filter(user=request.user).first()
        if not account:
            return Response({"error": "Инвестиционный счёт не найден."}, status=status.HTTP_404_NOT_FOUND)
        
        withdrawal_requests = WithdrawalRequest.objects.filter(account=account).order_by('-requested_at')
        
        serializer = WithdrawalRequestSerializer(withdrawal_requests, many=True)
        return Response(serializer.data)

class WithdrawalRequestUpdateView(UpdateAPIView):
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestUpdateSerializer
    permission_classes = [IsNodeWorker]
    lookup_field = 'pk'

    def perform_update(self, serializer):
        instance = serializer.save()

        final_status_reached = False

        if instance.status == WithdrawalRequest.STATUS_COMPLETED:
            account = instance.account
            if account.balance >= instance.amount:
                account.balance -= instance.amount
            else:
                print(f"ERROR: WithdrawalRequest {instance.id} successful, but account balance {account.balance} < withdrawal amount {instance.amount}.")
                instance.status = WithdrawalRequest.STATUS_FAILED
                instance.error_message = (
                    instance.error_message + 
                    " Ошибка: Баланс счета меньше суммы вывода после подтверждения транзакции."
                ).strip()
            
            account.save(update_fields=['balance'])
            final_status_reached = True

        elif instance.status == WithdrawalRequest.STATUS_FAILED:
            final_status_reached = True
        
        elif instance.status == WithdrawalRequest.STATUS_PROCESSING:
            pass

        if final_status_reached:
            instance.processed_at = timezone.now()
        
        fields_to_update = ['status', 'error_message', 'processed_at']
        if instance.tx_hash and 'tx_hash' not in fields_to_update:
             pass

        instance.save(update_fields=fields_to_update)

# <<< НАЧАЛО: Представления для TemporaryWallets >>>

class RequestTemporaryWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RequestTemporaryWalletSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        network = serializer.validated_data['network']
        user = request.user

        NODEJS_WALLET_API_URL = getattr(settings, 'NODEJS_WALLET_API_URL', None)
        NODEJS_INTERNAL_API_TOKEN = getattr(settings, 'NODEJS_INTERNAL_API_TOKEN', None)

        if not NODEJS_WALLET_API_URL or not NODEJS_INTERNAL_API_TOKEN:
            print("CRITICAL: NODEJS_WALLET_API_URL or NODEJS_INTERNAL_API_TOKEN не настроены в Django settings.")
            return Response({"error": "Сервис генерации кошельков временно недоступен (ошибка конфигурации сервера)."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        api_endpoint = f"{NODEJS_WALLET_API_URL.rstrip('/')}/generate_wallet"

        try:
            api_response = requests.post(
                api_endpoint,
                json={"network": network},
                headers={
                    "Authorization": f"Bearer {NODEJS_INTERNAL_API_TOKEN}",
                    "Content-Type": "application/json"
                },
                timeout=10 # seconds
            )
            api_response.raise_for_status() # Вызовет HTTPError для 4xx/5xx ответов
            wallet_data = api_response.json()

            generated_address = wallet_data.get('address')
            encrypted_pk = wallet_data.get('encryptedPrivateKey')
            response_network = wallet_data.get('network')

            if not all([generated_address, encrypted_pk, response_network]):
                print(f"ERROR: Неполный ответ от Node.js API: {wallet_data}")
                return Response({"error": "Получен неполный или некорректный ответ от сервиса генерации кошельков."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if response_network != network:
                print(f"ERROR: Node.js API вернул кошелек для сети {response_network}, а запрашивали {network}.")
                return Response({"error": "Сервис генерации кошельков вернул неверную сеть."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except requests.exceptions.Timeout:
            print(f"ERROR: Таймаут при обращении к Node.js API {api_endpoint}")
            return Response({"error": "Сервис генерации кошельков не отвечает (таймаут)."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.exceptions.ConnectionError:
            print(f"ERROR: Ошибка соединения с Node.js API {api_endpoint}")
            return Response({"error": "Ошибка соединения с сервисом генерации кошельков."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.exceptions.HTTPError as http_err:
            error_message = "Ошибка от сервиса генерации кошельков."
            try:
                # Пытаемся извлечь сообщение об ошибке из ответа Node.js
                error_details = http_err.response.json()
                error_message = error_details.get("error", error_message)
            except json.JSONDecodeError:
                pass # Используем сообщение по умолчанию
            print(f"ERROR: HTTP ошибка от Node.js API {api_endpoint}: {http_err.response.status_code} - {error_message}")
            return Response({"error": error_message},
                            status=http_err.response.status_code if http_err.response.status_code >= 400 else status.HTTP_500_INTERNAL_SERVER_ERROR)
        except json.JSONDecodeError:
            print(f"ERROR: Некорректный JSON ответ от Node.js API {api_endpoint}")
            return Response({"error": "Получен некорректный JSON ответ от сервиса генерации кошельков."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e: # Отлов всех остальных непредвиденных ошибок
            print(f"CRITICAL: Непредвиденная ошибка при вызове Node.js API: {e}")
            return Response({"error": "Внутренняя ошибка сервера при генерации кошелька."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            temp_wallet = TemporaryWallet.objects.create(
                user=user,
                address=generated_address,
                encrypted_private_key=encrypted_pk,
                network=network, # Используем network из запроса, т.к. мы проверили его совпадение с ответом
                status=TemporaryWallet.STATUS_PENDING_DEPOSIT
            )
        except Exception as e: # Например, IntegrityError если адрес не уникален
            print(f"ERROR: Не удалось сохранить TemporaryWallet в БД: {e}. Адрес: {generated_address}, Сеть: {network}")
            # Это может произойти, если Node.js сгенерировал уже существующий адрес, что маловероятно при UUID, но возможно
            # Или если в нашей логике что-то пошло не так
            return Response({"error": f"Не удалось сохранить временный кошелек: {e}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_serializer = TemporaryWalletSerializer(temp_wallet)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class NotifyDepositView(APIView):
    permission_classes = [IsNodeWorker]

    def post(self, request):
        serializer = NotifyDepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            temp_wallet = TemporaryWallet.objects.get(address=data['address'], network=data['network'])
        except TemporaryWallet.DoesNotExist:
            return Response(
                {"error": f"Временный кошелек {data['address']} для сети {data['network']} не найден."},
                status=status.HTTP_404_NOT_FOUND
            )

        if temp_wallet.status != TemporaryWallet.STATUS_PENDING_DEPOSIT:
            return Response(
                {"warning": f"Кошелек {temp_wallet.address} не ожидает депозит (текущий статус: {temp_wallet.status}). Уведомление проигнорировано."},
                status=status.HTTP_409_CONFLICT
            )

        investment_account, _ = InvestmentAccount.objects.get_or_create(user=temp_wallet.user)

        if data.get('tx_hash') and InvestmentDeposit.objects.filter(tx_hash=data['tx_hash'], account=investment_account).exists():
            return Response(
                {"warning": f"Депозит с tx_hash {data['tx_hash']} уже зарегистрирован."},
                status=status.HTTP_409_CONFLICT
            )

        InvestmentDeposit.objects.create(
            account=investment_account,
            amount=data['amount'],
            tx_hash=data.get('tx_hash')
        )

        temp_wallet.status = TemporaryWallet.STATUS_DEPOSIT_DETECTED
        temp_wallet.detected_amount = data['amount']
        temp_wallet.deposit_tx_hash = data.get('tx_hash')
        temp_wallet.save(update_fields=['status', 'detected_amount', 'deposit_tx_hash', 'updated_at'])

        return Response({"message": f"Депозит для кошелька {temp_wallet.address} зарегистрирован."},
                        status=status.HTTP_200_OK)


class NotifySweepStatusView(APIView):
    permission_classes = [IsNodeWorker]

    def post(self, request):
        serializer = NotifySweepStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            temp_wallet = TemporaryWallet.objects.get(address=data['address'])
        except TemporaryWallet.DoesNotExist:
            return Response(
                {"error": f"Временный кошелек {data['address']} не найден."},
                status=status.HTTP_404_NOT_FOUND
            )

        temp_wallet.status = data['status']
        temp_wallet.sweep_tx_hash = data.get('sweep_tx_hash')
        temp_wallet.sweep_preparation_tx_hash = data.get('sweep_preparation_tx_hash')
        temp_wallet.error_message = data.get('error_message')
        
        fields_to_update = ['status', 'sweep_tx_hash', 'sweep_preparation_tx_hash', 'error_message', 'updated_at']

        if data['status'] == TemporaryWallet.STATUS_SWEEP_SUCCESS:
            amount_to_credit = data.get('detected_amount') or temp_wallet.detected_amount

            if amount_to_credit and amount_to_credit > 0:
                investment_account, _ = InvestmentAccount.objects.get_or_create(
                    user=temp_wallet.user, 
                    network=temp_wallet.network
                )
                investment_account.balance += amount_to_credit
                investment_account.save(update_fields=['balance'])
                print(f"Credited {amount_to_credit} to {investment_account.user.username} ({investment_account.network}) from sweep of {temp_wallet.address}")
            else:
                print(f"WARNING: Sweep for {temp_wallet.address} successful, but no amount to credit ({amount_to_credit}).")
                if not temp_wallet.error_message:
                    temp_wallet.error_message = (temp_wallet.error_message or "") + " Sweep successful, but no amount credited."

        temp_wallet.save(update_fields=fields_to_update)
        return Response({"message": f"Статус свипа для кошелька {temp_wallet.address} обновлен на {temp_wallet.status}."},
                        status=status.HTTP_200_OK)

class UserTemporaryWalletsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        recent_threshold = timezone.now() - timedelta(days=7)

        wallets = TemporaryWallet.objects.filter(
            Q(user=request.user),
            Q(status__in=[
                TemporaryWallet.STATUS_PENDING_DEPOSIT,
                TemporaryWallet.STATUS_DEPOSIT_DETECTED,
                TemporaryWallet.STATUS_SWEEP_PREP_PENDING,
                TemporaryWallet.STATUS_SWEEP_PENDING
            ]) | 
            Q(updated_at__gte=recent_threshold)
        ).order_by('-created_at')[:20]

        serializer = TemporaryWalletSerializer(wallets, many=True)
        return Response(serializer.data)

# <<< КОНЕЦ: Представления для TemporaryWallets >>>

# <<< НАЧАЛО: Новые представления для Node.js мониторинг сервиса >>>

class PendingDepositWalletsListView(ListAPIView):
    permission_classes = [IsNodeWorker]
    serializer_class = PendingTemporaryWalletSerializer

    def get_queryset(self):
        return TemporaryWallet.objects.filter(status=TemporaryWallet.STATUS_PENDING_DEPOSIT).order_by('created_at')[:100]

class TemporaryWalletEncryptedKeyView(APIView):
    permission_classes = [IsNodeWorker]

    def get(self, request, wallet_id):
        temp_wallet = get_object_or_404(TemporaryWallet, id=wallet_id)
        
        # Опциональная проверка статуса, если нужно ограничить доступ к ключу
        valid_statuses_for_key_request = [
            TemporaryWallet.STATUS_DEPOSIT_DETECTED,
            TemporaryWallet.STATUS_SWEEP_PREP_FAILED, # Если нужна повторная попытка после ошибки подготовки
            # TemporaryWallet.STATUS_SWEEP_PENDING, # Если свип был начат, но не завершен (возможно, для другого механизма)
        ]
        if temp_wallet.status not in valid_statuses_for_key_request:
            return Response({"error": f"Запрос ключа для кошелька {wallet_id} в статусе '{temp_wallet.get_status_display()}' не разрешен."},
                            status=status.HTTP_403_FORBIDDEN)
                            
        return Response({"encrypted_private_key": temp_wallet.encrypted_private_key})

class PayoutStatusView(APIView):
    permission_classes = [IsNodeWorker]

    def get(self, request, pk):
        payout = get_object_or_404(DailyPayout, pk=pk)
        return Response({'success': payout.success})

class WithdrawalRequestStatusView(APIView):
    permission_classes = [IsNodeWorker]

    def get(self, request, pk):
        withdrawal_request = get_object_or_404(WithdrawalRequest, pk=pk)
        return Response({'status': withdrawal_request.status})

# <<< КОНЕЦ: Новые представления для Node.js мониторинг сервиса >>>
