from django.urls import path
from . import views

urlpatterns = [
    path('players/', views.online_players, name='online_players'),
    path('dungeons/', views.dungeon_instances, name='dungeon_instances'),
    path('dungeons/<int:instance_id>/join/', views.join_dungeon, name='join_dungeon'),
]
