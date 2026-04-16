from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SaveSlot
from .serializers import SaveSlotSerializer, SaveSlotListSerializer
from accounts.models import Subscription


def _require_premium(user):
    sub = getattr(user, 'subscription', None)
    return sub and sub.is_premium


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_saves(request):
    if not _require_premium(request.user):
        return Response({'error': 'Premium subscription required'}, status=403)
    slots = SaveSlot.objects.filter(user=request.user)
    return Response(SaveSlotListSerializer(slots, many=True).data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def save_detail(request, slot):
    if not _require_premium(request.user):
        return Response({'error': 'Premium subscription required'}, status=403)
    if slot not in range(4):
        return Response({'error': 'Slot must be 0-3'}, status=400)

    if request.method == 'GET':
        try:
            save = SaveSlot.objects.get(user=request.user, slot=slot)
            return Response(SaveSlotSerializer(save).data)
        except SaveSlot.DoesNotExist:
            return Response({'exists': False}, status=404)

    # PUT — create or overwrite
    name = 'Auto Save' if slot == 0 else f'Slot {slot}'
    save, _ = SaveSlot.objects.get_or_create(user=request.user, slot=slot, defaults={'name': name})
    serializer = SaveSlotSerializer(save, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_save(request, slot):
    if not _require_premium(request.user):
        return Response({'error': 'Premium subscription required'}, status=403)
    SaveSlot.objects.filter(user=request.user, slot=slot).delete()
    return Response(status=204)
