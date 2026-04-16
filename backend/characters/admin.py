from django.contrib import admin
from .models import SaveSlot

@admin.register(SaveSlot)
class SaveSlotAdmin(admin.ModelAdmin):
    list_display = ['user', 'slot', 'name', 'version', 'updated_at']
    list_filter = ['slot']
