# views.py 
from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from myproject.apps.core.permissions import IsNodeWorker # Импортируем из core
from django.db import transaction
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.utils import timezone
import requests

from .models import (
    FlexibleInvestmentAccount,
    FlexibleDeposit,
    FlexibleWithdrawal,
    FlexiblePayout,
    FlexibleTemporaryWallet
)
from .serializers import (
    FlexibleInvestmentAccountStatsSerializer,
    FlexibleWithdrawalCreateSerializer,
    FlexibleDepositHistorySerializer,
    FlexibleWithdrawalHistorySerializer,
    FlexiblePayoutHistorySerializer,
    RequestFlexibleTemporaryWalletSerializer,
    FlexibleTemporaryWalletSerializer,
    NotifyFlexibleDepositSerializer,
    NotifyFlexibleSweepStatusSerializer,
    PendingFlexibleTemporaryWalletSerializer
)

# Значение по умолчанию для комиссии, если не переопределено в settings
# Это дублирование из serializers.py, в идеале вынести в settings или models.py
from django.conf import settings
FLEXIBLE_WITHDRAWAL_COMMISSION = getattr(settings, 'FLEXIBLE_ARBITRAGE_WITHDRAWAL_COMMISSION', Decimal('5.00'))
# NODE_WORKER_AUTH_TOKEN = getattr(settings, 'NODE_WORKER_AUTH_TOKEN', 'your-secure-token-for-nodejs') # For IsNodeWorker

