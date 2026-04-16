from django.db import models
from django.contrib.auth.models import User


class SaveSlot(models.Model):
    """
    One save slot per user (slots 0-3, matching the client-side convention).
    The full game state is stored as JSON — characters, dungeon, overworld — 
    exactly mirroring the AppSaveState shape the Angular app already understands.
    """

    SLOT_AUTOSAVE = 0

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='save_slots')
    slot = models.PositiveSmallIntegerField(default=0)
    name = models.CharField(max_length=50, default='Auto Save')
    guild_state = models.JSONField(default=dict)
    dungeon_state = models.JSONField(null=True, blank=True)
    overworld_state = models.JSONField(null=True, blank=True)
    version = models.CharField(max_length=20, default='1.0.0')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'slot')
        ordering = ['slot']

    def __str__(self):
        return f'{self.user.username} / {self.name} (slot {self.slot})'
