import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.
    Connect to /ws/chat/<room_name>/
    Rooms: 'global', 'dungeon-<id>', 'guild-<name>'
    """

    async def connect(self):
        if not await self._is_premium():
            await self.close(code=4003)
            return

        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Send last 100 messages as history on connect
        history = await self._get_history()
        await self.send(text_data=json.dumps({'type': 'history', 'messages': history}))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get('type') == 'message':
            content = str(data.get('content', '')).strip()[:500]
            if not content:
                return
            msg = await self._save_message(content)
            await self.channel_layer.group_send(
                self.group_name,
                {
                    'type': 'chat_message',
                    'id': msg['id'],
                    'username': msg['username'],
                    'content': msg['content'],
                    'created_at': msg['created_at'],
                },
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'message', **event}))

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _is_premium(self):
        user = self.scope.get('user')
        if not user or isinstance(user, AnonymousUser):
            return False
        sub = getattr(user, 'subscription', None)
        return sub.is_premium if sub else False

    @database_sync_to_async
    def _save_message(self, content):
        from chat.models import ChatRoom, ChatMessage
        user = self.scope['user']
        room, _ = ChatRoom.objects.get_or_create(name=self.room_name)
        msg = ChatMessage.objects.create(room=room, user=user, username=user.username, content=content)
        return {'id': msg.id, 'username': msg.username, 'content': msg.content, 'created_at': msg.created_at.isoformat()}

    @database_sync_to_async
    def _get_history(self):
        from chat.models import ChatRoom, ChatMessage
        try:
            room = ChatRoom.objects.get(name=self.room_name)
            msgs = list(room.messages.order_by('-created_at')[:100])
            return [{'id': m.id, 'username': m.username, 'content': m.content, 'created_at': m.created_at.isoformat()} for m in reversed(msgs)]
        except ChatRoom.DoesNotExist:
            return []
