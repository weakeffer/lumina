# backend/lumina/notes/domain/entities.py
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class GroupColor(str, Enum):
    INDIGO = 'indigo'
    RED = 'red'
    GREEN = 'green'
    BLUE = 'blue'
    YELLOW = 'yellow'
    PURPLE = 'purple'
    PINK = 'pink'
    GRAY = 'gray'

class GroupIcon(str, Enum):
    FOLDER = 'Folder'
    BOOK = 'Book'
    STAR = 'Star'
    HEART = 'Heart'
    WORK = 'Work'
    PERSONAL = 'Personal'
    IDEA = 'Idea'

@dataclass
class NoteGroupEntity:
    """Чистая доменная сущность группы заметок"""
    name: str
    user_id: int
    id: Optional[int] = None
    description: str = ""
    color: str = GroupColor.INDIGO.value
    icon: str = GroupIcon.FOLDER.value
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def __post_init__(self):
        self.validate()

    def validate(self):
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Название группы не может быть пустым")
        if len(self.name) > 100:
            raise ValueError("Название группы не может превышать 100 символов")
        if self.user_id is None:
            raise ValueError("Группа должна быть привязана к пользователю")

    def update(self, name: str = None, description: str = None, 
               color: str = None, icon: str = None):
        """Обновление данных группы"""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if color is not None:
            self.color = color
        if icon is not None:
            self.icon = icon
        self.validate()
        self.updated_at = datetime.now()

@dataclass
class NoteEntity:
    """Чистая доменная сущность заметки"""
    title: str
    text: str
    user_id: int
    id: Optional[int] = None
    group_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    images: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self):
        self.validate()
        if self.images is None:
            self.images = []

    def validate(self):
        if not self.title or len(self.title.strip()) == 0:
            self.title = "Заметка"  # Дефолтное значение как в модели
        if len(self.title) > 50:
            raise ValueError("Заголовок не может превышать 50 символов")
        if self.user_id is None:
            raise ValueError("Заметка должна быть привязана к пользователю")

    def update_content(self, title: str = None, text: str = None):
        """Обновление содержимого заметки"""
        if title is not None:
            self.title = title
        if text is not None:
            self.text = text
        self.validate()
        self.updated_at = datetime.now()

    def move_to_group(self, group_id: Optional[int]):
        """Перемещение заметки в группу"""
        self.group_id = group_id
        self.updated_at = datetime.now()

    def delete(self):
        """Мягкое удаление заметки"""
        self.is_deleted = True
        self.deleted_at = datetime.now()
        self.updated_at = datetime.now()

    def restore(self):
        """Восстановление заметки"""
        self.is_deleted = False
        self.deleted_at = None
        self.updated_at = datetime.now()

    def add_image(self, image_url: str, image_id: Optional[str] = None, 
                  filename: Optional[str] = None) -> Dict[str, Any]:
        """Добавление изображения"""
        image_data = {
            'url': image_url,
            'added_at': len(self.images)
        }
        
        if image_id:
            image_data['id'] = image_id
        if filename:
            image_data['filename'] = filename
        
        self.images.append(image_data)
        self.updated_at = datetime.now()
        return image_data

    def remove_image(self, image_url_or_id: str) -> bool:
        """Удаление изображения"""
        original_count = len(self.images)
        
        if isinstance(image_url_or_id, (int, str)) and str(image_url_or_id).isdigit():
            image_id = int(image_url_or_id)
            self.images = [img for img in self.images if img.get('id') != image_id]
        else:
            self.images = [img for img in self.images if img.get('url') != image_url_or_id]
        
        if len(self.images) != original_count:
            self.updated_at = datetime.now()
            return True
        return False

    def get_images(self) -> List[Dict[str, Any]]:
        """Получение списка изображений"""
        return self.images.copy()

    def has_images(self) -> bool:
        """Проверка наличия изображений"""
        return bool(self.images)

    def to_dict(self) -> Dict[str, Any]:
        """Конвертация в словарь"""
        return {
            'id': self.id,
            'title': self.title,
            'text': self.text,
            'user_id': self.user_id,
            'group_id': self.group_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_deleted': self.is_deleted,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'images': self.images.copy()
        }