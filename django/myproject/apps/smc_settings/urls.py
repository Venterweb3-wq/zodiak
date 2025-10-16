from django.urls import path
from .views import get_active_cmc_filters, get_active_smartmoney_strategy
 
urlpatterns = [
    path('api/smc/cmc-filters/active/', get_active_cmc_filters, name='active_cmc_filters'),
    path('api/smc/strategy/active/', get_active_smartmoney_strategy, name='active_smartmoney_strategy'),
] 