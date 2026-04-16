from django.db import models
from django.contrib.auth.models import User


class ChatRoom(models.Model):
    """
    A named chat channel.  Rooms are auto-created on first message.
    Built-in rooms: 'global', 'dungeon-<instance_id>', 'guild-<guild_name>'
    """

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='chat_messages')
    username = models.CharField(max_length=150)  # snapshot in case user is deleted
    content = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'[{self.room.name}] {self.username}: {self.content[:40]}'
