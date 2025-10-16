from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class ReferralSettings(models.Model):
    """Настройки реферальной программы."""
    level_1_percent = models.DecimalField(max_digits=5, decimal_places=4, default=0.07, help_text=_("Процент для рефералов 1-го уровня (7%)"))
    level_2_percent = models.DecimalField(max_digits=5, decimal_places=4, default=0.03, help_text=_("Процент для рефералов 2-го уровня (3%)"))
    accrual_interval_hours = models.PositiveIntegerField(default=12, help_text=_("Интервал начислений в часах"))
    is_active = models.BooleanField(default=True, help_text=_("Активна ли реферальная программа"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Настройки реферальной программы")
        verbose_name_plural = _("Настройки реферальной программы")

    def __str__(self):
        return f"Referral Settings: L1={self.level_1_percent}%, L2={self.level_2_percent}%"

    @classmethod
    def get_active_settings(cls):
        """Получить активные настройки реферальной программы."""
        settings_obj, created = cls.objects.get_or_create(
            is_active=True,
            defaults={
                'level_1_percent': 0.07,
                'level_2_percent': 0.03,
                'accrual_interval_hours': 12
            }
        )
        return settings_obj

class InvestmentTool(models.Model):
    """Модель для управления инвестиционными инструментами."""
    name = models.CharField(max_length=100, unique=True, help_text=_("e.g., Cross Arbitrage, Flexible Arbitrage"))
    strategy_key = models.CharField(max_length=50, unique=True, db_index=True, help_text=_("Key used in code, e.g., 'cross_arbitrage'"))
    is_active = models.BooleanField(default=True, help_text=_("Whether this tool is active for accruals"))

    def __str__(self):
        return self.name

class ReferralAccrual(models.Model):
    """Модель для хранения истории начислений реферальных бонусов."""
    id = models.BigAutoField(primary_key=True)
    
    # Тот, кто получает бонус
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='referral_bonuses'
    )
    # Тот, от чьей прибыли был получен бонус
    source_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='generated_referral_income'
    )
    # Уровень реферала (1-я или 2-я линия)
    level = models.PositiveSmallIntegerField(choices=[(1, 'Level 1'), (2, 'Level 2')])
    
    # Инструмент, по которому была получена прибыль
    investment_tool = models.ForeignKey(InvestmentTool, on_delete=models.PROTECT)
    
    # Сумма бонуса
    amount = models.DecimalField(max_digits=20, decimal_places=8)
    
    # Исходная прибыль, от которой был рассчитан бонус
    source_profit_amount = models.DecimalField(max_digits=20, decimal_places=8)
    
    # Процент, по которому был расчет
    percentage = models.DecimalField(max_digits=5, decimal_places=4)
    
    # Дата начисления
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Поля для идемпотентности
    source_model = models.CharField(max_length=100, default='unknown', help_text=_("Model name of the profit source (e.g., 'flexible_arbitrage.FlexiblePayout')"))
    source_object_id = models.CharField(max_length=50, default='0', help_text=_("ID of the specific profit record"))

    def __str__(self):
        return f"Bonus to {self.recipient.username} from {self.source_user.username} (Level {self.level}) - {self.amount}"

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'created_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['recipient', 'level', 'investment_tool', 'source_model', 'source_object_id'],
                name='unique_referral_accrual'
            )
        ]
