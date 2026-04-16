import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class WorldConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time overworld player positions.
    Clients connect to /ws/world/<world>/ and receive broadcasts
    whenever any player on that world moves.
    """

    async def connect(self):
        if not await self._is_premium():
            await self.close(code=4003)
            return

        self.world = self.scope['url_route']['kwargs']['world']
        self.group_name = f'world_{self.world}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Mark player online and broadcast current position
        await self._set_online(True)
        await self._broadcast_position()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self._set_online(False)
            await self._broadcast_position()
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """Receive a position update: {x, y, guild_name}"""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get('type') == 'move':
            await self._update_position(
                data.get('x', 0),
                data.get('y', 0),
                data.get('guild_name', ''),
            )
            await self._broadcast_position()

    async def player_position(self, event):
        """Relay group broadcast to WebSocket client."""
        await self.send(text_data=json.dumps(event))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _is_premium(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser):
            return False
        sub = getattr(user, 'subscription', None)
        return sub.is_premium if sub else False

    @database_sync_to_async
    def _set_online(self, online):
        from world.models import PlayerWorldPosition
        user = self.scope['user']
        pos, _ = PlayerWorldPosition.objects.get_or_create(user=user, defaults={'world': self.world})
        pos.is_online = online
        pos.world = self.world
        pos.save()

    @database_sync_to_async
    def _update_position(self, x, y, guild_name):
        from world.models import PlayerWorldPosition
        user = self.scope['user']
        PlayerWorldPosition.objects.filter(user=user).update(x=x, y=y, guild_name=guild_name)

    @database_sync_to_async
    def _get_position(self):
        from world.models import PlayerWorldPosition
        user = self.scope['user']
        try:
            pos = PlayerWorldPosition.objects.get(user=user)
            return {'username': user.username, 'x': pos.x, 'y': pos.y, 'guild_name': pos.guild_name, 'is_online': pos.is_online}
        except PlayerWorldPosition.DoesNotExist:
            return {'username': user.username, 'x': 0, 'y': 0, 'guild_name': '', 'is_online': False}

    async def _broadcast_position(self):
        pos = await self._get_position()
        await self.channel_layer.group_send(
            self.group_name,
            {'type': 'player_position', 'world': self.world, **pos},
        )
