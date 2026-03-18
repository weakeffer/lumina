from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from datetime import datetime
from .entities import NoteEntity, NoteGroupEntity

class NoteRepository(ABC):
    """Порт для репозитория заметок"""
    
    @abstractmethod
    def get_by_id(self, note_id: int, user_id: int) -> Optional[NoteEntity]:
        """Получить заметку по ID"""
        pass
    
    @abstractmethod
    def get_all(self, user_id: int, **filters) -> List[NoteEntity]:
        """Получить все заметки пользователя с фильтрацией"""
        pass
    
    @abstractmethod
    def create(self, note: NoteEntity) -> NoteEntity:
        """Создать новую заметку"""
        pass
    
    @abstractmethod
    def update(self, note: NoteEntity) -> NoteEntity:
        """Обновить заметку"""
        pass
    
    @abstractmethod
    def delete(self, note_id: int, user_id: int, hard_delete: bool = False) -> bool:
        """Удалить заметку"""
        pass
    
    @abstractmethod
    def get_deleted(self, user_id: int) -> List[NoteEntity]:
        """Получить удаленные заметки"""
        pass
    
    @abstractmethod
    def restore(self, note_id: int, user_id: int) -> bool:
        """Восстановить заметку"""
        pass

class NoteGroupRepository(ABC):
    """Порт для репозитория групп заметок"""
    
    @abstractmethod
    def get_by_id(self, group_id: int, user_id: int) -> Optional[NoteGroupEntity]:
        """Получить группу по ID"""
        pass
    
    @abstractmethod
    def get_all(self, user_id: int) -> List[NoteGroupEntity]:
        """Получить все группы пользователя"""
        pass
    
    @abstractmethod
    def create(self, group: NoteGroupEntity) -> NoteGroupEntity:
        """Создать новую группу"""
        pass
    
    @abstractmethod
    def update(self, group: NoteGroupEntity) -> NoteGroupEntity:
        """Обновить группу"""
        pass
    
    @abstractmethod
    def delete(self, group_id: int, user_id: int) -> bool:
        """Удалить группу"""
        pass
    
    @abstractmethod
    def get_by_name(self, name: str, user_id: int) -> Optional[NoteGroupEntity]:
        """Получить группу по имени"""
        pass