from django.contrib import admin
from .models import (
    InvestmentAccount,
    InvestmentDeposit,
    DailyPayout,
    TemporaryWallet,
    InvestmentConfig,
    WithdrawalRequest
)


@admin.register(InvestmentAccount)
class InvestmentAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'network', 'balance', 'activated', 'target_wallet', 'target_wallet_network', 'is_locked')
    list_filter = ('activated', 'network', 'target_wallet_network')
    search_fields = ('user__username', 'user__email', 'target_wallet')
    readonly_fields = ('activation_date',)
    list_editable = ('balance', 'activated')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(InvestmentDeposit)
class InvestmentDepositAdmin(admin.ModelAdmin):
    list_display = ('account', 'amount', 'tx_hash', 'created_at')
    search_fields = ('tx_hash', 'account__user__username')
    list_filter = ('created_at',)


@admin.register(DailyPayout)
class DailyPayoutAdmin(admin.ModelAdmin):
    list_display = ('account', 'date', 'amount', 'success', 'tx_hash')
    list_filter = ('success', 'date')
    search_fields = ('tx_hash', 'account__user__username')
    ordering = ('-date',)


@admin.register(TemporaryWallet)
class TemporaryWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'address', 'network', 'status', 'created_at', 'updated_at', 'expires_at')
    list_filter = ('network', 'status', 'created_at', 'expires_at')
    search_fields = ('address', 'user__username', 'deposit_tx_hash', 'sweep_tx_hash')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'encrypted_private_key')
    fieldsets = (
        (None, {
            'fields': (('user', 'network', 'status'), 'address')
        }),
        ('Wallet Data', {
            'fields': ('encrypted_private_key', 'detected_amount')
        }),
        ('Transaction Hashes', {
            'classes': ('collapse',),
            'fields': ('deposit_tx_hash', 'sweep_preparation_tx_hash', 'sweep_tx_hash')
        }),
        ('Timestamps & Error', {
            'fields': ('created_at', 'updated_at', 'expires_at', 'error_message')
        }),
    )


@admin.register(InvestmentConfig)
class InvestmentConfigAdmin(admin.ModelAdmin):
    list_display = ('strategy', 'payout_rate', 'lock_days', 'min_deposit', 'is_active', 'updated_at')
    list_editable = ('payout_rate', 'lock_days', 'min_deposit', 'is_active')
    ordering = ('-updated_at',)
    search_fields = ('strategy',)


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'account_user_link', 'amount', 'network', 'target_wallet', 'status', 'tx_hash', 'requested_at', 'processed_at')
    list_filter = ('status', 'network', 'requested_at')
    search_fields = ('account__user__username', 'target_wallet', 'tx_hash', 'id')
    ordering = ('-requested_at',)
    list_display_links = ('id', 'account_user_link')

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.only(
            'id', 'account', 'amount', 'network', 'target_wallet', 
            'status', 'tx_hash', 'requested_at', 'processed_at'
        ).select_related('account__user')

    def account_user_link(self, obj):
        if obj.account and obj.account.user:
            return obj.account.user.username
        return "-"
    account_user_link.short_description = 'User (Account)'

    fieldsets = (
        (None, {
            'fields': ('account', ('amount', 'network'), 'target_wallet')
        }),
        ('Processing Details', {
            'fields': ('status', 'tx_hash')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'processed_at')
        }),
    )
    readonly_fields = ('requested_at', 'processed_at', 'account')
