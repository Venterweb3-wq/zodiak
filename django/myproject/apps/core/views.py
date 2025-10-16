from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsNodeWorker
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    Enable2FASerializer,
    Confirm2FASerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    SecurityStatusSerializer,
    Request2FAResetSerializer,
    Confirm2FAResetSerializer,
    LoginHistorySerializer,
    ActivityLogSerializer,
    VerifyDeviceSerializer,
    TrustedDeviceSerializer,
    InvestmentStrategySerializer
)
from .models import EmailVerification, User, OneTimeCode, LoginHistory, ActivityLog, TrustedDevice, InvestmentStrategy
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
import random
import string
import hashlib
from decimal import Decimal
# Импорты для GeoIP
from geoip2.database import Reader as GeoIPReader # Используем псевдоним во избежание конфликта имен
from geoip2.errors import AddressNotFoundError
import os # для os.path.join при инициализации ридера
from django.template.loader import render_to_string
from django.apps import apps
from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum, OuterRef, Subquery, DecimalField, Q, F
from django.db.models.functions import Coalesce

# Инициализация GeoIP Reader
# Лучше инициализировать один раз при загрузке модуля, если путь к базе данных фиксирован
GEOIP_DB_PATH = os.path.join(settings.GEOIP_PATH, 'GeoLite2-City.mmdb')
geoip_reader = None
if os.path.exists(GEOIP_DB_PATH):
    try:
        geoip_reader = GeoIPReader(GEOIP_DB_PATH)
    except Exception as e:
        print(f"GeoIP Error: Could not initialize GeoIP reader: {e}")
else:
    print(f"GeoIP Warning: Database file not found at {GEOIP_DB_PATH}. GeoIP lookups will be skipped.")

