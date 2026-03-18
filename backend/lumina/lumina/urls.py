"""
URL configuration for lumina project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    # Админка
    path('admin/', admin.site.urls),
    
    # Пользователи (пока оставляем старую версию)
    path('api/users/', include('users.urls')),
    
    # Новая архитектура для заметок (теперь на основном пути)
    path('api/', include('notes.api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)