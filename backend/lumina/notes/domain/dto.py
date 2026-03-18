# backend/lumina/notes/domain/dto.py
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import pytz
from .entities import NoteEntity, NoteGroupEntity

@dataclass
class NoteResponseDTO:
    """DTO для ответа с данными заметки"""
    id: int
    title: str
    text: str
    created_at: str
    updated_at: str
    user_id: int
    is_deleted: bool
    images: List[Dict[str, Any]]
    group_id: Optional[int] = None
    group_name: Optional[str] = None
    group_color: Optional[str] = None
    deleted_at: Optional[str] = None
    
    @classmethod
    def from_entity(cls, note: NoteEntity, group_name: Optional[str] = None, 
                    group_color: Optional[str] = None) -> 'NoteResponseDTO':
        """Создание DTO из сущности"""
        moscow_tz = pytz.timezone('Europe/Moscow')
        
        created_at = None
        if note.created_at:
            if isinstance(note.created_at, datetime):
                local_time = note.created_at.astimezone(moscow_tz)
                created_at = local_time.isoformat()
            else:
                created_at = note.created_at
        
        updated_at = None
        if note.updated_at:
            if isinstance(note.updated_at, datetime):
                local_time = note.updated_at.astimezone(moscow_tz)
                updated_at = local_time.isoformat()
            else:
                updated_at = note.updated_at
        
        deleted_at = None
        if note.deleted_at:
            if isinstance(note.deleted_at, datetime):
                local_time = note.deleted_at.astimezone(moscow_tz)
                deleted_at = local_time.isoformat()
            else:
                deleted_at = note.deleted_at
        
        return cls(
            id=note.id,
            title=note.title,
            text=note.text,
            created_at=created_at,
            updated_at=updated_at,
            user_id=note.user_id,
            is_deleted=note.is_deleted,
            images=note.images.copy(),
            group_id=note.group_id,
            group_name=group_name,
            group_color=group_color,
            deleted_at=deleted_at
        )

@dataclass
class NoteListDTO:
    """DTO для списка заметок"""
    id: int
    title: str
    preview: str
    text: str
    created_at_formatted: str
    updated_at_formatted: str
    user_id: int
    is_deleted: bool
    images_count: int
    first_image: Optional[str]
    group_id: Optional[int]
    group_name: Optional[str]
    group_color: Optional[str]
    
    @classmethod
    def from_entity(cls, note: NoteEntity, group_name: Optional[str] = None,
                    group_color: Optional[str] = None) -> 'NoteListDTO':
        """Создание DTO из сущности"""
        preview = note.text[:100] + '...' if len(note.text) > 100 else note.text
        
        moscow_tz = pytz.timezone('Europe/Moscow')
        
        # Форматирование дат для отображения
        created_at_formatted = None
        if note.created_at:
            if isinstance(note.created_at, datetime):
                local_time = note.created_at.astimezone(moscow_tz)
                created_at_formatted = local_time.isoformat()
            else:
                created_at_formatted = note.created_at
        
        updated_at_formatted = None
        if note.updated_at:
            if isinstance(note.updated_at, datetime):
                local_time = note.updated_at.astimezone(moscow_tz)
                updated_at_formatted = local_time.isoformat()
            else:
                updated_at_formatted = note.updated_at
        
        images_count = len(note.images)
        first_image = note.images[0].get('url') if note.images else None
        
        return cls(
            id=note.id,
            title=note.title,
            preview=preview,
            text=note.text,
            created_at_formatted=created_at_formatted,
            updated_at_formatted=updated_at_formatted,
            user_id=note.user_id,
            is_deleted=note.is_deleted,
            images_count=images_count,
            first_image=first_image,
            group_id=note.group_id,
            group_name=group_name,
            group_color=group_color
        )

@dataclass
class NoteDetailDTO:
    """DTO для детальной информации о заметке"""
    id: int
    title: str
    text: str
    created_at_formatted: str
    updated_at_formatted: str
    deleted_at_formatted: Optional[str]
    user_id: int
    is_deleted: bool
    images_with_details: List[Dict[str, Any]]
    
    @classmethod
    def from_entity(cls, note: NoteEntity) -> 'NoteDetailDTO':
        """Создание DTO из сущности"""
        # Форматирование дат для отображения
        created_at_formatted = note.created_at.strftime('%d.%m.%Y %H:%M') if note.created_at else None
        updated_at_formatted = note.updated_at.strftime('%d.%m.%Y %H:%M') if note.updated_at else None
        deleted_at_formatted = note.deleted_at.strftime('%d.%m.%Y %H:%M') if note.deleted_at else None
        
        # Форматирование изображений
        images_with_details = []
        for idx, img in enumerate(note.images):
            image_data = {
                'url': img.get('url'),
                'filename': img.get('filename', f'image_{idx+1}'),
                'added_at': img.get('added_at', idx),
                'id': img.get('id'),
                'is_external': img.get('url', '').startswith('http') and 'localhost' not in img.get('url', '')
            }
            images_with_details.append(image_data)
        
        return cls(
            id=note.id,
            title=note.title,
            text=note.text,
            created_at_formatted=created_at_formatted,
            updated_at_formatted=updated_at_formatted,
            deleted_at_formatted=deleted_at_formatted,
            user_id=note.user_id,
            is_deleted=note.is_deleted,
            images_with_details=images_with_details
        )

