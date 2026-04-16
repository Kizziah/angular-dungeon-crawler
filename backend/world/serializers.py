from rest_framework import serializers
from .models import PlayerWorldPosition, DungeonInstance, DungeonParticipant


class PlayerPositionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = PlayerWorldPosition
        fields = ['username', 'world', 'x', 'y', 'guild_name', 'is_online', 'updated_at']


class DungeonInstanceSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = DungeonInstance
        fields = ['id', 'world', 'entrance_x', 'entrance_y', 'status', 'participant_count', 'created_at']

    def get_participant_count(self, obj):
        return obj.participants.count()
