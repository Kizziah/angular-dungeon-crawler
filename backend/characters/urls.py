from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_saves, name='list_saves'),
    path('<int:slot>/', views.save_detail, name='save_detail'),
    path('<int:slot>/delete/', views.delete_save, name='delete_save'),
]
