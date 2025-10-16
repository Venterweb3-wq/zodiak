from rest_framework import serializers
from .models import CmcFilterSettings, SmartMoneyStrategySettings

class CmcFilterSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CmcFilterSettings
        fields = '__all__'

class SmartMoneyStrategySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartMoneyStrategySettings
        fields = '__all__' 