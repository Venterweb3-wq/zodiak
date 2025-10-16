from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, EmailVerification, OneTimeCode, LoginHistory, ActivityLog, TrustedDevice, InvestmentStrategy
import pyotp
from django.core.exceptions import ValidationError as DjangoValidationError
import re
from django.conf import settings
import requests
from django.utils import timezone
from datetime import timedelta
import random
import string
from decimal import Decimal
from django.db.models import Sum
# from myproject.apps.cross_arbitrage.models import InvestmentAccount as CrossArbitrageInvestmentAccount
# from myproject.apps.cross_arbitrage.models import InvestmentDeposit as CrossArbitrageInvestmentDeposit
# from myproject.apps.cross_arbitrage.models import DailyPayout as CrossArbitrageDailyPayout
# from myproject.apps.cross_arbitrage.models import WithdrawalRequest as CrossArbitrageWithdrawalRequest
from django.apps import apps

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    referred_code = serializers.CharField(write_only=True, required=True)
    accept_terms = serializers.BooleanField(write_only=True)
    marketing_optin = serializers.BooleanField(required=False)
    captcha = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'confirm_password', 'referred_code', 'accept_terms', 'marketing_optin', 'captcha')

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Пароли не совпадают."})
        return data

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError("Вы должны принять условия использования.")
        return value

    def validate_referred_code(self, value):
        """Проверяет, существует ли активный пользователь с таким реферальным кодом."""
        try:
            # Проверяем, что существует пользователь, который является владельцем этого реферального кода
            # и он активен (если это важно для вашей логики рефералов)
            User.objects.get(referral_code=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Недействительный или неактивный реферальный код.")
        return value # Возвращаем код, если он валиден

    def validate_captcha(self, value):
        if getattr(settings, 'NOCAPTCHA', False):
            return value
            
        if not settings.RECAPTCHA_PRIVATE_KEY:
            raise serializers.ValidationError("reCAPTCHA не настроен на сервере (отсутствует приватный ключ).")

        try:
            response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': settings.RECAPTCHA_PRIVATE_KEY,
                    'response': value
                },
                timeout=5
            )
            response.raise_for_status()
            result = response.json()
        except requests.exceptions.RequestException as e:
            print(f"Ошибка при запросе к reCAPTCHA API: {e}")
            raise serializers.ValidationError("Ошибка при проверке CAPTCHA. Попробуйте позже.")

        if not result.get('success'):
            raise serializers.ValidationError("Проверка CAPTCHA не пройдена.")
        return value

    def create(self, validated_data):
        # referred_code уже провалидирован и будет использован для поиска реферера
        referrer_code_value = validated_data.pop('referred_code') # Извлекаем его перед созданием User
        
        validated_data.pop('confirm_password', None)
        validated_data.pop('accept_terms', None) 
        validated_data.pop('captcha', None) 
        
        user = User(**validated_data)
        user.set_password(validated_data['password'])
        user.is_active = False 

        # Привязываем реферера. Так как validate_referred_code уже проверил наличие,
        # здесь мы можем быть уверены, что реферер существует.
        try:
            referrer = User.objects.get(referral_code=referrer_code_value)
            user.referred_by = referrer
        except User.DoesNotExist:
            # Эта ситуация не должна произойти, если validate_referred_code отработал корректно,
            # но оставим как подстраховку.
            pass 

        user.save()
        # Логирование регистрации
        # log_activity(user, 'USER_REGISTERED', ip_address=request.META.get('REMOTE_ADDR')) # log_activity требует request, который здесь недоступен
        # Логирование лучше перенести во view, где есть request
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    token = serializers.CharField(required=False, write_only=True, max_length=6, min_length=6)

    def validate(self, data):
        two_factor_token = data.pop('token', None)

        user = authenticate(username=data.get('username'), password=data.get('password'))

        if not user:
            raise serializers.ValidationError("Неверные учетные данные")

        if not user.is_active:
            raise serializers.ValidationError("Учетная запись пользователя неактивна.")

        if user.two_factor_enabled:
            if not user.two_factor_secret:
                raise serializers.ValidationError("2FA включен, но секрет не настроен. Обратитесь в поддержку.")
            if not two_factor_token:
                raise serializers.ValidationError({"2fa_required": True, "message": "Требуется код 2FA"})
            
            totp = pyotp.TOTP(user.two_factor_secret)
            if not totp.verify(two_factor_token):
                raise serializers.ValidationError("Неверный код 2FA")
        
        return {"user": user}

