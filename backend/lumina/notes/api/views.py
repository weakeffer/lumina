from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from ..application.service_factory import ServiceFactory
from ..domain.dto import (
    CreateNoteDTO, UpdateNoteDTO, CreateGroupDTO, UpdateGroupDTO,
    ImageUploadDTO
)

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

        if not note:
            return Response(
                {'error': message},
                status=status.HTTP_404_NOT_FOUND
            )

        request.user.profile.update_stats()

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