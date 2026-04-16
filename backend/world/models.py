from django.db import models
from django.contrib.auth.models import User


class PlayerWorldPosition(models.Model):
    """
    The last-known overworld position for each online player.
    Updated via WebSocket; used to broadcast positions to other players.
    """

    WORLD_TORLAND = 'torland'
    WORLD_ALEFGARD = 'alefgard'
    WORLD_MYSTARA = 'mystara'
    WORLD_HYRULE = 'hyrule'
    WORLD_CHOICES = [
        (WORLD_TORLAND, 'Torland'),
        (WORLD_ALEFGARD, 'Alefgard'),
        (WORLD_MYSTARA, 'Mystara'),
        (WORLD_HYRULE, 'Hyrule'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='world_position')
    world = models.CharField(max_length=20, choices=WORLD_CHOICES, default=WORLD_TORLAND)
    x = models.IntegerField(default=0)
    y = models.IntegerField(default=0)
    guild_name = models.CharField(max_length=100, blank=True)
    is_online = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} @ ({self.x},{self.y}) on {self.world}'


class DungeonInstance(models.Model):
    """
    A shared dungeon run that multiple premium players can join.
    Each instance is for a specific dungeon entrance on a specific world.
    """

    STATUS_OPEN = 'open'
    STATUS_FULL = 'full'
    STATUS_CLOSED = 'closed'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_FULL, 'Full'),
        (STATUS_CLOSED, 'Closed'),
    ]

    MAX_PARTIES = 4  # max 4 parties of 6 = 24 players per instance

    world = models.CharField(max_length=20, default='torland')
    entrance_x = models.IntegerField()
    entrance_y = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    floor_states = models.JSONField(default=dict)  # shared floor exploration state
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Dungeon @ ({self.entrance_x},{self.entrance_y}) [{self.status}]'


class DungeonParticipant(models.Model):
    """Links a player (user) to a DungeonInstance."""

    instance = models.ForeignKey(DungeonInstance, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dungeon_participations')
    floor = models.IntegerField(default=1)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('instance', 'user')
