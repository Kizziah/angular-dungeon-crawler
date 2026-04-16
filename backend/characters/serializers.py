from rest_framework import serializers
from .models import SaveSlot


class SaveSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaveSlot
        fields = [
            'id', 'slot', 'name',
            'guild_state', 'dungeon_state', 'overworld_state',
            'version', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class SaveSlotListSerializer(serializers.ModelSerializer):
    """Lightweight list view — omits heavy JSON blobs."""
    class Meta:
        model = SaveSlot
        fields = ['id', 'slot', 'name', 'version', 'updated_at']
