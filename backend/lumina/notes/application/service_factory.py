# backend/lumina/notes/application/service_factory.py
from .services import NoteService, NoteGroupService
from ..infrastructure.repositories import DjangoNoteRepository, DjangoNoteGroupRepository

class ServiceFactory:
    """Фабрика для создания сервисов с их зависимостями"""
    
    _note_service = None
    _group_service = None
    
    @classmethod
    def get_note_service(cls) -> NoteService:
        """Получить экземпляр сервиса заметок"""
        if cls._note_service is None:
            note_repo = DjangoNoteRepository()
            group_repo = DjangoNoteGroupRepository()
            cls._note_service = NoteService(note_repo, group_repo)
        return cls._note_service
    
    @classmethod
    def get_group_service(cls) -> NoteGroupService:
        """Получить экземпляр сервиса групп"""
        if cls._group_service is None:
            note_repo = DjangoNoteRepository()
            group_repo = DjangoNoteGroupRepository()
            cls._group_service = NoteGroupService(group_repo, note_repo)
        return cls._group_service
    
    @classmethod
    def clear(cls):
        """Очистить кэш сервисов (для тестов)"""
        cls._note_service = None
        cls._group_service = None