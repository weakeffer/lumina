from typing import Optional, List, Dict, Any
from datetime import datetime
from django.utils import timezone
from django.db import models as django_models
from django.db.models import Q

from ..domain.entities import NoteEntity, NoteGroupEntity
from ..domain.interfaces import NoteRepository, NoteGroupRepository
from ..models import Notes, NoteGroup

class DjangoNoteRepository(NoteRepository):
    
    def _to_entity(self, model: Notes) -> NoteEntity:
        return NoteEntity(
            id=model.id,
            title=model.title,
            text=model.text,
            user_id=model.user_id,
            group_id=model.group_id if model.group else None,
            created_at=model.created_at,
            updated_at=model.updated_at,
            is_deleted=model.is_deleted,
            deleted_at=model.deleted_at,
            images=model.images if model.images else []
        )
    
    def _from_entity(self, entity: NoteEntity, model: Optional[Notes] = None) -> Notes:
        if model is None:
            model = Notes()
        
        model.title = entity.title
        model.text = entity.text
        model.user_id = entity.user_id
        model.group_id = entity.group_id
        model.is_deleted = entity.is_deleted
        model.deleted_at = entity.deleted_at
        model.images = entity.images
        
        if entity.updated_at and entity.updated_at != model.updated_at:
            model.updated_at = entity.updated_at
        
        return model
    
    def get_by_id(self, note_id: int, user_id: int) -> Optional[NoteEntity]:
        try:
            note = Notes.objects.get(id=note_id, user_id=user_id)
            return self._to_entity(note)
        except Notes.DoesNotExist:
            return None
    
    def get_all(self, user_id: int, **filters) -> List[NoteEntity]:
        queryset = Notes.objects.filter(user_id=user_id)
        
        for key, value in filters.items():
            if key == 'group_id':
                if value == 'none' or value is None:
                    queryset = queryset.filter(group__isnull=True)
                else:
                    queryset = queryset.filter(group_id=value)
            elif key == 'group_id__isnull':
                queryset = queryset.filter(group__isnull=value)
            elif key == 'is_deleted':
                queryset = queryset.filter(is_deleted=value)
            elif key == 'search':
                queryset = queryset.filter(
                    Q(title__icontains=value) | Q(text__icontains=value)
                )
        
        if 'is_deleted' not in filters:
            queryset = queryset.filter(is_deleted=False)
        
        if 'ordering' in filters:
            queryset = queryset.order_by(filters['ordering'])
        else:
            queryset = queryset.order_by('-created_at')
        
        return [self._to_entity(note) for note in queryset]
    
    def create(self, note: NoteEntity) -> NoteEntity:
        model = self._from_entity(note)
        model.save()

        note.id = model.id
        note.created_at = model.created_at
        note.updated_at = model.updated_at
        
        return note
    
    def update(self, note: NoteEntity) -> NoteEntity:
        try:
            model = Notes.objects.get(id=note.id, user_id=note.user_id)
            model = self._from_entity(note, model)
            model.save()

            note.updated_at = model.updated_at
            
            return note
        except Notes.DoesNotExist:
            raise ValueError(f"Заметка с id {note.id} не найдена")
    
    def delete(self, note_id: int, user_id: int, hard_delete: bool = False) -> bool:
        try:
            note = Notes.objects.get(id=note_id, user_id=user_id)
            
            if hard_delete:
                note.delete()
            else:
                note.is_deleted = True
                note.deleted_at = timezone.now()
                note.save()
            
            return True
        except Notes.DoesNotExist:
            return False
    
    def get_deleted(self, user_id: int) -> List[NoteEntity]:
        queryset = Notes.objects.filter(
            user_id=user_id,
            is_deleted=True
        ).order_by('-deleted_at')
        
        return [self._to_entity(note) for note in queryset]
    
    def restore(self, note_id: int, user_id: int) -> bool:
        try:
            note = Notes.objects.get(id=note_id, user_id=user_id, is_deleted=True)
            note.is_deleted = False
            note.deleted_at = None
            note.save()
            return True
        except Notes.DoesNotExist:
            return False


class DjangoNoteGroupRepository(NoteGroupRepository):
    
    def _to_entity(self, model: NoteGroup) -> NoteGroupEntity:
        return NoteGroupEntity(
            id=model.id,
            name=model.name,
            description=model.description or "",
            color=model.color,
            icon=model.icon,
            user_id=model.user_id,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _from_entity(self, entity: NoteGroupEntity, model: Optional[NoteGroup] = None) -> NoteGroup:
        if model is None:
            model = NoteGroup()
        
        model.name = entity.name
        model.description = entity.description
        model.color = entity.color
        model.icon = entity.icon
        model.user_id = entity.user_id
        
        if entity.updated_at and entity.updated_at != model.updated_at:
            model.updated_at = entity.updated_at
        
        return model
    
    def get_by_id(self, group_id: int, user_id: int) -> Optional[NoteGroupEntity]:
        try:
            group = NoteGroup.objects.get(id=group_id, user_id=user_id)
            return self._to_entity(group)
        except NoteGroup.DoesNotExist:
            return None
    
    def get_all(self, user_id: int) -> List[NoteGroupEntity]:
        queryset = NoteGroup.objects.filter(user_id=user_id).order_by('name')
        return [self._to_entity(group) for group in queryset]
    
    def create(self, group: NoteGroupEntity) -> NoteGroupEntity:
        model = self._from_entity(group)
        model.save()
        
        group.id = model.id
        group.created_at = model.created_at
        group.updated_at = model.updated_at
        
        return group
    
    def update(self, group: NoteGroupEntity) -> NoteGroupEntity:
        try:
            model = NoteGroup.objects.get(id=group.id, user_id=group.user_id)
            model = self._from_entity(group, model)
            model.save()
            
            group.updated_at = model.updated_at
            
            return group
        except NoteGroup.DoesNotExist:
            raise ValueError(f"Группа с id {group.id} не найдена")
    
    def delete(self, group_id: int, user_id: int) -> bool:
        try:
            group = NoteGroup.objects.get(id=group_id, user_id=user_id)
            group.delete()
            return True
        except NoteGroup.DoesNotExist:
            return False
    
    def get_by_name(self, name: str, user_id: int) -> Optional[NoteGroupEntity]:
        try:
            group = NoteGroup.objects.get(name=name, user_id=user_id)
            return self._to_entity(group)
        except NoteGroup.DoesNotExist:
            return None