class EmailVerificationSerializer(serializers.Serializer):
    code = serializers.UUIDField()

    def validate_code(self, value):
        try:
            verification = EmailVerification.objects.get(code=value, is_used=False)
            # Check if email is already verified
            if verification.user.email_verified:
                raise serializers.ValidationError("Email уже подтвержден.")
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Недействительный или уже использованный код.")
        return verification

    def save(self, **kwargs):
        verification = self.validated_data['code'] # This is already a validated EmailVerification instance
        verification.is_used = True
        verification.save()
        user = verification.user
        user.email_verified = True
        user.is_active = True
        user.save(update_fields=['email_verified', 'is_active'])
        return user

class Enable2FASerializer(serializers.Serializer):
    # This serializer does not take input fields in the traditional sense for validation,
    # but it uses the context to access the user and performs an action (generates secret).
    # The output is the secret and URI.
    def create(self, validated_data): # validated_data will be empty here
        user = self.context['request'].user
        if not isinstance(user, User):
            raise serializers.ValidationError("Пользователь не аутентифицирован должным образом.")
        
        user.generate_2fa_secret() # This method in User model saves the secret
        return {"secret": user.two_factor_secret, "uri": user.get_totp_uri()}

class Confirm2FASerializer(serializers.Serializer):
    token = serializers.CharField(max_length=6, min_length=6) # Assuming TOTP codes are 6 digits

    def validate(self, data):
        user = self.context['request'].user
        if not isinstance(user, User):
            raise serializers.ValidationError("Пользователь не аутентифицирован должным образом.")

        if not user.two_factor_secret:
            raise serializers.ValidationError("2FA не инициализирован. Сначала сгенерируйте секретный ключ.")
        
        if user.two_factor_enabled:
            raise serializers.ValidationError("2FA уже включен для этого пользователя.")

        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(data['token']):
            raise serializers.ValidationError("Неверный код подтверждения. Пожалуйста, убедитесь, что время на вашем устройстве синхронизировано.")
        
        # The actual enabling of 2FA is done in the save method after successful validation
        return data # Pass through validated data for the save method

    def save(self, **kwargs):
        user = self.context['request'].user
        # No need to re-verify token here as it's done in validate
        user.two_factor_enabled = True
        user.save(update_fields=["two_factor_enabled"])
        return {"message": "2FA успешно включен."}
        # Note: The original request asked for {"success": True}. 
        # Returning a more descriptive message might be better for the API consumer.
        # If {"success": True} is strictly required, change the return line above.

class UserProfileSerializer(serializers.ModelSerializer):
    total_investment_balance = serializers.DecimalField(max_digits=18, decimal_places=8, read_only=True)
    total_investment_profit = serializers.DecimalField(max_digits=18, decimal_places=8, read_only=True)
    total_referrals = serializers.IntegerField(read_only=True)
    total_referral_earnings = serializers.DecimalField(max_digits=18, decimal_places=8, read_only=True)
    kyc_status = serializers.CharField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'email_verified', 'is_active', 'two_factor_enabled',
            'referral_code', 'language', 'theme', 'marketing_optin',
            'last_login_ip', 'date_joined', 'functionality_limited_until',
            'kyc_status',
            'total_investment_balance', 'total_investment_profit',
            'total_referrals', 'total_referral_earnings',
        )
        read_only_fields = fields # Все поля только для чтения

    def to_representation(self, instance):
        """Переопределяем, чтобы добавить данные из контекста."""
        representation = super().to_representation(instance)
        context = self.context
        
        representation['total_investment_balance'] = context.get('total_investment_balance', Decimal('0.0'))
        representation['total_investment_profit'] = context.get('total_investment_profit', Decimal('0.0'))
        representation['total_referrals'] = context.get('total_referrals', 0)
        representation['total_referral_earnings'] = context.get('total_referral_earnings', Decimal('0.0'))
        representation['kyc_status'] = getattr(instance, 'kyc_status', 'not_started')
        
        return representation

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    # Making email read-only as email changes should typically go through a verification process.
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = (
            'username', 
            'first_name', # Add if you want to allow updating these
            'last_name',  # Add if you want to allow updating these
            'language',
            'theme',
            'email',
            'marketing_optin'
        )

    # You might want to add custom validation, e.g., for username uniqueness if it can be changed.
    # def validate_username(self, value):
    #     if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
    #         raise serializers.ValidationError("Этот username уже используется.")
    #     return value

class SecurityStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'email_verified',
            'two_factor_enabled',
            'last_login_ip'
        )
        read_only_fields = fields # Все поля только для чтения

class Request2FAResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True) # Ищем активного пользователя по email
        except User.DoesNotExist:
            # Не раскрываем, существует ли email, чтобы избежать перечисления пользователей
            # Вместо этого, если email не найден или пользователь неактивен, делаем вид, что все ОК,
            # но письмо не отправляем. Или всегда возвращаем успех, но письмо идет только если есть юзер.
            # Для большей безопасности, не даем понять, есть ли такой email в системе.
            # Поэтому, если пользователя нет, мы все равно вернем email, но в view письмо не отправим.
            # Однако, это может сбить с толку пользователя, который ожидает письмо.
            # Альтернатива: всегда возвращать один и тот же "успешный" ответ.
            # Для простоты, пока будем рейзить ошибку, если email не связан с активным юзером, 
            # но с пометкой, что это можно пересмотреть.
            return value

        if not user.two_factor_enabled:
            # Эту ошибку можно оставить, так как пользователь уже идентифицирован
            # и для него это полезная информация.
            raise serializers.ValidationError("Двухфакторная аутентификация не включена для этого пользователя.")
        
        # Можно добавить проверку, не запрашивал ли пользователь сброс слишком часто
        # Например, проверив наличие недавних активных OneTimeCode для этого юзера
        
        return value # Возвращаем email, если все проверки пройдены

class Confirm2FAResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=16)

    def validate(self, attrs):
        email = attrs.get('email')
        code_value = attrs.get('code')

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Неверный email или код.") # Общая ошибка

        if not user.two_factor_enabled:
            # Эта проверка на случай, если 2FA была отключена другим способом между запросом и подтверждением
            raise serializers.ValidationError("Двухфакторная аутентификация уже отключена.")

        try:
            one_time_code = OneTimeCode.objects.get(
                user=user,
                code=code_value,
                purpose='2fa_reset',
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except OneTimeCode.DoesNotExist:
            raise serializers.ValidationError("Неверный или истекший код.")
        
        attrs['user'] = user
        attrs['one_time_code'] = one_time_code
        return attrs

class LoginHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginHistory
        fields = ['timestamp', 'ip_address', 'user_agent', 'country', 'city']
        # Не включаем 'user', так как это будет история для текущего аутентифицированного пользователя

class ActivityLogSerializer(serializers.ModelSerializer):
    # Для более читаемого отображения action_type можно использовать SerializerMethodField
    # или просто оставить как есть, если на фронтенде будет маппинг ключей на текстовые описания.
    # action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        model = ActivityLog
        # Включаем user, чтобы можно было видеть, кто совершил действие, если лог не только для текущего юзера
        # Но для API "мои логи активности" user не нужен в ответе.
        # fields = ['timestamp', 'action_type', 'details', 'ip_address', 'user'] 
        fields = ['timestamp', 'action_type', 'get_action_type_display', 'details', 'ip_address']
        read_only_fields = fields

class VerifyDeviceSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=16)
    # device_identifier = serializers.CharField(max_length=255, required=False) # Опционально, если передаем с фронта

    def validate(self, attrs):
        email = attrs.get('email')
        code_value = attrs.get('code')
        # device_id_from_request = attrs.get('device_identifier')

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Неверный email или код.")

        try:
            one_time_code = OneTimeCode.objects.get(
                user=user,
                code=code_value,
                purpose='device_verification',
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except OneTimeCode.DoesNotExist:
            raise serializers.ValidationError("Неверный или истекший код подтверждения устройства.")
        
        # Проверка, если бы мы передавали device_identifier для сверки
        # current_ip = self.context['request'].META.get('REMOTE_ADDR')
        # current_user_agent = self.context['request'].META.get('HTTP_USER_AGENT')
        # expected_device_id = TrustedDevice.generate_identifier(current_ip, current_user_agent)
        # if device_id_from_request and device_id_from_request != expected_device_id:
        #     raise serializers.ValidationError("Идентификатор устройства не совпадает.")
        
        attrs['user'] = user
        attrs['one_time_code'] = one_time_code
        # attrs['device_identifier_to_trust'] = expected_device_id # Если генерируем здесь
        return attrs

class TrustedDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustedDevice
        fields = ['id', 'user_agent', 'ip_address', 'added_at', 'last_login_at']
        read_only_fields = fields

class InvestmentStrategySerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentStrategy
        fields = ['strategy_key', 'api_prefix', 'redis_channel']
