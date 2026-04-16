from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatRoom, ChatMessage
from .serializers import ChatMessageSerializer


def _require_premium(user):
    sub = getattr(user, 'subscription', None)
    return sub and sub.is_premium


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def room_history(request, room_name):
    """Return the last 100 messages from a room."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)
    try:
        room = ChatRoom.objects.get(name=room_name)
    except ChatRoom.DoesNotExist:
        return Response([])
    messages = room.messages.order_by('-created_at')[:100]
    return Response(ChatMessageSerializer(reversed(list(messages)), many=True).data)
