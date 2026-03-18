# backend/lumina/notes/application/services.py
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import base64
import uuid
import os
import pytz
from django.conf import settings
from django.utils import timezone
from django.db.models import Max

from ..domain.entities import NoteEntity, NoteGroupEntity, GroupColor, GroupIcon
from ..domain.interfaces import NoteRepository, NoteGroupRepository
from ..domain.dto import (
    CreateNoteDTO, UpdateNoteDTO, CreateGroupDTO, UpdateGroupDTO,
    NoteResponseDTO, NoteListDTO, NoteDetailDTO, DeletedNoteDTO,
    NoteStatisticsDTO, GroupResponseDTO, ImageUploadDTO
)

class NoteService:
    """Сервис для работы с заметками"""
    
    def __init__(self, note_repository: NoteRepository, group_repository: NoteGroupRepository):
        self.note_repository = note_repository
        self.group_repository = group_repository
    
    def get_user_notes(self, user_id: int, group_id: Optional[str] = None) -> List[NoteListDTO]:
        """Получение списка заметок пользователя"""
        filters = {}
        if group_id:
            if group_id == 'none':
                filters['group_id__isnull'] = True
            else:
                filters['group_id'] = int(group_id)
        
        notes = self.note_repository.get_all(user_id, **filters)
        
        # Обогащаем данными о группах
        result = []
        for note in notes:
            group_name = None
            group_color = None
            if note.group_id:
                group = self.group_repository.get_by_id(note.group_id, user_id)
                if group:
                    group_name = group.name
                    group_color = group.color
            
            result.append(NoteListDTO.from_entity(note, group_name, group_color))
        
        return result
    
    def get_note_detail(self, note_id: int, user_id: int) -> Optional[NoteDetailDTO]:
        """Получение детальной информации о заметке"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return None
        
        return NoteDetailDTO.from_entity(note)
    
    def create_note(self, user_id: int, dto: CreateNoteDTO) -> Tuple[NoteResponseDTO, str]:
        """Создание новой заметки"""
        # Создаем доменную сущность
        note = NoteEntity(
            title=dto.title,
            text=dto.text,
            user_id=user_id,
            group_id=dto.group_id,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        
        # Сохраняем через репозиторий
        created_note = self.note_repository.create(note)
        
        # Обновляем статистику пользователя
        # self._update_user_stats(user_id)
        
        # Получаем информацию о группе для DTO
        group_name = None
        group_color = None
        if created_note.group_id:
            group = self.group_repository.get_by_id(created_note.group_id, user_id)
            if group:
                group_name = group.name
                group_color = group.color
        
        return NoteResponseDTO.from_entity(created_note, group_name, group_color), "Заметка успешно создана"
    
    def update_note(self, note_id: int, user_id: int, dto: UpdateNoteDTO) -> Tuple[Optional[NoteResponseDTO], str]:
        """Обновление заметки"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return None, "Заметка не найдена"
        
        # Обновляем поля
        note.update_content(
            title=dto.title,
            text=dto.text
        )
        
        if dto.group_id is not None:
            note.move_to_group(dto.group_id)
        
        if dto.images is not None:
            note.images = dto.images
        
        # Сохраняем
        updated_note = self.note_repository.update(note)
        
        # self._update_user_stats(user_id)
        
        return NoteResponseDTO.from_entity(updated_note), "Заметка обновлена"
    
    def delete_note(self, note_id: int, user_id: int) -> Tuple[bool, str]:
        """Мягкое удаление заметки"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return False, "Заметка не найдена"
        
        note.delete()
        self.note_repository.update(note)
        # self._update_user_stats(user_id)
        
        return True, "Заметка перемещена в корзину"
    
    def restore_note(self, note_id: int, user_id: int) -> Tuple[Optional[NoteDetailDTO], str]:
        """Восстановление заметки из корзины"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note or not note.is_deleted:
            return None, "Заметка не найдена в корзине"
        
        note.restore()
        restored_note = self.note_repository.update(note)
        # self._update_user_stats(user_id)
        
        return NoteDetailDTO.from_entity(restored_note), "Заметка восстановлена"
    
    def delete_permanently(self, note_id: int, user_id: int) -> Tuple[bool, str]:
        """Полное удаление заметки"""
        success = self.note_repository.delete(note_id, user_id, hard_delete=True)
        if success:
            # self._update_user_stats(user_id)
            return True, "Заметка полностью удалена"
        return False, "Заметка не найдена"
    
    def empty_trash(self, user_id: int) -> Tuple[int, str]:
        """Очистка корзины"""
        deleted_notes = self.note_repository.get_deleted(user_id)
        count = len(deleted_notes)
        
        for note in deleted_notes:
            self.note_repository.delete(note.id, user_id, hard_delete=True)
        
        # self._update_user_stats(user_id)
        return count, f"Корзина очищена. Удалено {count} заметок."
    
    def get_deleted_notes(self, user_id: int) -> List[DeletedNoteDTO]:
        """Получение списка удаленных заметок"""
        notes = self.note_repository.get_deleted(user_id)
        return [DeletedNoteDTO.from_entity(note) for note in notes]
    
    def get_statistics(self, user_id: int) -> NoteStatisticsDTO:
        """Получение статистики по заметкам"""
        all_notes = self.note_repository.get_all(user_id)
        deleted_notes = self.note_repository.get_deleted(user_id)
        
        active_notes = [n for n in all_notes if not n.is_deleted]
        
        total_notes = len(active_notes)
        last_created = max((n.created_at for n in active_notes if n.created_at), default=None)
        deleted_count = len(deleted_notes)
        total_images = sum(len(n.images) for n in active_notes)
        
        return NoteStatisticsDTO.from_data(
            total_notes=total_notes,
            last_created=last_created,
            deleted_count=deleted_count,
            total_images=total_images
        )
    
    def move_to_group(self, note_id: int, user_id: int, group_id: Optional[int]) -> Tuple[Optional[NoteDetailDTO], str]:
        """Перемещение заметки в группу"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return None, "Заметка не найдена"
        
        if group_id:
            group = self.group_repository.get_by_id(group_id, user_id)
            if not group:
                return None, "Группа не найдена"
        
        note.move_to_group(group_id)
        updated_note = self.note_repository.update(note)
        
        return NoteDetailDTO.from_entity(updated_note), "Заметка перемещена"
    
    def add_image(self, note_id: int, user_id: int, dto: ImageUploadDTO) -> Tuple[Optional[Dict], str]:
        """Добавление изображения к заметке"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return None, "Заметка не найдена"
        
        # Обработка base64 изображения
        if dto.image_data:
            try:
                image_url = self._save_base64_image(dto.image_data, dto.filename)
                dto.image_url = image_url
            except Exception as e:
                return None, f"Ошибка при сохранении изображения: {str(e)}"
        
        if not dto.image_url:
            return None, "Необходимо указать image_url или image_data"
        
        image_data = note.add_image(
            image_url=dto.image_url,
            filename=dto.filename
        )
        
        self.note_repository.update(note)
        
        return {
            'url': dto.image_url,
            'filename': dto.filename or 'image.jpg'
        }, "Изображение добавлено"
    
    def remove_image(self, note_id: int, user_id: int, image_url: Optional[str], 
                     image_id: Optional[str]) -> Tuple[bool, str]:
        """Удаление изображения из заметки"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return False, "Заметка не найдена"
        
        if not image_url and not image_id:
            return False, "Необходимо указать image_url или image_id"
        
        removed = note.remove_image(image_url or image_id)
        if removed:
            self.note_repository.update(note)
            
            # Удаляем файл с диска если нужно
            if image_url and '/media/uploads/' in image_url:
                self._delete_image_file(image_url)
            
            return True, "Изображение удалено"
        
        return False, "Изображение не найдено"
    
    def get_note_images(self, note_id: int, user_id: int) -> Tuple[Optional[List[Dict]], str]:
        """Получение списка изображений заметки"""
        note = self.note_repository.get_by_id(note_id, user_id)
        if not note:
            return None, "Заметка не найдена"
        
        return note.get_images(), "OK"
    
    def _save_base64_image(self, image_data: str, filename: Optional[str] = None) -> str:
        """Сохранение base64 изображения на диск"""
        # Проверка размера
        if len(image_data) > 5 * 1024 * 1024:
            raise ValueError("Размер файла не должен превышать 5MB")
        
        if ';base64,' not in image_data:
            raise ValueError("Неверный формат base64 данных")
        
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        
        allowed_formats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg+xml']
        if ext not in allowed_formats:
            raise ValueError(f"Неподдерживаемый формат. Разрешены: {', '.join(allowed_formats)}")
        
        file_name = f"{uuid.uuid4()}.{ext}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file_name)
        
        with open(file_path, 'wb') as f:
            f.write(base64.b64decode(imgstr))
        
        return f"/media/uploads/{file_name}"
    
    def _delete_image_file(self, image_url: str):
        """Удаление файла изображения с диска"""
        filename = image_url.split('/')[-1]
        file_path = os.path.join(settings.MEDIA_ROOT, 'uploads', filename)
        if os.path.exists(file_path):
            os.remove(file_path)


class NoteGroupService:
    """Сервис для работы с группами заметок"""
    
    def __init__(self, group_repository: NoteGroupRepository, note_repository: NoteRepository):
        self.group_repository = group_repository
        self.note_repository = note_repository
    
    def get_user_groups(self, user_id: int) -> List[GroupResponseDTO]:
        """Получение списка групп пользователя"""
        groups = self.group_repository.get_all(user_id)
        
        result = []
        for group in groups:
            notes = self.note_repository.get_all(user_id, group_id=group.id)
            notes_count = len([n for n in notes if not n.is_deleted])
            result.append(GroupResponseDTO.from_entity(group, notes_count))
        
        return result
    
    def get_group_detail(self, group_id: int, user_id: int) -> Optional[GroupResponseDTO]:
        """Получение детальной информации о группе"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return None
        
        notes = self.note_repository.get_all(user_id, group_id=group.id)
        notes_count = len([n for n in notes if not n.is_deleted])
        
        return GroupResponseDTO.from_entity(group, notes_count)
    
    def create_group(self, user_id: int, dto: CreateGroupDTO) -> Tuple[Optional[GroupResponseDTO], List[str]]:
        """Создание новой группы"""
        # Валидация
        errors = dto.validate()
        if errors:
            return None, errors
        
        # Проверка уникальности имени
        existing = self.group_repository.get_by_name(dto.name, user_id)
        if existing:
            return None, ["Группа с таким названием уже существует"]
        
        # Создание сущности
        group = NoteGroupEntity(
            name=dto.name,
            description=dto.description,
            color=dto.color,
            icon=dto.icon,
            user_id=user_id,
            created_at=timezone.now(),
            updated_at=timezone.now()
        )
        
        created_group = self.group_repository.create(group)
        
        return GroupResponseDTO.from_entity(created_group), []
    
    def update_group(self, group_id: int, user_id: int, dto: UpdateGroupDTO) -> Tuple[Optional[GroupResponseDTO], str]:
        """Обновление группы"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return None, "Группа не найдена"
        
        # Проверка уникальности имени если оно меняется
        if dto.name and dto.name != group.name:
            existing = self.group_repository.get_by_name(dto.name, user_id)
            if existing and existing.id != group_id:
                return None, "Группа с таким названием уже существует"
        
        group.update(
            name=dto.name,
            description=dto.description,
            color=dto.color,
            icon=dto.icon
        )
        
        updated_group = self.group_repository.update(group)
        
        notes = self.note_repository.get_all(user_id, group_id=group.id)
        notes_count = len([n for n in notes if not n.is_deleted])
        
        return GroupResponseDTO.from_entity(updated_group, notes_count), "Группа обновлена"
    
    def delete_group(self, group_id: int, user_id: int) -> Tuple[bool, str]:
        """Удаление группы"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return False, "Группа не найдена"
        
        # Перемещаем заметки из группы
        notes = self.note_repository.get_all(user_id, group_id=group.id)
        for note in notes:
            if not note.is_deleted:
                note.move_to_group(None)
                self.note_repository.update(note)
        
        success = self.group_repository.delete(group_id, user_id)
        if success:
            return True, "Группа удалена"
        return False, "Ошибка при удалении группы"
    
    def get_group_notes(self, group_id: int, user_id: int) -> List[NoteListDTO]:
        """Получение заметок группы"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return []
        
        notes = self.note_repository.get_all(user_id, group_id=group.id)
        active_notes = [n for n in notes if not n.is_deleted]
        
        return [NoteListDTO.from_entity(note, group.name, group.color) for note in active_notes]
    
    def add_notes_to_group(self, group_id: int, user_id: int, note_ids: List[int]) -> Tuple[int, str]:
        """Добавление заметок в группу"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return 0, "Группа не найдена"
        
        added_count = 0
        for note_id in note_ids:
            note = self.note_repository.get_by_id(note_id, user_id)
            if note and not note.is_deleted:
                note.move_to_group(group_id)
                self.note_repository.update(note)
                added_count += 1
        
        return added_count, f"Заметки добавлены в группу {group.name}"
    
    def remove_notes_from_group(self, group_id: int, user_id: int, note_ids: List[int]) -> Tuple[int, str]:
        """Удаление заметок из группы"""
        group = self.group_repository.get_by_id(group_id, user_id)
        if not group:
            return 0, "Группа не найдена"
        
        removed_count = 0
        for note_id in note_ids:
            note = self.note_repository.get_by_id(note_id, user_id)
            if note and note.group_id == group_id and not note.is_deleted:
                note.move_to_group(None)
                self.note_repository.update(note)
                removed_count += 1
        
        return removed_count, f"Заметки удалены из группы {group.name}"
    
    def get_groups_with_notes(self, user_id: int) -> List[Dict]:
        """Получение всех групп с их заметками (для API by-groups)"""
        groups = self.group_repository.get_all(user_id)
        
        result = []
        
        # Заметки без группы
        ungrouped_notes = self.note_repository.get_all(user_id, group_id__isnull=True)
        ungrouped_active = [n for n in ungrouped_notes if not n.is_deleted]
        result.append({
            'id': 'none',
            'name': 'Без группы',
            'color': 'gray',
            'icon': 'Folder',
            'notes': [NoteListDTO.from_entity(note).__dict__ for note in ungrouped_active],
            'notes_count': len(ungrouped_active)
        })
        
        # Заметки по группам
        for group in groups:
            notes = self.note_repository.get_all(user_id, group_id=group.id)
            active_notes = [n for n in notes if not n.is_deleted]
            result.append({
                'id': group.id,
                'name': group.name,
                'color': group.color,
                'icon': group.icon,
                'description': group.description,
                'notes': [NoteListDTO.from_entity(note, group.name, group.color).__dict__ for note in active_notes],
                'notes_count': len(active_notes)
            })
        
        return result
    
    def get_group_statistics(self, user_id: int) -> List[Dict]:
        """Получение статистики по группам"""
        groups = self.group_repository.get_all(user_id)
        stats = []
        
        for group in groups:
            notes = self.note_repository.get_all(user_id, group_id=group.id)
            active_notes = [n for n in notes if not n.is_deleted]
            
            last_note = None
            if active_notes:
                last_note = max((n.created_at for n in active_notes if n.created_at), default=None)
            
            stats.append({
                'id': group.id,
                'name': group.name,
                'color': group.color,
                'notes_count': len(active_notes),
                'last_note': last_note.isoformat() if last_note else None
            })
        
        return stats