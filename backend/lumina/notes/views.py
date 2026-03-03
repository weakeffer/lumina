from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Max, Sum
from django.utils import timezone
from datetime import timedelta
import pytz
import base64
import uuid
import os
from django.conf import settings
from django.core.files.base import ContentFile
import re
from .models import Notes, NoteGroup
from .serializers import (NoteCreateSerializer, NoteDetailSerializer, 
                         NoteListSerializer, NoteSerializer, 
                         DeletedNoteSerializer, NoteStatisticsSerializer, 
                         NoteUpdateSerializer, ImageUploadSerializer, NoteGroupSerializer, NoteGroupCreateSerializer,
                         NoteGroupUpdateSerializer)

class NotesViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Notes.objects.none()
        
        base_queryset = Notes.objects.filter(user=self.request.user)

        group_id = self.request.query_params.get('group')
        if group_id:
            if group_id == 'none':
                base_queryset = base_queryset.filter(group__isnull=True)
            else:
                base_queryset = base_queryset.filter(group_id=group_id)

        if self.action == 'deleted':
            return base_queryset.filter(is_deleted=True).order_by('-deleted_at')
        return base_queryset.filter(is_deleted=False).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NoteCreateSerializer
        elif self.action == 'update' or self.action == 'partial_update':
            return NoteUpdateSerializer
        elif self.action == 'list':
            return NoteListSerializer
        elif self.action == 'retrieve':
            return NoteDetailSerializer
        elif self.action == 'deleted':
            return DeletedNoteSerializer
        return NoteDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        self.request.user.profile.update_stats()

    def perform_update(self, serializer):
        serializer.save()
        self.request.user.profile.update_stats()

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()
        self.request.user.profile.update_stats()

    @action(detail=False, methods=['get'], url_path='deleted')
    def deleted(self, request):
        deleted_notes = self.get_queryset()
        serializer = self.get_serializer(deleted_notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        try:
            note = Notes.objects.get(id=pk, user=request.user, is_deleted=True)
            note.is_deleted = False
            note.deleted_at = None
            note.save()
            
            request.user.profile.update_stats()

            serializer = NoteDetailSerializer(note, context={'request': request})
            return Response({
                'message': 'Заметка восстановлена успешно!',
                'note': serializer.data
            })
        except Notes.DoesNotExist:
            return Response({
                'error': 'Заметка не найдена или ее нет в корзине'
            }, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=True, methods=['delete'], url_path='delete_permanently')
    def delete_permanently(self, request, pk=None):
        try:
            note = Notes.objects.get(id=pk, user=request.user, is_deleted=True)
            note.delete()
            request.user.profile.update_stats()
            return Response({
                'message': 'Заметка полностью удалена'
            }, status=status.HTTP_204_NO_CONTENT)
        except Notes.DoesNotExist:
            return Response({
                'error': 'Заметка не найдена'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['delete'], url_path='empty_trash')
    def empty_trash(self, request):
        deleted_notes = Notes.objects.filter(user=request.user, is_deleted=True)
        count = deleted_notes.count()
        deleted_notes.delete()
        request.user.profile.update_stats()
        
        return Response({
            'message': f'Корзина очищена. Удалено {count} заметок.'
        })

    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        user_notes = Notes.objects.filter(user=request.user, is_deleted=False)
        deleted_notes = Notes.objects.filter(user=request.user, is_deleted=True)
        total_images = 0
        for note in user_notes:
            total_images += len(note.images) if note.images else 0

        stats = {
            'total_notes': user_notes.count(),
            'last_created': user_notes.aggregate(last=Max('created_at'))['last'],
            'deleted_count': deleted_notes.count(),
            'total_images': total_images,
        }

        serializer = NoteStatisticsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='create_note')
    def create_note(self, request):
        serializer = NoteCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            note = serializer.save()
            request.user.profile.update_stats()
            
            moscow_tz = pytz.timezone('Europe/Moscow')
            local_created = note.created_at.astimezone(moscow_tz)
            return Response({
                'message': 'Заметка успешно создана',
                'id': note.id,
                'title': note.title,
                'text': note.text,
                'created_at': note.created_at,
                'updated_at': note.updated_at,
                'created_at_iso': note.created_at.isoformat(),
                'updated_at_iso': note.updated_at.isoformat(),
            }, status=status.HTTP_201_CREATED)
        return Response({
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='add-image')
    def add_image(self, request, pk=None):
        try:
            note = self.get_object()
            serializer = ImageUploadSerializer(data=request.data)
            if serializer.is_valid():
                image_url = serializer.validated_data.get('image_url')
                image_data = serializer.validated_data.get('image_data')
                filename = serializer.validated_data.get('filename', 'image.jpg')
                if image_data:
                    format, imgstr = image_data.split(';base64,')
                    ext = format.split('/')[-1]

                    file_name = f"{uuid.uuid4()}.{ext}"
                    upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
                    os.makedirs(upload_dir, exist_ok=True)
                    file_path = os.path.join(upload_dir, file_name)
                    with open(file_path, 'wb') as f:
                        f.write(base64.b64decode(imgstr))
                    
                    image_url = f"/media/uploads/{file_name}"

                note.add_image(
                    image_url=image_url,
                    filename=filename
                )
                
                return Response({
                    'message': 'Изображение добавлено',
                    'image': {
                        'url': image_url,
                        'filename': filename
                    }
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Notes.DoesNotExist:
            return Response({
                'error': 'Заметка не найдена'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        try:
            note = self.get_object()
            image_url = request.data.get('image_url')
            image_id = request.data.get('image_id')
            
            if not image_url and not image_id:
                return Response({
                    'error': 'Необходимо указать image_url или image_id'
                }, status=status.HTTP_400_BAD_REQUEST)

            if note.remove_image(image_url or image_id):
                if image_url and '/media/uploads/' in image_url:
                    filename = image_url.split('/')[-1]
                    file_path = os.path.join(settings.MEDIA_ROOT, 'uploads', filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        
                return Response({
                    'message': 'Изображение удалено'
                })
            else:
                return Response({
                    'error': 'Изображение не найдено'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Notes.DoesNotExist:
            return Response({
                'error': 'Заметка не найдена'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='images')
    def get_images(self, request, pk=None):
        try:
            note = self.get_object()
            images = note.get_images()
            
            return Response({
                'images': images,
                'count': len(images)
            })
            
        except Notes.DoesNotExist:
            return Response({
                'error': 'Заметка не найдена'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='upload-image-base64')
    def upload_image_base64(self, request):
        image_data = request.data.get('image')
        filename = request.data.get('filename', f'image_{uuid.uuid4()}.jpg')
        
        if not image_data:
            return Response({
                'error': 'Необходимо передать image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if len(image_data) > 5 * 1024 * 1024:
                return Response({
                    'error': 'Размер файла не должен превышать 5MB'
                }, status=status.HTTP_400_BAD_REQUEST)
            if ';base64,' not in image_data:
                return Response({
                    'error': 'Неверный формат base64 данных'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]

            allowed_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg+xml']
            if ext not in allowed_formats:
                return Response({
                    'error': f'Неподдерживаемый формат. Разрешены: {", ".join(allowed_formats)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            file_name = f"{uuid.uuid4()}.{ext}"
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file_name)
            with open(file_path, 'wb') as f:
                f.write(base64.b64decode(imgstr))
            
            print(f"✅ Файл сохранен: {file_path}")
            image_url = f"/media/uploads/{file_name}"
            
            return Response({
                'message': 'Изображение загружено',
                'url': image_url,
                'filename': filename or file_name
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Ошибка при загрузке: {str(e)}")
            return Response({
                'error': f'Ошибка при загрузке: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=True, methods=['post'], url_path='move-to-group')
    def move_to_group(self, request, pk=None):
        note = self.get_object()
        group_id = request.data.get('group_id')
        
        if group_id is None:
            note.group = None
        else:
            try:
                group = NoteGroup.objects.get(id=group_id, user=request.user)
                note.group = group
            except NoteGroup.DoesNotExist:
                return Response({
                    'error': 'Группа не найдена'
                }, status=status.HTTP_404_NOT_FOUND)
        
        note.save()
        serializer = NoteDetailSerializer(note, context={'request': request})
        
        return Response({
            'message': 'Заметка перемещена',
            'note': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='by-groups')
    def notes_by_groups(self, request):
        groups = NoteGroup.objects.filter(user=request.user)
        
        result = []

        ungrouped_notes = Notes.objects.filter(
            user=request.user,
            is_deleted=False,
            group__isnull=True
        )
        result.append({
            'id': 'none',
            'name': 'Без группы',
            'color': 'gray',
            'icon': 'Folder',
            'notes': NoteListSerializer(ungrouped_notes, many=True, context={'request': request}).data,
            'notes_count': ungrouped_notes.count()
        })

        for group in groups:
            notes = group.notes.filter(is_deleted=False)
            result.append({
                'id': group.id,
                'name': group.name,
                'color': group.color,
                'icon': group.icon,
                'description': group.description,
                'notes': NoteListSerializer(notes, many=True, context={'request': request}).data,
                'notes_count': notes.count()
            })
        
        return Response(result)
        
class NoteGroupViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NoteGroup.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return NoteGroupCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return NoteGroupUpdateSerializer
        return NoteGroupSerializer
    
    @action(detail=True, methods=['get'], url_path='notes')
    def get_group_notes(self, request, pk=None):
        group = self.get_object()
        notes = group.notes.filter(is_deleted=False)
        serializer = NoteListSerializer(notes, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='add-notes')
    def add_notes_to_group(self, request, pk=None):
        group = self.get_object()
        note_ids = request.data.get('note_ids', [])
        
        if not note_ids:
            return Response({
                'error': 'Не указаны ID заметок'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        Notes.objects.filter(
            id__in=note_ids,
            user=request.user,
            is_deleted=False
        ).update(group=group)
        
        return Response({
            'message': f'Заметки добавлены в группу {group.name}',
            'added_count': len(note_ids)
        })
    
    @action(detail=True, methods=['post'], url_path='remove-notes')
    def remove_notes_from_group(self, request, pk=None):
        group = self.get_object()
        note_ids = request.data.get('note_ids', [])
        
        if not note_ids:
            return Response({
                'error': 'Не указаны ID заметок'
            }, status=status.HTTP_400_BAD_REQUEST)

        Notes.objects.filter(
            id__in=note_ids,
            user=request.user,
            group=group
        ).update(group=None)
        
        return Response({
            'message': f'Заметки удалены из группы {group.name}',
            'removed_count': len(note_ids)
        })
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def group_statistics(self, request):
        groups = self.get_queryset()
        stats = []
        
        for group in groups:
            notes_in_group = group.notes.filter(is_deleted=False)
            stats.append({
                'id': group.id,
                'name': group.name,
                'color': group.color,
                'notes_count': notes_in_group.count(),
                'last_note': notes_in_group.order_by('-created_at').first().created_at if notes_in_group.exists() else None
            })
        
        return Response(stats)