def log_activity(user, action_type, details=None, ip_address=None):
    """Вспомогательная функция для создания записей в ActivityLog."""
    ActivityLog.objects.create(
        user=user,
        action_type=action_type,
        details=details or {},
        ip_address=ip_address
    )

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Генерация токена и uid для подтверждения email
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # Важно: убедитесь, что URL фронтенда для активации правильный
            # Сейчас используется http://localhost:3000, это может потребовать настройки для production
            # Лучше вынести доменное имя в settings.FRONTEND_URL
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000') 
            verify_url = f"{frontend_url}/activate/{uid}/{token}/"

            context = {
                'user': user,
                'verify_url': verify_url,
            }
            
            subject = render_to_string('core/email/verify_email_subject.txt', context).strip()
            text_body = render_to_string('core/email/verify_email_body.txt', context)
            html_body = render_to_string('core/email/verify_email_body.html', context)
            
            send_mail(
                subject=subject,
                message=text_body, # Текстовая версия
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
                recipient_list=[user.email],
                html_message=html_body # HTML версия
            )
            # Логирование регистрации
            log_activity(user, 'USER_REGISTERED', ip_address=request.META.get('REMOTE_ADDR'))
            return Response({"message": "Пользователь зарегистрирован. Пожалуйста, проверьте вашу почту для подтверждения email."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def _generate_otp_code(self, length=6):
        characters = string.digits
        return ''.join(random.choice(characters) for _ in range(length))

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data.get("user")

        ip_address = request.META.get('REMOTE_ADDR')
        user_agent_string = request.META.get('HTTP_USER_AGENT')

        country, city = None, None
        if geoip_reader and ip_address:
            try:
                response = geoip_reader.city(ip_address)
                country = response.country.name
                city = response.city.name
            except AddressNotFoundError:
                pass # IP не найден в базе
            except Exception as e:
                print(f"GeoIP Error during lookup for {ip_address}: {e}")

        cookie_token = request.COOKIES.get(settings.DEVICE_TOKEN_COOKIE_NAME)
        
        if cookie_token and user: 
            hashed_token = hashlib.sha256(cookie_token.encode('utf-8')).hexdigest()
            try:
                trusted_device = TrustedDevice.objects.get(user=user, device_token_hash=hashed_token)
                
                trusted_device.last_login_at = timezone.now()
                trusted_device.ip_address = ip_address
                trusted_device.user_agent = user_agent_string
                trusted_device.save(update_fields=['last_login_at', 'ip_address', 'user_agent'])

                login(request, user)
                if ip_address:
                    user.last_login_ip = ip_address
                    user.save(update_fields=['last_login_ip'])
                
                LoginHistory.objects.create(user=user, ip_address=ip_address, user_agent=user_agent_string, country=country, city=city)
                log_activity(user, 'USER_LOGGED_IN', 
                             details={"ip": ip_address, 
                                      "method": "cookie_trusted_device", 
                                      "device_id_in_db": trusted_device.id}, 
                             ip_address=ip_address)
                
                return Response({
                    "message": "Успешный вход с доверенного устройства (cookie).", 
                    "username": user.username,
                    "device_trusted": True 
                }, status=status.HTTP_200_OK)

            except TrustedDevice.DoesNotExist:
                log_activity(user, 'INVALID_DEVICE_COOKIE_ATTEMPT',
                             details={"ip": ip_address, "user_agent": user_agent_string, "invalid_cookie_token_present": True},
                             ip_address=ip_address)
                pass 

        OneTimeCode.objects.filter(user=user, purpose='device_verification', is_used=False).delete()
        
        verification_code = self._generate_otp_code()
        expiry_minutes = getattr(settings, 'DEVICE_VERIFICATION_OTP_EXPIRY_MINUTES', 15)
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        OneTimeCode.objects.create(
            user=user, 
            code=verification_code, 
            expires_at=expires_at, 
            purpose='device_verification'
        )
        
        context = {
            'user': user,
            'verification_code': verification_code,
            'expiry_minutes': expiry_minutes
        }

        subject = render_to_string('core/email/device_otp_subject.txt', context).strip()
        text_body = render_to_string('core/email/device_otp_body.txt', context)
        html_body = render_to_string('core/email/device_otp_body.html', context)

        send_mail(
            subject=subject,
            message=text_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
            recipient_list=[user.email],
            html_message=html_body
        )
        
        log_activity(user, 'NEW_DEVICE_OTP_SENT', 
                     details={"ip": ip_address, "user_agent": user_agent_string, "reason": "No/invalid device cookie"},
                     ip_address=ip_address)
        
        response_data = {
            "status": "device_verification_required", 
            "message": "Это устройство не распознано. Код подтверждения был отправлен на ваш email.",
            "email": user.email 
        }
        
        response = Response(response_data, status=status.HTTP_202_ACCEPTED)
        if cookie_token: 
             response.delete_cookie(
                 settings.DEVICE_TOKEN_COOKIE_NAME
             )
        return response

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            if user.is_active and user.email_verified:
                return Response({"message": "Email уже подтвержден и аккаунт активен."}, status=status.HTTP_200_OK)
            
            user.is_active = True
            user.email_verified = True
            user.save(update_fields=['is_active', 'email_verified'])
            # Логирование подтверждения email
            log_activity(user, 'EMAIL_VERIFIED', ip_address=request.META.get('REMOTE_ADDR'))
            return Response({"message": "Email успешно подтверждён. Теперь вы можете войти."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Ссылка для подтверждения недействительна или истекла."}, status=status.HTTP_400_BAD_REQUEST)

class Enable2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request):
        serializer = Enable2FASerializer(context={'request': request})
        # The create method of Enable2FASerializer generates the secret and URI
        response_data = serializer.create(validated_data={}) 
        # Логирование попытки включения 2FA (секрет сгенерирован, но еще не подтвержден)
        # Можно добавить отдельный тип действия или логировать только после Confirm2FAView
        # log_activity(request.user, '2FA_SETUP_INITIATED', ip_address=request.META.get('REMOTE_ADDR'))
        return Response(response_data, status=status.HTTP_200_OK)

class Confirm2FAView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def post(self, request):
        serializer = Confirm2FASerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # The save method of Confirm2FASerializer enables 2FA and returns a success message
            response_data = serializer.save()
            # Логирование успешного включения 2FA
            log_activity(request.user, '2FA_ENABLED', ip_address=request.META.get('REMOTE_ADDR'))
            return Response(response_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        user = request.user

        # Получаем все активные инвестиционные стратегии
        strategies = InvestmentStrategy.objects.filter(is_active=True)

        total_investment_balance = Decimal('0.0')
        total_investment_profit = Decimal('0.0')

        # Динамически агрегируем данные по всем стратегиям
        for strategy in strategies:
            try:
                AccountModel = apps.get_model(strategy.app_label, 'InvestmentAccount')
                stats = AccountModel.objects.filter(user=user).aggregate(
                    total_balance=Coalesce(Sum('balance'), Decimal('0.0')),
                    total_profit=Coalesce(Sum('total_profit'), Decimal('0.0'))
                )
                total_investment_balance += stats['total_balance']
                total_investment_profit += stats['total_profit']
            except LookupError:
                # Пропускаем, если модель для стратегии не найдена
                print(f"Warning: Model for strategy '{strategy.strategy_key}' with app_label '{strategy.app_label}' not found. Skipping.")
                continue

        # Статистика по рефералам (как и было)
        referral_stats = user.referrals.aggregate(
            total_referrals=Count('id'),
            total_referral_earnings=Coalesce(Sum('referral_earnings__amount'), Decimal('0.0'), output_field=DecimalField())
        )

        # Данные для KYC (как и было)
        user.kyc_status = user.kyc_application.status if hasattr(user, 'kyc_application') else 'not_started'

        # Подготовка контекста для сериализатора
        context_data = {
            'total_investment_balance': total_investment_balance,
            'total_investment_profit': total_investment_profit,
            'total_referrals': referral_stats['total_referrals'],
            'total_referral_earnings': referral_stats['total_referral_earnings'],
        }

        serializer = UserProfileSerializer(user, context=context_data)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        # Проверка на ограничение функционала
        if user.functionality_limited_until and user.functionality_limited_until > timezone.now():
            return Response(
                {"error": "Обновление профиля временно ограничено после сброса 2FA. Пожалуйста, подождите.",
                 "limited_until": user.functionality_limited_until.isoformat()},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Собираем детали изменений для лога
            changed_fields = {field: str(serializer.validated_data.get(field)) for field in serializer.validated_data if user.__getattribute__(field) != serializer.validated_data.get(field)}
            if changed_fields:
                 log_activity(user, 'PROFILE_UPDATED', details=changed_fields, ip_address=request.META.get('REMOTE_ADDR'))
            serializer.save()
            return Response({"message": "Профиль обновлён"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SecurityStatusView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        serializer = SecurityStatusSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ResendVerificationEmailView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle] # Защищаем от частого запроса писем

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({"message": "Ваш email уже подтвержден."}, status=status.HTTP_400_BAD_REQUEST)

        # EmailVerification.objects.filter(user=user, is_used=False).delete() # Опционально
        # Вместо удаления старых кодов, которые могли быть сгенерированы через default_token_generator,
        # для этого эндпоинта мы будем использовать тот же механизм, что и в RegisterView: default_token_generator
        # Он не создает запись в EmailVerification, а генерирует токен на лету.
        
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verify_url = f"{frontend_url}/activate/{uid}/{token}/"
        
        context = {
            'user': user,
            'verify_url': verify_url,
        }
        
        subject = render_to_string('core/email/verify_email_subject.txt', context).strip()
        text_body = render_to_string('core/email/verify_email_body.txt', context)
        html_body = render_to_string('core/email/verify_email_body.html', context)
        
        send_mail(
            subject=subject,
            message=text_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
            recipient_list=[user.email],
            html_message=html_body
        )
        # log_activity(user, 'RESENT_EMAIL_VERIFICATION', ip_address=request.META.get('REMOTE_ADDR')) # Можно добавить логирование
        return Response({"message": "Письмо с подтверждением отправлено повторно."}, status=status.HTTP_200_OK)

class Request2FAResetView(APIView):
    permission_classes = [AllowAny] # Доступно всем, так как пользователь не может войти
    throttle_classes = [AnonRateThrottle]

    def _generate_otp_code(self, length=6):
        characters = string.digits
        return ''.join(random.choice(characters) for _ in range(length))

    def post(self, request):
        serializer = Request2FAResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Не раскрываем, существует ли email, из соображений безопасности
            # Можно просто вернуть 200 ОК, как будто письмо отправлено
            log_activity(None, '2FA_RESET_REQUEST_UNKNOWN_EMAIL', 
                         details={"email_attempted": email, "ip": request.META.get('REMOTE_ADDR')},
                         ip_address=request.META.get('REMOTE_ADDR'))
            return Response({"message": "Если этот email связан с аккаунтом, на него будет отправлен код для сброса 2FA."}, 
                            status=status.HTTP_200_OK)

        if not user.two_factor_enabled:
            return Response({"message": "Для этого аккаунта 2FA не включена."}, status=status.HTTP_400_BAD_REQUEST)

        # Удаляем предыдущие неиспользованные коды для сброса 2FA
        OneTimeCode.objects.filter(user=user, purpose='2fa_reset', is_used=False).delete()

        reset_code = self._generate_otp_code()
        expiry_minutes = getattr(settings, 'RESET_2FA_OTP_EXPIRY_MINUTES', 15) # Можно настроить в settings
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        OneTimeCode.objects.create(
            user=user, 
            code=reset_code, 
            expires_at=expires_at, 
            purpose='2fa_reset'
        )
        
        context = {
            'user': user,
            'reset_code': reset_code,
            'expiry_minutes': expiry_minutes
        }

        subject = render_to_string('core/email/reset_2fa_subject.txt', context).strip()
        text_body = render_to_string('core/email/reset_2fa_body.txt', context)
        html_body = render_to_string('core/email/reset_2fa_body.html', context)

        send_mail(
            subject=subject,
            message=text_body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com'),
            recipient_list=[user.email],
            html_message=html_body
        )
        
        log_activity(user, '2FA_RESET_OTP_SENT', ip_address=request.META.get('REMOTE_ADDR'))
        return Response({"message": "Код для сброса 2FA отправлен на ваш email."}, status=status.HTTP_200_OK)

class Confirm2FAResetView(APIView):
    permission_classes = [AllowAny] # Доступно всем
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = Confirm2FAResetSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            one_time_code = serializer.validated_data['one_time_code']
            
            user.two_factor_enabled = False
            user.two_factor_secret = None 
            user.functionality_limited_until = timezone.now() + timedelta(hours=24)
            user.save(update_fields=['two_factor_enabled', 'two_factor_secret', 'functionality_limited_until'])
            
            one_time_code.is_used = True
            one_time_code.save()
            
            # Логирование сброса и отключения 2FA
            log_activity(user, '2FA_RESET_COMPLETED', ip_address=request.META.get('REMOTE_ADDR'))
            log_activity(user, '2FA_DISABLED', details={"reason": "reset_via_email_code"}, ip_address=request.META.get('REMOTE_ADDR'))
            
            return Response({"message": "Двухфакторная аутентификация успешно отключена. Вы можете войти, используя только пароль."}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        # Получаем историю входов для текущего пользователя, например, последние 20 записей
        history_entries = request.user.login_history.all()[:20] # Используем related_name
        serializer = LoginHistorySerializer(history_entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ActivityLogView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        # Получаем лог активности для текущего пользователя, например, последние 20 записей
        activity_logs = request.user.activity_logs.all()[:20] # Используем related_name
        serializer = ActivityLogSerializer(activity_logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class VerifyDeviceView(APIView):
    permission_classes = [AllowAny] # Доступно без аутентификации, т.к. пользователь еще не вошел до конца
    throttle_classes = [AnonRateThrottle]

    def post(self, request):
        serializer = VerifyDeviceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data.get("user")
        otp_code = serializer.validated_data.get("code")
        
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent_string = request.META.get('HTTP_USER_AGENT')
        
        country, city = None, None
        if geoip_reader and ip_address:
            try:
                response = geoip_reader.city(ip_address)
                country = response.country.name
                city = response.city.name
            except AddressNotFoundError:
                pass
            except Exception as e:
                print(f"GeoIP Error during lookup for {ip_address}: {e}")

        try:
            one_time_code = OneTimeCode.objects.get(
                user=user, 
                code=otp_code, 
                purpose='device_verification'
            )
        except OneTimeCode.DoesNotExist:
            log_activity(user, 'DEVICE_VERIFICATION_FAILED', 
                         details={"reason": "Invalid OTP code", "ip": ip_address}, 
                         ip_address=ip_address)
            return Response({"error": "Неверный код подтверждения."}, status=status.HTTP_400_BAD_REQUEST)

        if one_time_code.is_used:
            return Response({"error": "Этот код уже был использован."}, status=status.HTTP_400_BAD_REQUEST)
        
        if one_time_code.expires_at < timezone.now():
            return Response({"error": "Срок действия кода истек. Пожалуйста, войдите снова, чтобы получить новый код."}, status=status.HTTP_400_BAD_REQUEST)
        
        trusted_device = TrustedDevice.objects.create(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent_string,
            last_login_at=timezone.now()
        )
        new_token = trusted_device.set_new_token()
        trusted_device.save()
        
        one_time_code.is_used = True
        one_time_code.save()

        login(request, user)
        if ip_address:
            user.last_login_ip = ip_address
            user.save(update_fields=['last_login_ip'])
        
        LoginHistory.objects.create(user=user, ip_address=ip_address, user_agent=user_agent_string, country=country, city=city)
        
        log_activity(user, 'DEVICE_VERIFIED_AND_LOGGED_IN', 
                     details={
                         "ip": ip_address, 
                         "token_set": True,
                         "device_id_in_db": trusted_device.id
                     }, 
                     ip_address=ip_address)

        response_data = {
            "message": "Устройство успешно подтверждено. Выполнен вход.",
            "username": user.username,
            "device_trusted": True
        }
        
        response = Response(response_data, status=status.HTTP_200_OK)
        
        response.set_cookie(
            key=settings.DEVICE_TOKEN_COOKIE_NAME,
            value=new_token,
            max_age=settings.DEVICE_TOKEN_COOKIE_MAX_AGE_SECONDS,
            secure=settings.SESSION_COOKIE_SECURE,
            httponly=True,
            samesite='Lax'
        )
        
        return response

class TrustedDeviceManagementView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get(self, request):
        """
        Возвращает список доверенных устройств для текущего пользователя.
        """
        devices = TrustedDevice.objects.filter(user=request.user).order_by('-last_login_at')
        serializer = TrustedDeviceSerializer(devices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, device_id):
        """
        Удаляет доверенное устройство по его ID.
        """
        try:
            device = TrustedDevice.objects.get(id=device_id, user=request.user)
            device_info = {"user_agent": device.user_agent, "ip_address": device.ip_address}
            device.delete()
            log_activity(request.user, 'TRUSTED_DEVICE_REMOVED', details=device_info, ip_address=request.META.get('REMOTE_ADDR'))
            return Response({"message": "Доверенное устройство успешно удалено."}, status=status.HTTP_204_NO_CONTENT)
        except TrustedDevice.DoesNotExist:
            return Response({"error": "Доверенное устройство не найдено или у вас нет прав на его удаление."}, status=status.HTTP_404_NOT_FOUND)

class InvestmentStrategyListView(APIView):
    permission_classes = [IsNodeWorker] # Защищаем эндпоинт токеном воркера

    def get(self, request):
        strategies = InvestmentStrategy.objects.filter(is_active=True)
        serializer = InvestmentStrategySerializer(strategies, many=True)
        return Response(serializer.data)

class UpdateWalletStatusView(APIView):
    permission_classes = [IsNodeWorker]

    def post(self, request):
        strategy_key = request.data.get('strategy_key')
        wallet_id = request.data.get('wallet_id')
        new_status = request.data.get('status')

        if not all([strategy_key, wallet_id, new_status]):
            return Response({"error": "strategy_key, wallet_id, and status are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Динамически получаем модель кошелька для нужной стратегии
            if strategy_key == 'flexible_arbitrage':
                WalletModel = apps.get_model('flexible_arbitrage', 'FlexibleTemporaryWallet')
            else:
                WalletModel = apps.get_model(strategy_key, 'TemporaryWallet')
            
            # Проверяем, есть ли такой статус в модели
            status_choices = [choice[0] for choice in WalletModel.STATUS_CHOICES]
            if new_status not in status_choices:
                return Response({"error": f"Invalid status '{new_status}' for strategy '{strategy_key}'"}, status=status.HTTP_400_BAD_REQUEST)

        except LookupError:
            return Response({"error": f"Invalid strategy_key: {strategy_key}"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wallet = WalletModel.objects.get(pk=wallet_id)
            wallet.status = new_status
            wallet.save(update_fields=['status', 'updated_at'])
            return Response({"message": f"Status for wallet {wallet_id} updated to {new_status}"})
        except WalletModel.DoesNotExist:
            return Response({"error": f"Wallet {wallet_id} not found for strategy {strategy_key}"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
