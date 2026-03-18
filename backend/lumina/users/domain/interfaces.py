from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any, Tuple
from .entities import UserEntity, ProfileEntity

class UserRepository(ABC):
    """Порт для репозитория пользователей"""
    
    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[UserEntity]:
        """Получить пользователя по ID"""
        pass
    
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[UserEntity]:
        """Получить пользователя по имени"""
        pass
    
    @abstractmethod
    def get_by_email(self, email: str) -> Optional[UserEntity]:
        """Получить пользователя по email"""
        pass
    
    @abstractmethod
    def create(self, username: str, email: str, password: str) -> UserEntity:
        """Создать нового пользователя"""
        pass
    
    @abstractmethod
    def update(self, user: UserEntity) -> UserEntity:
        """Обновить пользователя"""
        pass
    
    @abstractmethod
    def authenticate(self, username: str, password: str) -> Optional[UserEntity]:
        """Аутентификация пользователя"""
        pass
    
    @abstractmethod
    def update_last_login(self, user_id: int) -> None:
        """Обновить время последнего входа"""
        pass

class ProfileRepository(ABC):
    """Порт для репозитория профилей"""
    
    @abstractmethod
    def get_by_user_id(self, user_id: int) -> Optional[ProfileEntity]:
        """Получить профиль по ID пользователя"""
        pass
    
    @abstractmethod
    def create(self, user_id: int) -> ProfileEntity:
        """Создать профиль для пользователя"""
        pass
    
    @abstractmethod
    def update(self, profile: ProfileEntity) -> ProfileEntity:
        """Обновить профиль"""
        pass
    
    @abstractmethod
    def update_stats(self, user_id: int) -> ProfileEntity:
        """Обновить статистику профиля"""
        pass