from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import InvestmentTool, ReferralAccrual, ReferralSettings

@admin.register(ReferralSettings)
class ReferralSettingsAdmin(admin.ModelAdmin):
    list_display = ('level_1_percent', 'level_2_percent', 'accrual_interval_hours', 'is_active', 'updated_at')
    list_editable = ('is_active',)
    fields = ('level_1_percent', 'level_2_percent', 'accrual_interval_hours', 'is_active')
    
    def has_add_permission(self, request):
        # Разрешаем создание только если нет активных настроек
        return not ReferralSettings.objects.filter(is_active=True).exists()

@admin.register(InvestmentTool)
class InvestmentToolAdmin(admin.ModelAdmin):
    list_display = ('name', 'strategy_key', 'is_active')
    list_editable = ('is_active',)

@admin.register(ReferralAccrual)
class ReferralAccrualAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'source_user', 'level', 'investment_tool', 'amount', 'source_model', 'source_object_id', 'created_at')
    list_filter = ('level', 'investment_tool', 'created_at', 'source_model')
    search_fields = ('recipient__username', 'source_user__username', 'source_object_id')
    readonly_fields = ('recipient', 'source_user', 'level', 'investment_tool', 'amount', 'source_profit_amount', 'percentage', 'source_model', 'source_object_id', 'created_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

# Кастомный AdminSite для реферальной программы
class ReferralAdminSite(admin.AdminSite):
    site_header = "Реферальная программа"
    site_title = "Рефералы"
    index_title = "Управление реферальной программой"

    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context.update({
            'referral_dashboard_url': reverse('referrals:dashboard'),
            'investment_tools_url': reverse('admin:referrals_investmenttool_changelist'),
            'referral_accruals_url': reverse('admin:referrals_referralaccrual_changelist'),
            'referral_settings_url': reverse('admin:referrals_referralsettings_changelist'),
        })
        return super().index(request, extra_context)

# Создаем экземпляр кастомного AdminSite
referral_admin_site = ReferralAdminSite(name='referral_admin')

# Регистрируем модели в кастомном AdminSite
referral_admin_site.register(ReferralSettings, ReferralSettingsAdmin)
referral_admin_site.register(InvestmentTool, InvestmentToolAdmin)
referral_admin_site.register(ReferralAccrual, ReferralAccrualAdmin)
