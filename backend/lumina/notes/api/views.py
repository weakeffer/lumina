from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.conf import settings
from ..models import Notes, NoteAnalysis
import uuid
import os
import base64
from ..application.service_factory import ServiceFactory
from ..domain.dto import (
    CreateNoteDTO, UpdateNoteDTO, CreateGroupDTO, UpdateGroupDTO,
    ImageUploadDTO
)
from ..nlp.service import analyze_note_async, get_daily_summary

class NotesViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.note_service = ServiceFactory.get_note_service()
        self.group_service = ServiceFactory.get_group_service()
    
    def list(self, request):
        group_id = request.query_params.get('group')
        notes = self.note_service.get_user_notes(request.user.id, group_id)
        data = [note.__dict__ for note in notes]
        return Response(data)
    
    def retrieve(self, request, pk=None):
        note = self.note_service.get_note_detail(int(pk), request.user.id)
        if not note:
            return Response(
                {'error': 'Заметка не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(note.__dict__)
    
    def create(self, request):
        dto = CreateNoteDTO.from_request(request.data)
        note, message = self.note_service.create_note(request.user.id, dto)
        request.user.profile.update_stats()
        try:
            from ..nlp.profile_service import invalidate_profile_cache
            invalidate_profile_cache(request.user.id)
        except Exception:
            pass
        from ..nlp.service import analyze_note_async
        analyze_note_async(note.id)
        return Response({
            'message': message,
            'id': note.id,
            'title': note.title,
            'text': note.text,
            'created_at': note.created_at,
            'updated_at': note.updated_at,
            'created_at_iso': note.created_at,
            'updated_at_iso': note.updated_at,
        }, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        return self._update_note(pk, request)
    
    def partial_update(self, request, pk=None):
        return self._update_note(pk, request)

    def _update_note(self, pk, request):
        dto = UpdateNoteDTO.from_request(request.data)
        note, message = self.note_service.update_note(int(pk), request.user.id, dto)
        analyze_note_async(int(pk))
        
        if not note:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )

        request.user.profile.update_stats()
        try:
            from ..nlp.profile_service import invalidate_profile_cache
            invalidate_profile_cache(request.user.id)
        except Exception:
            pass

        return Response({
            'id': note.id,
            'title': note.title,
            'text': note.text,
            'created_at': note.created_at,
            'updated_at': note.updated_at,
            'user_id': note.user_id,
            'is_deleted': note.is_deleted,
            'images': note.images,
            'group_id': note.group_id,
            'group_name': note.group_name,
            'group_color': note.group_color,
            'deleted_at': note.deleted_at
        })

    def destroy(self, request, pk=None):
        success, message = self.note_service.delete_note(int(pk), request.user.id)
        
        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        request.user.profile.update_stats()
        try:
            from ..nlp.profile_service import invalidate_profile_cache
            invalidate_profile_cache(request.user.id)
        except Exception:
            pass
        return Response({'message': message}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='deleted')
    def deleted(self, request):
        notes = self.note_service.get_deleted_notes(request.user.id)
        data = [note.__dict__ for note in notes]
        return Response(data)
    
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        note, message = self.note_service.restore_note(int(pk), request.user.id)
        
        if not note:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        request.user.profile.update_stats()
        
        return Response({
            'message': message,
            'note': note.__dict__
        })
    
    @action(detail=True, methods=['delete'], url_path='delete_permanently')
    def delete_permanently(self, request, pk=None):
        success, message = self.note_service.delete_permanently(int(pk), request.user.id)
        
        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        request.user.profile.update_stats()
        return Response({'message': message}, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['delete'], url_path='empty_trash')
    def empty_trash(self, request):
        count, message = self.note_service.empty_trash(request.user.id)
        request.user.profile.update_stats()
        return Response({'message': message})
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        stats = self.note_service.get_statistics(request.user.id)
        return Response(stats.__dict__)
    
    @action(detail=True, methods=['post'], url_path='add-image')
    def add_image(self, request, pk=None):
        dto = ImageUploadDTO.from_request(request.data)
        
        # Валидация
        errors = dto.validate()
        if errors:
            return Response(
                {'error': errors[0]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_data, message = self.note_service.add_image(
            int(pk), request.user.id, dto
        )
        
        if not image_data:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND if 'не найдена' in message else status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': message,
            'image': image_data
        })
    
    @action(detail=False, methods=['post'], url_path='upload-image-base64')
    def upload_image_base64(self, request):
        """Загрузка изображения (без привязки к заметке) – возвращает URL"""
        image_data = request.data.get('image')
        filename = request.data.get('filename', f'image_{uuid.uuid4()}.jpg')

        if not image_data:
            return Response(
                {'error': 'Необходимо передать image'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка размера (5 MB)
        if len(image_data) > 5 * 1024 * 1024:
            return Response(
                {'error': 'Размер файла не должен превышать 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ';base64,' not in image_data:
            return Response(
                {'error': 'Неверный формат base64 данных'},
                status=status.HTTP_400_BAD_REQUEST
            )

        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]

        allowed_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg+xml']
        if ext not in allowed_formats:
            return Response(
                {'error': f'Неподдерживаемый формат. Разрешены: {", ".join(allowed_formats)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Сохраняем файл
            file_name = f"{uuid.uuid4()}.{ext}"
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file_name)

            with open(file_path, 'wb') as f:
                f.write(base64.b64decode(imgstr))

            image_url = f"/media/uploads/{file_name}"

            return Response({
                'message': 'Изображение загружено',
                'url': image_url,
                'filename': filename or file_name
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Ошибка при сохранении: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='remove-image')
    def remove_image(self, request, pk=None):
        image_url = request.data.get('image_url')
        image_id = request.data.get('image_id')
        
        success, message = self.note_service.remove_image(
            int(pk), request.user.id, image_url, image_id
        )
        
        if not success:
            status_code = status.HTTP_404_NOT_FOUND if 'не найдена' in message else status.HTTP_400_BAD_REQUEST
            return Response({'error': message}, status=status_code)
        
        return Response({'message': message})
    
    @action(detail=True, methods=['get'], url_path='images')
    def get_images(self, request, pk=None):
        images, message = self.note_service.get_note_images(int(pk), request.user.id)
        
        if images is None:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'images': images,
            'count': len(images)
        })
    
    @action(detail=True, methods=['post'], url_path='move-to-group')
    def move_to_group(self, request, pk=None):
        group_id = request.data.get('group_id')
        
        note, message = self.note_service.move_to_group(
            int(pk), request.user.id, group_id
        )
        
        if not note:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'message': message,
            'note': note.__dict__
        })
    
    @action(detail=False, methods=['get'], url_path='by-groups')
    def notes_by_groups(self, request):
        result = self.group_service.get_groups_with_notes(request.user.id)
        return Response(result)
    
    @action(detail=True, methods=['post'], url_path='analyze')
    def analyze(self, request, pk=None):
        """Запускает NLP-анализ заметки вручную"""
        note = self.note_service.get_note_detail(int(pk), request.user.id)
        if not note:
            return Response({'error': 'Заметка не найдена'}, status=404)
        analyze_note_async(int(pk))
        return Response({'message': 'Анализ запущен', 'note_id': pk})
 
    @action(detail=True, methods=['get'], url_path='analysis')
    def get_analysis(self, request, pk=None):
        """Возвращает результат NLP-анализа"""
        try:
            analysis = NoteAnalysis.objects.get(
                note_id=int(pk),
                note__user_id=request.user.id,
            )
            return Response({
                'note_id': pk,
                'is_analyzed': analysis.is_analyzed,
                'sentiment': analysis.sentiment,
                'sentiment_score': analysis.sentiment_score,
                'dominant_emotion': analysis.dominant_emotion,
                'emotions': analysis.emotions,
                'keywords': analysis.keywords,
                'entities': analysis.entities,
                'topics': analysis.topics,
                'text_stats': analysis.text_stats,
                'narrative': analysis.narrative,
                'analyzed_at': analysis.analyzed_at.isoformat(),
            })
        except NoteAnalysis.DoesNotExist:
            return Response({'is_analyzed': False, 'note_id': pk})
 
    @action(detail=False, methods=['get'], url_path='daily-summary')
    def daily_summary(self, request):
        """
        Сводка за день с локально сгенерированным нарративом.
        GET /api/notes/daily-summary/?date=2026-04-24
        """
        date_str = request.query_params.get('date')
        if not date_str:
            from datetime import date
            date_str = date.today().isoformat()
        summary = get_daily_summary(request.user.id, date_str)
        return Response(summary)
 
    @action(detail=False, methods=['post'], url_path='analyze-all')
    def analyze_all(self, request):
        """Запускает анализ всех неанализированных заметок"""
        notes = Notes.objects.filter(
            user_id=request.user.id,
            is_deleted=False,
        ).exclude(analysis__is_analyzed=True)[:20]
 
        for note in notes:
            analyze_note_async(note.id)
 
        return Response({'message': f'Запущен анализ {notes.count()} заметок'})
 
    @action(detail=False, methods=['get'], url_path='personality-profile')
    def personality_profile(self, request):
        """Полный психологический профиль пользователя"""
        from ..nlp.profile_service import get_personality_profile
        profile = get_personality_profile(request.user.id)
        return Response(profile)


class NoteGroupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.group_service = ServiceFactory.get_group_service()
        self.note_service = ServiceFactory.get_note_service()
    
    def list(self, request):
        groups = self.group_service.get_user_groups(request.user.id)
        data = [group.__dict__ for group in groups]
        return Response(data)
    
    def retrieve(self, request, pk=None):
        group = self.group_service.get_group_detail(int(pk), request.user.id)
        if not group:
            return Response(
                {'error': 'Группа не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(group.__dict__)
    
    def create(self, request):
        dto = CreateGroupDTO.from_request(request.data)
        group, errors = self.group_service.create_group(request.user.id, dto)
        
        if errors:
            return Response(
                {'error': errors[0] if len(errors) == 1 else errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(group.__dict__, status=status.HTTP_201_CREATED)
    
    def update(self, request, pk=None):
        return self._update_group(pk, request)
    
    def partial_update(self, request, pk=None):
        return self._update_group(pk, request)
    
    def _update_group(self, pk, request):
        dto = UpdateGroupDTO.from_request(request.data)
        group, message = self.group_service.update_group(int(pk), request.user.id, dto)
        
        if not group:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(group.__dict__)
    
    def destroy(self, request, pk=None):
        success, message = self.group_service.delete_group(int(pk), request.user.id)
        
        if not success:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({'message': message}, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'], url_path='notes')
    def get_group_notes(self, request, pk=None):
        notes = self.group_service.get_group_notes(int(pk), request.user.id)
        data = [note.__dict__ for note in notes]
        return Response(data)
    
    @action(detail=True, methods=['post'], url_path='add-notes')
    def add_notes_to_group(self, request, pk=None):
        note_ids = request.data.get('note_ids', [])
        
        if not note_ids:
            return Response(
                {'error': 'Не указаны ID заметок'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        added_count, message = self.group_service.add_notes_to_group(
            int(pk), request.user.id, note_ids
        )
        
        return Response({
            'message': message,
            'added_count': added_count
        })
    
    @action(detail=True, methods=['post'], url_path='remove-notes')
    def remove_notes_from_group(self, request, pk=None):
        note_ids = request.data.get('note_ids', [])
        
        if not note_ids:
            return Response(
                {'error': 'Не указаны ID заметок'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        removed_count, message = self.group_service.remove_notes_from_group(
            int(pk), request.user.id, note_ids
        )
        
        return Response({
            'message': message,
            'removed_count': removed_count
        })
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def group_statistics(self, request):
        stats = self.group_service.get_group_statistics(request.user.id)
        return Response(stats)