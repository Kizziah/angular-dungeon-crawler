from django.contrib import admin
from .models import PlayerWorldPosition, DungeonInstance, DungeonParticipant

admin.site.register(PlayerWorldPosition)
admin.site.register(DungeonInstance)
admin.site.register(DungeonParticipant)
