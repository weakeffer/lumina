from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Max
from django.utils import timezone
from datetime import timedelta

from .models import Notes
from .serializers import (NoteCreateSerializer, NoteDetailSerializer, NoteListSerializer, NoteSerializer, NoteStatisticsSerializer, NoteUpdateSerializer)

class NotesViewSet(viewsets.ModelViewSet):
    permission_classes = []
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Notes.objects.none()
        return Notes.objects.filter(user = self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NoteCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return NoteUpdateSerializer
        elif self.action == 'list':
            return NoteListSerializer
        elif self.action == 'retrieve':
            return NoteDetailSerializer
        return NoteDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(user = self.request.user)

    @action(detail = False, methods=['get'], url_path = 'statistics')
    def statistics(self, request):
        user_notes = self.get_queryset()

        stats = {
            'total_notes' : user_notes.count(),
            'last_created' : user_notes.aggregate(last = Max('created_at'))['last']
        }

        serializer = NoteStatisticsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail = False, methods=['post'], url_path='create_note')
    def create_note(self, request):
        serializer = NoteCreateSerializer(data = request.data)
        if serializer.is_valid():
            note = serializer.save(user = request.user)
            return Response({
                'messsage' : 'Заметка успешно создана'
            },status=status.HTTP_201_CREATED)
        return Response({
            'message' : 'Ошибка создания заметки',
            'error' : serializer.errors
        }, status = status.HTTP_400_BAD_REQUEST)