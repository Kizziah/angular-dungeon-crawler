from django.urls import path
from . import views

urlpatterns = [
    path('characters/', views.top_characters, name='top_characters'),
    path('guilds/', views.top_guilds, name='top_guilds'),
]