class RequestFlexibleTemporaryWalletView(generics.GenericAPIView):
    """
    Renamed from FlexibleDepositView. 
    User requests a temporary wallet for depositing funds.
    This view should call Node.js to generate the wallet.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = RequestFlexibleTemporaryWalletSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        network = serializer.validated_data['network']
        user = request.user

        # 1. Создаем запись FlexibleTemporaryWallet со статусом PENDING_GENERATION
        # Лучше создать ее после успешного ответа от Node.js или обновить существующую, если она уже создана ранее с ошибкой
        # Пока оставим так, но можно перенести создание/обновление после вызова Node.js
        temp_wallet = FlexibleTemporaryWallet.objects.create(
            user=user,
            network=network,
            status=FlexibleTemporaryWallet.TEMP_WALLET_STATUS_PENDING_GENERATION
        )

        # 2. Вызвать Node.js API (/generate_wallet) для генерации адреса и ключа
        node_api_host = getattr(settings, 'NODE_WALLET_API_HOST', None)
        node_api_port = getattr(settings, 'NODE_WALLET_API_PORT', None)
        node_api_token = getattr(settings, 'NODE_WALLET_INTERNAL_API_TOKEN', None)

        if not node_api_host or not node_api_port or not node_api_token:
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
            temp_wallet.error_message = "Server configuration error: Node.js API settings missing."
            temp_wallet.save()
            print("CRITICAL: NODE_WALLET_API_HOST, NODE_WALLET_API_PORT, or NODE_WALLET_INTERNAL_API_TOKEN не настроены в Django settings.")
            return Response({"error": "Сервис генерации кошельков временно недоступен (ошибка конфигурации сервера)."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        api_endpoint = f"{node_api_host.rstrip('/')}:{node_api_port}/generate_wallet"
        
        nodejs_payload = {
            "network": network,
            # Можно добавить userId и walletId (Django ID) если Node.js API их ожидает/использует для логирования
            # "userId": user.id,
            # "walletId": temp_wallet.id, 
        }

        try:
            response_from_node = requests.post(
                api_endpoint,
                json=nodejs_payload,
                headers={
                    "Authorization": f"Bearer {node_api_token}",
                    "Content-Type": "application/json"
                },
                timeout=10 # seconds
            )
            response_from_node.raise_for_status() 
            node_data = response_from_node.json()
            wallet_address = node_data.get('address')
            encrypted_key = node_data.get('encryptedPrivateKey')
            response_network = node_data.get('network') # Node.js также возвращает сеть

            if not wallet_address or not encrypted_key:
                temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
                temp_wallet.error_message = "Node.js did not return address or key."
                temp_wallet.save()
                print(f"ERROR: Неполный ответ от Node.js API {api_endpoint}: {node_data}")
                return Response({"error": "Получен неполный или некорректный ответ от сервиса генерации кошельков."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            if response_network != network:
                temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
                temp_wallet.error_message = f"Node.js returned network {response_network}, expected {network}."
                temp_wallet.save()
                print(f"ERROR: Node.js API вернул кошелек для сети {response_network}, а запрашивали {network}.")
                return Response({"error": "Сервис генерации кошельков вернул неверную сеть."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            temp_wallet.address = wallet_address
            temp_wallet.encrypted_private_key = encrypted_key
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_PENDING_DEPOSIT
            # temp_wallet.expires_at = timezone.now() + timedelta(hours=settings.TEMP_WALLET_EXPIRY_HOURS) # Если есть срок жизни
            temp_wallet.save()

        except requests.exceptions.Timeout:
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
            temp_wallet.error_message = f"Timeout calling Node.js API: {api_endpoint}"
            temp_wallet.save()
            print(f"ERROR: Таймаут при обращении к Node.js API {api_endpoint}")
            return Response({"error": "Сервис генерации кошельков не отвечает (таймаут)."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.exceptions.ConnectionError:
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
            temp_wallet.error_message = f"Connection error with Node.js API: {api_endpoint}"
            temp_wallet.save()
            print(f"ERROR: Ошибка соединения с Node.js API {api_endpoint}")
            return Response({"error": "Ошибка соединения с сервисом генерации кошельков."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.exceptions.HTTPError as http_err:
            error_message_detail = "Ошибка от сервиса генерации кошельков."
            try:
                error_details = http_err.response.json()
                error_message_detail = error_details.get("error", error_message_detail)
            except Exception: # json.JSONDecodeError или другие
                pass 
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
            temp_wallet.error_message = f"HTTP error from Node.js API ({http_err.response.status_code}): {error_message_detail}"
            temp_wallet.save()
            print(f"ERROR: HTTP ошибка от Node.js API {api_endpoint}: {http_err.response.status_code} - {error_message_detail}")
            return Response({"error": error_message_detail},
                            status=http_err.response.status_code if http_err.response.status_code >= 400 else status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e: 
            temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
            temp_wallet.error_message = f"Unexpected error calling Node.js API: {str(e)}"
            temp_wallet.save()
            print(f"CRITICAL: Непредвиденная ошибка при вызове Node.js API: {e}")
            return Response({"error": "Внутренняя ошибка сервера при генерации кошелька."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response_serializer = FlexibleTemporaryWalletSerializer(temp_wallet)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class NotifyFlexibleDepositView(generics.GenericAPIView):
    permission_classes = [IsNodeWorker] # Защищено токеном
    serializer_class = NotifyFlexibleDepositSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            temp_wallet = FlexibleTemporaryWallet.objects.get(address=data['wallet_address'])
        except FlexibleTemporaryWallet.DoesNotExist: 
            # Уже проверяется в сериализаторе, но для безопасности
            return Response({"error": "Temporary wallet not found."}, status=status.HTTP_404_NOT_FOUND)

        if temp_wallet.status != FlexibleTemporaryWallet.TEMP_WALLET_STATUS_PENDING_DEPOSIT:
            return Response({"error": "Wallet is not awaiting deposit or already processed.", "current_status": temp_wallet.status}, status=status.HTTP_400_BAD_REQUEST)

        temp_wallet.detected_amount = data['amount']
        temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_DEPOSIT_DETECTED
        # Можно сохранить user_transaction_id здесь, если Node.js его передает
        # и если он относится к temp_wallet, а не к FlexibleDeposit (который создается после свипа)
        temp_wallet.save(update_fields=['detected_amount', 'status', 'updated_at'])

        return Response({"message": "Deposit notification received. Wallet status updated."}, status=status.HTTP_200_OK)

class NotifyFlexibleSweepStatusView(generics.GenericAPIView):
    permission_classes = [IsNodeWorker] # Защищено токеном
    serializer_class = NotifyFlexibleSweepStatusSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            temp_wallet = FlexibleTemporaryWallet.objects.select_related('user').get(address=data['wallet_address'])
        except FlexibleTemporaryWallet.DoesNotExist:
            return Response({"error": "Temporary wallet not found."}, status=status.HTTP_404_NOT_FOUND)
        
        original_status = temp_wallet.status
        temp_wallet.status = data['status']

        if data['status'] == FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_SUCCESS:
            amount_to_credit = data.get('amount_swept', temp_wallet.detected_amount) # Предпочитаем amount_swept от Node.js
            if amount_to_credit is None or amount_to_credit <= Decimal(0):
                 temp_wallet.status = FlexibleTemporaryWallet.TEMP_WALLET_STATUS_ERROR
                 temp_wallet.error_message = "Amount swept is zero or not provided for successful sweep."
                 temp_wallet.save()
                 return Response({"error": temp_wallet.error_message}, status=status.HTTP_400_BAD_REQUEST)

            temp_wallet.sweep_tx_id = data.get('sweep_tx_id')
            temp_wallet.error_message = None 
            temp_wallet.save()

            # Создаем или получаем основной счет пользователя
            investment_account, created = FlexibleInvestmentAccount.objects.get_or_create(
                user=temp_wallet.user,
                network=temp_wallet.network, # Используем сеть временного кошелька
                defaults={'balance': amount_to_credit}
            )
            if not created:
                investment_account.balance += amount_to_credit
                investment_account.save(update_fields=['balance', 'updated_at'])
            
            # Создаем запись о депозите
            FlexibleDeposit.objects.create(
                account=investment_account,
                temporary_wallet=temp_wallet,
                amount=amount_to_credit, # Сумма, которая была зачислена
                network=temp_wallet.network,
                # user_transaction_id = temp_wallet.user_deposit_tx_id # если хранили его в temp_wallet
            )
            message = "Sweep successful. Funds credited to user account."
        
        elif data['status'] == FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_FAILED:
            temp_wallet.error_message = data.get('error_message', 'Sweep failed without specific error message.')
            temp_wallet.sweep_tx_id = None # Очищаем, если была предыдущая попытка
            temp_wallet.save()
            message = "Sweep failed. Status updated."
        else:
            # Этого не должно произойти из-за валидации сериализатора
            return Response({"error": "Invalid status provided."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": message, "wallet_status": temp_wallet.status}, status=status.HTTP_200_OK)

class PendingFlexibleDepositWalletsListView(generics.ListAPIView):
    permission_classes = [IsNodeWorker] # Защищено токеном
    serializer_class = PendingFlexibleTemporaryWalletSerializer
    
    def get_queryset(self):
        # Возвращаем кошельки, ожидающие депозита, или также те, что ожидают генерации, если Node.js это обрабатывает
        return FlexibleTemporaryWallet.objects.filter(
            status=FlexibleTemporaryWallet.TEMP_WALLET_STATUS_PENDING_DEPOSIT
        ).order_by('created_at')
        # Можно добавить фильтр по expires_at, если используется

class FlexibleTemporaryWalletEncryptedKeyView(views.APIView):
    permission_classes = [IsNodeWorker] # Защищено токеном

    def get(self, request, wallet_id, *args, **kwargs):
        try:
            temp_wallet = get_object_or_404(FlexibleTemporaryWallet, pk=wallet_id)
            # Дополнительная проверка статуса, если ключ выдается только при определенных условиях
            if temp_wallet.status not in [FlexibleTemporaryWallet.TEMP_WALLET_STATUS_DEPOSIT_RECEIVED, FlexibleTemporaryWallet.TEMP_WALLET_STATUS_SWEEP_INITIATED]:
                return Response({"error": "Wallet is not in a state where key can be retrieved (e.g., deposit not detected)."}, status=status.HTTP_403_FORBIDDEN)
            
            if not temp_wallet.encrypted_private_key:
                return Response({"error": "Encrypted private key not found for this wallet."}, status=status.HTTP_404_NOT_FOUND)

            return Response({"wallet_id": temp_wallet.id, "encrypted_private_key": temp_wallet.encrypted_private_key}, status=status.HTTP_200_OK)
        except FlexibleTemporaryWallet.DoesNotExist:
             return Response({"error": "Temporary wallet not found."}, status=status.HTTP_404_NOT_FOUND)

class FlexibleWithdrawView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FlexibleWithdrawalCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        amount_requested = validated_data['amount_requested']
        network = validated_data['network']
        wallet_address = validated_data['wallet_address']

        try:
            account = FlexibleInvestmentAccount.objects.get(user=request.user, network=network)
        except FlexibleInvestmentAccount.DoesNotExist:
            return Response({"error": "Investment account for this network not found."}, status=status.HTTP_404_NOT_FOUND)

        if account.balance < amount_requested:
             return Response({"error": f"Insufficient balance for the requested amount ({amount_requested})."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Убедимся, что после вычета суммы запроса и комиссии на балансе не останется отрицательное значение,
        # и что amount_requested покрывает комиссию (это уже проверяется в сериализаторе).
        # Здесь основная проверка, что account.balance >= amount_requested, так как сама транзакция вывода
        # будет на amount_requested - commission. Сумма amount_requested списывается со счета пользователя.

        with transaction.atomic():
            account.balance -= amount_requested 
            account.save(update_fields=['balance', 'updated_at'])

            withdrawal = FlexibleWithdrawal.objects.create(
                account=account,
                amount_requested=amount_requested,
                commission=FLEXIBLE_WITHDRAWAL_COMMISSION,
                network=network,
                wallet_address=wallet_address,
                status=FlexibleWithdrawal.STATUS_PENDING 
            )
        
        return Response({
            "message": "Withdrawal request created successfully.", 
            "withdrawal_id": withdrawal.id,
            "status": withdrawal.status,
            "amount_to_receive": withdrawal.amount_received,
            "new_balance": account.balance
        }, status=status.HTTP_201_CREATED)

class FlexibleStatsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        accounts = FlexibleInvestmentAccount.objects.filter(user=request.user)
        if not accounts.exists():
            return Response({"message": "No flexible investment accounts found for this user."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = FlexibleInvestmentAccountStatsSerializer(accounts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FlexibleDepositsHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FlexibleDepositHistorySerializer

    def get_queryset(self):
        user = self.request.user
        return FlexibleDeposit.objects.filter(account__user=user).order_by('-timestamp')

class FlexibleWithdrawalsHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FlexibleWithdrawalHistorySerializer

    def get_queryset(self):
        user = self.request.user
        return FlexibleWithdrawal.objects.filter(account__user=user).order_by('-timestamp')

class FlexiblePayoutsHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FlexiblePayoutHistorySerializer

    def get_queryset(self):
        user = self.request.user
        return FlexiblePayout.objects.filter(account__user=user).order_by('-timestamp') 