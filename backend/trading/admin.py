from django.contrib import admin
from .models import TradeOffer

@admin.register(TradeOffer)
class TradeOfferAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'status', 'sender_gold', 'receiver_gold', 'created_at']
    list_filter = ['status']
