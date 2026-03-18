from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class ThemePreference(str, Enum):
    LIGHT = 'light'
    DARK = 'dark'
    SEPIA = 'sepia'
    OCEAN = 'ocean'
    FOREST = 'forest'

@dataclass
class ProfileEntity:
    user_id: int
    id: Optional[int] = None
    avatar: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: str = ""
    telegram: str = ""
    github: str = ""
    website: str = ""
    theme_preference: str = ThemePreference.LIGHT.value
    email_notifications: bool = True
    auto_save_interval: int = 1
    total_notes: int = 0
    total_words: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def __post_init__(self):
        self.validate()

    def validate(self):
        if self.user_id is None:
            raise ValueError("Профиль должен быть привязан к пользователю")
        if len(self.bio) > 500:
            raise ValueError("Bio не может превышать 500 символов")
        if len(self.telegram) > 100:
            raise ValueError("Telegram не может превышать 100 символов")
        if len(self.github) > 100:
            raise ValueError("GitHub не может превышать 100 символов")
        if self.auto_save_interval < 1:
            raise ValueError("Интервал автосохранения должен быть больше 0")

    def update_profile(self, **kwargs):
        allowed_fields = ['bio', 'telegram', 'github', 'website', 
                         'theme_preference', 'email_notifications', 'auto_save_interval']
        
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(self, key, value)
        
        self.validate()
        self.updated_at = datetime.now()

    def update_stats(self, total_notes: int, total_words: int):
        self.total_notes = total_notes
        self.total_words = total_words
        self.updated_at = datetime.now()

    def get_avatar_url(self) -> Optional[str]:
        return self.avatar_url

@dataclass
class UserEntity:
    username: str
    email: str
    id: Optional[int] = None
    first_name: str = ""
    last_name: str = ""
    is_active: bool = True
    date_joined: Optional[datetime] = None
    last_login: Optional[datetime] = None
    profile: Optional[ProfileEntity] = None

    def __post_init__(self):
        self.validate()

    def validate(self):
        if not self.username or len(self.username.strip()) == 0:
            raise ValueError("Имя пользователя не может быть пустым")
        if not self.email or '@' not in self.email:
            raise ValueError("Некорректный email")
        if len(self.username) > 150:
            raise ValueError("Имя пользователя не может превышать 150 символов")

    def get_full_name(self) -> str:
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username

    def update_profile(self, profile_data: dict) -> None:
        if not self.profile:
            raise ValueError("Профиль не найден")
        self.profile.update_profile(**profile_data)