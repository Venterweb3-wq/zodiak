from rest_framework import serializers
from django.utils import timezone
from django.db.models import Sum, Count
from decimal import Decimal

from .models import InvestmentTool, ReferralSettings
from myproject.apps.core.models import User

class ReferralDashboardSerializer(serializers.Serializer):
    """
    Сериализатор для сборки данных для реферального дашборда.
    Не привязан к модели, собирает данные на лету.
    """
    partners_total_count = serializers.SerializerMethodField()
    partners_level_1_count = serializers.SerializerMethodField()
    partners_level_2_count = serializers.SerializerMethodField()
    
    structure_volume = serializers.SerializerMethodField()
    structure_income_usdt = serializers.SerializerMethodField()
    structure_income_percent = serializers.SerializerMethodField()
    
    next_accrual_timestamp = serializers.SerializerMethodField()
    
    investment_tools = serializers.SerializerMethodField()

    def get_partners_level_1_count(self, user):
        return User.objects.filter(referred_by=user).count()

    def get_partners_level_2_count(self, user):
        level_1_referrals = User.objects.filter(referred_by=user)
        return User.objects.filter(referred_by__in=level_1_referrals).count()

    def get_partners_total_count(self, user):
        # Количество партнеров не зависит от инструмента, оно общее
        return self.get_partners_level_1_count(user) + self.get_partners_level_2_count(user)

    def get_structure_volume(self, user):
        tool_key = self.context.get('tool_key')
        accruals = user.referral_bonuses.all()
        if tool_key:
            accruals = accruals.filter(investment_tool__strategy_key=tool_key)
        
        volume = accruals.aggregate(total=Sum('source_profit_amount'))['total']
        return volume or Decimal('0.00')
        
    def get_structure_income_usdt(self, user):
        tool_key = self.context.get('tool_key')
        accruals = user.referral_bonuses.all()
        if tool_key:
            accruals = accruals.filter(investment_tool__strategy_key=tool_key)

        income = accruals.aggregate(total=Sum('amount'))['total']
        return income or Decimal('0.00')

    def get_structure_income_percent(self, user):
        """Получить процент дохода из настроек реферальной программы."""
        settings_obj = ReferralSettings.get_active_settings()
        # Возвращаем общий процент (L1 + L2)
        total_percent = settings_obj.level_1_percent + settings_obj.level_2_percent
        return total_percent * 100  # Конвертируем в проценты для отображения

    def get_next_accrual_timestamp(self, user):
        # Получаем интервал из настроек
        settings_obj = ReferralSettings.get_active_settings()
        now = timezone.now()
        
        # Вычисляем следующее время начисления на основе интервала
        hours_until_next = settings_obj.accrual_interval_hours - (now.hour % settings_obj.accrual_interval_hours)
        if hours_until_next == settings_obj.accrual_interval_hours:
            hours_until_next = 0
        
        next_run = now.replace(minute=0, second=0, microsecond=0) + timezone.timedelta(hours=hours_until_next)
        return next_run

    def get_investment_tools(self, user):
        tools = InvestmentTool.objects.all()
        return InvestmentToolSerializer(tools, many=True).data

class InvestmentToolSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentTool
        fields = ['name', 'is_active']
