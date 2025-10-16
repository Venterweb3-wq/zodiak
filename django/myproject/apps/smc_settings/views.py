from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import CmcFilterSettings, SmartMoneyStrategySettings
from .serializers import CmcFilterSettingsSerializer, SmartMoneyStrategySettingsSerializer

@api_view(['GET'])
def get_active_cmc_filters(request):
    active = CmcFilterSettings.objects.first()
    if active:
        return Response(CmcFilterSettingsSerializer(active).data)
    return Response({'error': 'No active filter config found'}, status=404)

@api_view(['GET'])
def get_active_smartmoney_strategy(request):
    active = SmartMoneyStrategySettings.objects.filter(enabled=True).first()
    if active:
        return Response(SmartMoneyStrategySettingsSerializer(active).data)
    return Response({'error': 'No active strategy config found'}, status=404) 