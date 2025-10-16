from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, OneTimeCode, LoginHistory, ActivityLog, TrustedDevice, EmailVerification, InvestmentStrategy

@admin.register(InvestmentStrategy)
class InvestmentStrategyAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_key', 'api_prefix', 'redis_channel', 'is_active')
    list_editable = ('is_active',)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('username', 'email', 'email_verified', 'is_active', 'referral_code', 'referred_by', 'last_login_ip', 'functionality_limited_until')
    list_filter = ('is_active', 'email_verified', 'date_joined', 'last_login')
    search_fields = ('username', 'email', 'referral_code')
    readonly_fields = ('date_joined', 'last_login', 'last_login_ip')
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('email_verified', 'referral_code', 'referred_by', 'marketing_optin', 'last_login_ip', 'functionality_limited_until')}),
    )

@admin.register(OneTimeCode)
class OneTimeCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'code', 'created_at', 'expires_at', 'is_used')
    list_filter = ('purpose', 'is_used', 'created_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at',)

@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'ip_address', 'user_agent', 'country', 'city')
    list_filter = ('timestamp', 'country', 'city')
    search_fields = ('user__username', 'ip_address', 'user_agent', 'country', 'city')
    readonly_fields = ('timestamp',)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'action_type', 'details', 'ip_address')
    list_filter = ('action_type', 'timestamp')
    search_fields = ('user__username', 'action_type', 'details', 'ip_address')
    readonly_fields = ('timestamp',)

@admin.register(TrustedDevice)
class TrustedDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'device_token_hash', 'ip_address', 'added_at', 'last_login_at')
    list_filter = ('added_at', 'last_login_at')
    search_fields = ('user__username', 'device_token_hash')
    readonly_fields = ('added_at', 'last_login_at', 'device_token_hash', 'user', 'ip_address', 'user_agent')

@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'is_used')
    list_filter = ('is_used', 'created_at')
    search_fields = ('user__username', 'user__email', 'code')
    readonly_fields = ('created_at',)
