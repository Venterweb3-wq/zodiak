# admin.py 
from django.contrib import admin
from .models import (
    FlexibleInvestmentAccount, 
    FlexiblePayout, 
    FlexibleDeposit, 
    FlexibleWithdrawal,
    FlexibleTemporaryWallet
)

@admin.register(FlexibleTemporaryWallet)
class FlexibleTemporaryWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'network', 'address', 'status', 'detected_amount', 'created_at', 'expires_at', 'sweep_tx_id')
    list_filter = ('network', 'status', 'created_at')
    search_fields = ('user__username', 'user__email', 'address', 'sweep_tx_id')
    readonly_fields = ('created_at', 'updated_at', 'address', 'encrypted_private_key', 'detected_amount', 'sweep_tx_id', 'error_message')
    fieldsets = (
        ('General Information', {
            'fields': ('user', 'network', 'status')
        }),
        ('Wallet Details', {
            'fields': ('address', 'encrypted_private_key', 'detected_amount')
        }),
        ('Processing', {
            'fields': ('sweep_tx_id', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FlexibleInvestmentAccount)
class FlexibleInvestmentAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'network', 'balance', 'last_payout_time', 'created_at', 'updated_at')
    list_filter = ('network', 'created_at', 'last_payout_time')
    search_fields = ('user__username', 'user__email', 'network')
    readonly_fields = ('created_at', 'updated_at', 'last_payout_time')
    fieldsets = (
        (None, {
            'fields': ('user', 'network', 'balance')
        }),
        ('Timestamps', {
            'fields': ('last_payout_time', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(FlexiblePayout)
class FlexiblePayoutAdmin(admin.ModelAdmin):
    list_display = ('account_user', 'account_network', 'amount', 'timestamp')
    list_filter = ('timestamp', 'account__network')
    search_fields = ('account__user__username', 'account__user__email')
    readonly_fields = ('timestamp',)

    def account_user(self, obj):
        return obj.account.user.username
    account_user.short_description = 'User'

    def account_network(self, obj):
        return obj.account.get_network_display()
    account_network.short_description = 'Network'

@admin.register(FlexibleDeposit)
class FlexibleDepositAdmin(admin.ModelAdmin):
    list_display = ('account_user', 'account_network', 'amount', 'network', 'user_transaction_id', 'timestamp')
    list_filter = ('network', 'timestamp', 'account__network')
    search_fields = ('account__user__username', 'account__user__email', 'user_transaction_id')
    readonly_fields = ('timestamp',)

    def account_user(self, obj):
        return obj.account.user.username
    account_user.short_description = 'User'

    def account_network(self, obj):
        return obj.account.get_network_display()
    account_network.short_description = 'Account Network'

@admin.register(FlexibleWithdrawal)
class FlexibleWithdrawalAdmin(admin.ModelAdmin):
    list_display = (
        'account_user', 
        'account_network', 
        'amount_requested', 
        'commission', 
        'amount_received',
        'network', 
        'wallet_address', 
        'status', 
        'timestamp',
        'processed_at'
    )
    list_filter = ('status', 'network', 'timestamp', 'processed_at', 'account__network')
    search_fields = ('account__user__username', 'account__user__email', 'wallet_address', 'transaction_id')
    readonly_fields = ('timestamp', 'processed_at', 'amount_received')
    list_editable = ('status',)
    fieldsets = (
        ('Request Details', {
            'fields': ('account', 'amount_requested', 'commission', 'amount_received', 'network', 'wallet_address')
        }),
        ('Status & Processing', {
            'fields': ('status', 'transaction_id', 'notes')
        }),
        ('Timestamps', {
            'fields': ('timestamp', 'processed_at'),
            'classes': ('collapse',)
        }),
    )

    def account_user(self, obj):
        return obj.account.user.username
    account_user.short_description = 'User'

    def account_network(self, obj):
        return obj.account.get_network_display()
    account_network.short_description = 'Account Network' 