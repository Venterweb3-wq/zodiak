from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
import uuid
import pyotp
import hashlib # Для хеширования идентификатора устройства
import secrets # Для генерации надежных токенов
from urllib.parse import quote

class User(AbstractUser):
    # Поля, которые уже есть в AbstractUser, но мы их переопределяем для related_name
    groups = models.ManyToManyField(
        Group, # Используем импортированный Group
        verbose_name='groups',
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="core_user_groups_set", # Уникальное related_name
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission, # Используем импортированный Permission
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="core_user_permissions_set", # Уникальное related_name
        related_query_name="user",
    )

    # Profile settings
    language = models.CharField(max_length=10, default='ru')
    theme = models.CharField(max_length=20, default='dark')
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    
    # Marketing preferences
    marketing_optin = models.BooleanField(default=False)
    
    # Referral system
    referral_code = models.CharField(max_length=32, unique=True, blank=True, null=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='referrals')

    # 🔐 Two-Factor
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)

    #  लास्ट लॉगिन आईपी
    last_login_ip = models.GenericIPAddressField(null=True, blank=True) # Поле для IP последнего входа

    # Ограничение функционала после сброса 2FA
    functionality_limited_until = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.pk: # Generate referral code only for new users
            if not self.referral_code:
                self.referral_code = uuid.uuid4().hex[:10] # Consider a loop for very rare collisions
        super().save(*args, **kwargs)

    def get_totp_uri(self):
        if not self.two_factor_secret:
            return None
        # Ensure the username is URL-encoded if it can contain special characters
        username_encoded = quote(self.username)
        return f'otpauth://totp/Terminal7:{username_encoded}?secret={self.two_factor_secret}&issuer=Terminal7'

    def generate_2fa_secret(self):
        self.two_factor_secret = pyotp.random_base32()
        self.save(update_fields=['two_factor_secret']) # Only save the changed field

class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def __str__(self):
        return f"Verification for {self.user.username} - {self.code}"

class OneTimeCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=16) # Короткий, легко вводимый код
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField() # Время истечения срока действия кода
    is_used = models.BooleanField(default=False)
    purpose = models.CharField(max_length=50, default='2fa_reset') # Назначение кода

    def __str__(self):
        return f"OneTimeCode for {self.user.username} [{self.purpose}]"

class LoginHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    # Поля для GeoIP
    country = models.CharField(max_length=100, null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)

    class Meta:
        verbose_name_plural = "Login History"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} logged in at {self.timestamp} from {self.ip_address}"

class ActivityLog(models.Model):
    ACTION_TYPES = (
        ('USER_REGISTERED', 'User Registered'),
        ('USER_LOGGED_IN', 'User Logged In'),
        ('USER_LOGGED_OUT', 'User Logged Out'), # Если будете реализовывать logout
        ('PROFILE_UPDATED', 'Profile Updated'),
        ('PASSWORD_CHANGED', 'Password Changed'), # Если будет отдельный эндпоинт смены пароля
        ('EMAIL_VERIFIED', 'Email Verified'),
        ('2FA_ENABLED', '2FA Enabled'),
        ('2FA_DISABLED', '2FA Disabled'),
        ('2FA_RESET_REQUESTED', '2FA Reset Requested'),
        ('2FA_RESET_COMPLETED', '2FA Reset Completed'),
        # Добавьте другие типы по мере необходимости (DEPOSIT, WITHDRAWAL и т.д.)
    )

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    details = models.JSONField(null=True, blank=True) # Для хранения структурированных деталей
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    # user_agent = models.TextField(null=True, blank=True) # Можно добавить, если нужно

    class Meta:
        verbose_name_plural = "Activity Logs"
        ordering = ['-timestamp']

    def __str__(self):
        user_display = self.user.username if self.user else "System"
        return f"{user_display} - {self.get_action_type_display()} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

class TrustedDevice(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trusted_devices')
    
    # Основной идентификатор на основе cookie-токена
    device_token_hash = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
                                         
    user_agent = models.TextField(blank=True, null=True) # User-Agent на момент добавления/последнего обновления
    ip_address = models.GenericIPAddressField(null=True, blank=True) # IP на момент добавления/последнего обновления
    
    added_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name_plural = "Trusted Devices"
        ordering = ['-last_login_at', '-added_at']

    def __str__(self):
        token_part = f"TokenHash: {self.device_token_hash[:10]}..." if self.device_token_hash else "No Token"
        return f"Device for {self.user.username} ({token_part})"

    def set_new_token(self):
        """Генерирует новый уникальный токен, хеширует и сохраняет хеш."""
        token = secrets.token_urlsafe(32) # Генерируем безопасный токен
        self.device_token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
        return token # Возвращаем нехешированный токен для установки в cookie

class InvestmentStrategy(models.Model):
    name = models.CharField(max_length=100, unique=True, help_text="Human-readable name, e.g., 'Cross Arbitrage'")
    strategy_key = models.CharField(max_length=50, unique=True, db_index=True, help_text="Unique key used in code, e.g., 'cross_arbitrage'")
    api_prefix = models.CharField(max_length=100, unique=True, help_text="API URL prefix, e.g., '/api/investments/'")
    redis_channel = models.CharField(max_length=100, unique=True, blank=True, null=True, help_text="Redis channel for payouts, e.g., 'payouts_cross_arbitrage'")
    is_active = models.BooleanField(default=True, help_text="Whether this strategy is globally active")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Investment Strategy"
        verbose_name_plural = "Investment Strategies"
