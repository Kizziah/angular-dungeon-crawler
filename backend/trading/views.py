from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import TradeOffer
from .serializers import TradeOfferSerializer


def _require_premium(user):
    sub = getattr(user, 'subscription', None)
    return sub and sub.is_premium


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def trades(request):
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)

    if request.method == 'GET':
        qs = TradeOffer.objects.filter(
            receiver=request.user, status=TradeOffer.STATUS_PENDING
        ).select_related('sender', 'receiver')
        return Response(TradeOfferSerializer(qs, many=True).data)

    # POST — create a new offer
    serializer = TradeOfferSerializer(data=request.data)
    if serializer.is_valid():
        receiver = serializer.validated_data['receiver']
        if not _require_premium(receiver):
            return Response({'error': 'Receiver is not a premium player'}, status=400)
        serializer.save(sender=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_trade(request, trade_id):
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)
    try:
        trade = TradeOffer.objects.get(pk=trade_id, receiver=request.user, status=TradeOffer.STATUS_PENDING)
    except TradeOffer.DoesNotExist:
        return Response({'error': 'Trade not found'}, status=404)

    action = request.data.get('action')
    if action == 'accept':
        trade.status = TradeOffer.STATUS_ACCEPTED
    elif action == 'decline':
        trade.status = TradeOffer.STATUS_DECLINED
    else:
        return Response({'error': 'action must be accept or decline'}, status=400)
    trade.save()
    return Response(TradeOfferSerializer(trade).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_trade(request, trade_id):
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)
    try:
        trade = TradeOffer.objects.get(pk=trade_id, sender=request.user, status=TradeOffer.STATUS_PENDING)
    except TradeOffer.DoesNotExist:
        return Response({'error': 'Trade not found'}, status=404)
    trade.status = TradeOffer.STATUS_CANCELED
    trade.save()
    return Response(status=204)
