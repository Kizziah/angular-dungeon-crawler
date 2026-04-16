from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Subscription


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        Subscription.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    is_premium = serializers.SerializerMethodField()
    subscription_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_premium', 'subscription_status']

    def get_is_premium(self, obj):
        sub = getattr(obj, 'subscription', None)
        return sub.is_premium if sub else False

    def get_subscription_status(self, obj):
        sub = getattr(obj, 'subscription', None)
        return sub.tier if sub else 'free'
