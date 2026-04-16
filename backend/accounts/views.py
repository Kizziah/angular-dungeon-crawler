import stripe
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import Subscription
from .serializers import RegisterSerializer, UserSerializer


def _set_refresh_cookie(response, refresh_token: str) -> None:
    """Attach the refresh token as an HttpOnly cookie."""
    response.set_cookie(
        key=settings.AUTH_COOKIE,
        value=refresh_token,
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path=settings.AUTH_COOKIE_PATH,
        max_age=60 * 60 * 24 * 30,  # 30 days
    )


def _clear_refresh_cookie(response) -> None:
    response.delete_cookie(settings.AUTH_COOKIE, path=settings.AUTH_COOKIE_PATH)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
        _set_refresh_cookie(response, str(refresh))
        return response
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')
    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    response = Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
    })
    _set_refresh_cookie(response, str(refresh))
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Exchange the HttpOnly refresh cookie for a new access token."""
    token_str = request.COOKIES.get(settings.AUTH_COOKIE)
    if not token_str:
        return Response({'error': 'No refresh token'}, status=401)
    try:
        token = RefreshToken(token_str)
        new_access = str(token.access_token)
        response = Response({'access': new_access})
        # Rotate refresh token
        token.blacklist() if hasattr(token, 'blacklist') else None
        new_refresh = RefreshToken.for_user(token.payload.get('user_id'))
        _set_refresh_cookie(response, str(new_refresh))
        return response
    except TokenError:
        return Response({'error': 'Invalid or expired refresh token'}, status=401)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout(request):
    response = Response({'detail': 'Logged out'})
    _clear_refresh_cookie(response)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Creates a Stripe Checkout session for the premium subscription."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    if not settings.STRIPE_SECRET_KEY:
        return Response({'error': 'Stripe not configured'}, status=503)

    sub, _ = Subscription.objects.get_or_create(user=request.user)

    if not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=request.user.email,
            metadata={'user_id': request.user.id},
        )
        sub.stripe_customer_id = customer.id
        sub.save()

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        mode='subscription',
        line_items=[{'price': settings.STRIPE_PRICE_ID, 'quantity': 1}],
        success_url=request.data.get('success_url', 'http://localhost:4200/#/guild?upgraded=1'),
        cancel_url=request.data.get('cancel_url', 'http://localhost:4200/#/guild'),
    )
    return Response({'checkout_url': session.url})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    sub = getattr(request.user, 'subscription', None)
    if not sub or not sub.stripe_subscription_id:
        return Response({'error': 'No active subscription'}, status=400)
    stripe.Subscription.modify(sub.stripe_subscription_id, cancel_at_period_end=True)
    sub.status = Subscription.STATUS_CANCELED
    sub.save()
    return Response({'detail': 'Subscription will cancel at period end.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return Response(status=400)

    data = event['data']['object']
    if event['type'] == 'checkout.session.completed':
        _handle_checkout_completed(data)
    elif event['type'] in ('invoice.paid', 'customer.subscription.updated'):
        _handle_subscription_updated(data)
    elif event['type'] == 'customer.subscription.deleted':
        _handle_subscription_deleted(data)
    return Response({'received': True})


def _handle_checkout_completed(session):
    customer_id = session.get('customer')
    subscription_id = session.get('subscription')
    try:
        sub = Subscription.objects.get(stripe_customer_id=customer_id)
        sub.stripe_subscription_id = subscription_id
        sub.tier = Subscription.TIER_PREMIUM
        sub.status = Subscription.STATUS_ACTIVE
        sub.save()
    except Subscription.DoesNotExist:
        pass


def _handle_subscription_updated(data):
    subscription_id = data.get('id') or data.get('subscription')
    try:
        sub = Subscription.objects.get(stripe_subscription_id=subscription_id)
        sub.status = Subscription.STATUS_ACTIVE
        if data.get('current_period_end'):
            sub.current_period_end = timezone.datetime.fromtimestamp(
                data['current_period_end'], tz=timezone.utc
            )
        sub.save()
    except Subscription.DoesNotExist:
        pass


def _handle_subscription_deleted(data):
    try:
        sub = Subscription.objects.get(stripe_subscription_id=data['id'])
        sub.tier = Subscription.TIER_FREE
        sub.status = Subscription.STATUS_CANCELED
        sub.save()
    except Subscription.DoesNotExist:
        pass
