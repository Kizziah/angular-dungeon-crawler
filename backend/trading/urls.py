from django.urls import path
from . import views

urlpatterns = [
    path('', views.trades, name='trades'),
    path('<int:trade_id>/respond/', views.respond_trade, name='respond_trade'),
    path('<int:trade_id>/cancel/', views.cancel_trade, name='cancel_trade'),
]
