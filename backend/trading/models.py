from django.db import models
from django.contrib.auth.models import User


class TradeOffer(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_CANCELED = 'canceled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_CANCELED, 'Canceled'),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_trades')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_trades')
    sender_gold = models.IntegerField(default=0)
    receiver_gold = models.IntegerField(default=0)
    # Items are stored as JSON snapshots of the Angular Item objects
    sender_items = models.JSONField(default=list)
    receiver_items = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    message = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Trade {self.sender} → {self.receiver} [{self.status}]'
