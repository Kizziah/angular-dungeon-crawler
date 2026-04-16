from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('refresh/', views.refresh_token, name='token_refresh'),
    path('logout/', views.logout, name='logout'),
    path('me/', views.me, name='me'),
    path('billing/subscribe/', views.create_checkout_session, name='checkout'),
    path('billing/cancel/', views.cancel_subscription, name='cancel_sub'),
    path('billing/webhook/', views.stripe_webhook, name='stripe_webhook'),
]