@dataclass
class DeletedNoteDTO:
    """DTO для удаленных заметок"""
    id: int
    title: str
    text: str
    created_at_formatted: str
    deleted_at_formatted: str
    user_id: int
    images: List[Dict[str, Any]]
    
    @classmethod
    def from_entity(cls, note: NoteEntity) -> 'DeletedNoteDTO':
        """Создание DTO из сущности"""
        created_at_formatted = note.created_at.strftime('%d.%m.%Y %H:%M') if note.created_at else None
        deleted_at_formatted = note.deleted_at.strftime('%d.%m.%Y %H:%M') if note.deleted_at else None
        
        return cls(
            id=note.id,
            title=note.title,
            text=note.text,
            created_at_formatted=created_at_formatted,
            deleted_at_formatted=deleted_at_formatted,
            user_id=note.user_id,
            images=note.images.copy()
        )

@dataclass
class NoteStatisticsDTO:
    """DTO для статистики заметок"""
    total_notes: int
    last_created: str
    deleted_count: int
    total_images: int
    
    @classmethod
    def from_data(cls, total_notes: int, last_created: datetime, 
                  deleted_count: int, total_images: int) -> 'NoteStatisticsDTO':
        """Создание DTO из данных"""
        return cls(
            total_notes=total_notes,
            last_created=last_created.strftime('%d.%m.%Y %H:%M') if last_created else None,
            deleted_count=deleted_count,
            total_images=total_images
        )

@dataclass
class GroupResponseDTO:
    """DTO для ответа с данными группы"""
    id: int
    name: str
    description: str
    color: str
    icon: str
    created_at: str
    updated_at: str
    notes_count: int
    user_id: int
    
    @classmethod
    def from_entity(cls, group: NoteGroupEntity, notes_count: int = 0) -> 'GroupResponseDTO':
        """Создание DTO из сущности"""
        return cls(
            id=group.id,
            name=group.name,
            description=group.description,
            color=group.color,
            icon=group.icon,
            created_at=group.created_at.isoformat() if group.created_at else None,
            updated_at=group.updated_at.isoformat() if group.updated_at else None,
            notes_count=notes_count,
            user_id=group.user_id
        )

@dataclass
class CreateNoteDTO:
    """DTO для создания заметки"""
    title: str
    text: str
    group_id: Optional[int] = None
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'CreateNoteDTO':
        """Создание DTO из данных запроса"""
        return cls(
            title=data.get('title', 'Заметка'),
            text=data.get('text', ''),
            group_id=data.get('group')
        )

@dataclass
class UpdateNoteDTO:
    """DTO для обновления заметки"""
    title: Optional[str] = None
    text: Optional[str] = None
    images: Optional[List[Dict[str, Any]]] = None
    group_id: Optional[int] = None
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'UpdateNoteDTO':
        """Создание DTO из данных запроса"""
        return cls(
            title=data.get('title'),
            text=data.get('text'),
            images=data.get('images'),
            group_id=data.get('group')
        )

@dataclass
class CreateGroupDTO:
    """DTO для создания группы"""
    name: str
    description: str = ""
    color: str = 'indigo'
    icon: str = 'Folder'
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'CreateGroupDTO':
        """Создание DTO из данных запроса"""
        return cls(
            name=data.get('name', '').strip(),
            description=data.get('description', ''),
            color=data.get('color', 'indigo'),
            icon=data.get('icon', 'Folder')
        )
    
    def validate(self) -> List[str]:
        """Валидация DTO"""
        errors = []
        if not self.name:
            errors.append("Название группы не может быть пустым")
        if len(self.name) > 100:
            errors.append("Название группы должно быть менее 100 символов")
        return errors

@dataclass
class UpdateGroupDTO:
    """DTO для обновления группы"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'UpdateGroupDTO':
        """Создание DTO из данных запроса"""
        return cls(
            name=data.get('name'),
            description=data.get('description'),
            color=data.get('color'),
            icon=data.get('icon')
        )

@dataclass
class ImageUploadDTO:
    """DTO для загрузки изображения"""
    image_url: Optional[str] = None
    image_data: Optional[str] = None
    filename: Optional[str] = None
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'ImageUploadDTO':
        """Создание DTO из данных запроса"""
        return cls(
            image_url=data.get('image_url'),
            image_data=data.get('image_data'),
            filename=data.get('filename')
        )
    
    def validate(self) -> List[str]:
        """Валидация DTO"""
        errors = []
        if not self.image_url and not self.image_data:
            errors.append("Необходимо указать image_url или image_data")
        return errors