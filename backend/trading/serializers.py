from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TradeOffer


class TradeOfferSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    receiver_username = serializers.CharField(source='receiver.username', read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)

    class Meta:
        model = TradeOffer
        fields = [
            'id', 'sender_username', 'receiver_username', 'receiver',
            'sender_gold', 'receiver_gold',
            'sender_items', 'receiver_items',
            'status', 'message', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sender_username', 'receiver_username', 'status', 'created_at', 'updated_at']
