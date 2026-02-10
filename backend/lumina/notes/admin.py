from django.contrib import admin
from .models import Notes

# Register your models here.
@admin.register(Notes)
class NotesAdmin(admin.ModelAdmin):
    list_display = ('title', 'text', 'created_at', 'user')
    list_filter = ('title', 'created_at')
    search_fields = ('title', 'text')