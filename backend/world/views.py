from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PlayerWorldPosition, DungeonInstance, DungeonParticipant
from .serializers import PlayerPositionSerializer, DungeonInstanceSerializer


def _require_premium(user):
    sub = getattr(user, 'subscription', None)
    return sub and sub.is_premium


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def online_players(request):
    """Return all online premium players on a given world."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)
    world = request.query_params.get('world', 'torland')
    positions = PlayerWorldPosition.objects.filter(world=world, is_online=True).select_related('user')
    return Response(PlayerPositionSerializer(positions, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def dungeon_instances(request):
    """List open dungeon instances or create a new one."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)

    if request.method == 'GET':
        world = request.query_params.get('world', 'torland')
        instances = DungeonInstance.objects.filter(world=world, status=DungeonInstance.STATUS_OPEN)
        return Response(DungeonInstanceSerializer(instances, many=True).data)

    world = request.data.get('world', 'torland')
    x = request.data.get('entrance_x', 0)
    y = request.data.get('entrance_y', 0)
    instance = DungeonInstance.objects.create(world=world, entrance_x=x, entrance_y=y)
    DungeonParticipant.objects.create(instance=instance, user=request.user)
    return Response(DungeonInstanceSerializer(instance).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_dungeon(request, instance_id):
    """Join an existing dungeon instance."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)
    try:
        instance = DungeonInstance.objects.get(pk=instance_id, status=DungeonInstance.STATUS_OPEN)
    except DungeonInstance.DoesNotExist:
        return Response({'error': 'Instance not found or closed'}, status=404)

    if instance.participants.count() >= DungeonInstance.MAX_PARTIES:
        instance.status = DungeonInstance.STATUS_FULL
        instance.save()
        return Response({'error': 'Instance is full'}, status=409)

    DungeonParticipant.objects.get_or_create(instance=instance, user=request.user)
    return Response(DungeonInstanceSerializer(instance).data)
