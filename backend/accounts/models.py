from django.db import models
from django.contrib.auth.models import User


class Subscription(models.Model):
    """Tracks a user's paid subscription status."""

    TIER_FREE = 'free'
    TIER_PREMIUM = 'premium'
    TIER_CHOICES = [(TIER_FREE, 'Free'), (TIER_PREMIUM, 'Premium')]

    STATUS_ACTIVE = 'active'
    STATUS_CANCELED = 'canceled'
    STATUS_PAST_DUE = 'past_due'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CANCELED, 'Canceled'),
        (STATUS_PAST_DUE, 'Past Due'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_FREE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_premium(self):
        return self.tier == self.TIER_PREMIUM and self.status == self.STATUS_ACTIVE

    def __str__(self):
        return f'{self.user.username} ({self.tier})'
