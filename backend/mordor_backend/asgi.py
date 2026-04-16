import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mordor_backend.settings')

django_asgi_app = get_asgi_application()

from world.routing import websocket_urlpatterns as world_ws
from chat.routing import websocket_urlpatterns as chat_ws

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(world_ws + chat_ws)
        )
    ),
})
