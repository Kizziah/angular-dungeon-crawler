from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/saves/', include('characters.urls')),
    path('api/world/', include('world.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/trades/', include('trading.urls')),
    path('api/leaderboard/', include('leaderboard.urls')),
]
