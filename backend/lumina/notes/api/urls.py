from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotesViewSet, NoteGroupViewSet

router = DefaultRouter()
router.register(r'notes', NotesViewSet, basename='notes')
router.register(r'groups', NoteGroupViewSet, basename='groups')

urlpatterns = [
    path('', include(router.urls)),
]