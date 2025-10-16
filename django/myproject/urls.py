from django.contrib import admin
from django.urls import path, include
from myproject.apps.bot_gateway import urls as bot_gateway_urls
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # --- Default Admin ---
    path('admin/', admin.site.urls),
    
    # Core services
    path('api/auth/', include('myproject.apps.core.urls')),
    path('api/referrals/', include('myproject.apps.referrals.urls')),
    path('', include('myproject.apps.smc_settings.urls')),
    
    # Investment Tools (Clones)
    path('api/cross-arbitrage/', include('myproject.apps.cross_arbitrage.urls')),
    path('api/spot-scalping/', include('myproject.apps.spot_scalping.urls')),
    path('api/inter-exchange/', include('myproject.apps.inter_exchange.urls')),
    path('api/defi-bot/', include('myproject.apps.defi_bot.urls')),
    
    # Investment Tools (Unique)
    path('api/flexible/', include('myproject.apps.flexible_arbitrage.urls')),

    # Bot Gateway APIs
    # Public APIs (e.g., /api/bot-gateway/cross_arbitrage/stats/)
    path('api/bot-gateway/', include('myproject.apps.bot_gateway.urls')),
    # Internal APIs for bots (e.g., /api/internal/bot-gateway/report/trade/)
    path('api/internal/bot-gateway/', include(bot_gateway_urls.internal_patterns)),
    
    path('metrics/', include('django_prometheus.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
