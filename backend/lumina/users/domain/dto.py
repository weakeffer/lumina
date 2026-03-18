from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from datetime import datetime
import pytz
from .entities import UserEntity, ProfileEntity

@dataclass
class ProfileDTO:
    id: int
    user_id: int
    avatar: Optional[str]
    avatar_url: Optional[str]
    bio: str
    telegram: str
    github: str
    website: str
    theme_preference: str
    email_notifications: bool
    auto_save_interval: int
    total_notes: int
    total_words: int
    created_at: str
    updated_at: str
    
    @classmethod
    def from_entity(cls, profile: ProfileEntity, avatar_url: Optional[str] = None) -> 'ProfileDTO':
        print(f"🔍 DTO - получил avatar_url: {avatar_url}")
        moscow_tz = pytz.timezone('Europe/Moscow')
        
        created_at = None
        if profile.created_at:
            if isinstance(profile.created_at, datetime):
                local_time = profile.created_at.astimezone(moscow_tz)
                created_at = local_time.isoformat()
            else:
                created_at = profile.created_at
        
        updated_at = None
        if profile.updated_at:
            if isinstance(profile.updated_at, datetime):
                local_time = profile.updated_at.astimezone(moscow_tz)
                updated_at = local_time.isoformat()
            else:
                updated_at = profile.updated_at
        print(f"🔍 DTO - отправляю avatar_url: {avatar_url}")
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            avatar=profile.avatar,
            avatar_url=avatar_url,
            bio=profile.bio,
            telegram=profile.telegram,
            github=profile.github,
            website=profile.website,
            theme_preference=profile.theme_preference,
            email_notifications=profile.email_notifications,
            auto_save_interval=profile.auto_save_interval,
            total_notes=profile.total_notes,
            total_words=profile.total_words,
            created_at=created_at,
            updated_at=updated_at
        )

@dataclass
class UserDTO:
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    profile: ProfileDTO
    date_joined: Optional[str] = None
    last_login: Optional[str] = None
    
    @classmethod
    def from_entity(cls, user: UserEntity, profile_dto: ProfileDTO) -> 'UserDTO':
        moscow_tz = pytz.timezone('Europe/Moscow')
        
        date_joined = None
        if user.date_joined:
            if isinstance(user.date_joined, datetime):
                local_time = user.date_joined.astimezone(moscow_tz)
                date_joined = local_time.isoformat()
            else:
                date_joined = user.date_joined
        
        last_login = None
        if user.last_login:
            if isinstance(user.last_login, datetime):
                local_time = user.last_login.astimezone(moscow_tz)
                last_login = local_time.isoformat()
            else:
                last_login = user.last_login
        
        return cls(
            id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile=profile_dto,
            date_joined=date_joined,
            last_login=last_login
        )

@dataclass
class RegisterDTO:
    username: str
    email: str
    password: str
    password2: str
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'RegisterDTO':
        return cls(
            username=data.get('username', ''),
            email=data.get('email', ''),
            password=data.get('password', ''),
            password2=data.get('password2', '')
        )
    
    def validate(self) -> List[str]:
        errors = []
        
        if not self.username:
            errors.append("Имя пользователя обязательно")
        elif len(self.username) < 3:
            errors.append("Имя пользователя должно быть не менее 3 символов")
        elif len(self.username) > 150:
            errors.append("Имя пользователя не может превышать 150 символов")
        
        if not self.email:
            errors.append("Email обязателен")
        elif '@' not in self.email:
            errors.append("Некорректный email")
        
        if not self.password:
            errors.append("Пароль обязателен")
        elif len(self.password) < 6:
            errors.append("Пароль должен быть не менее 6 символов")
        
        if self.password != self.password2:
            errors.append("Пароли не совпадают")
        
        return errors

@dataclass
class LoginDTO:
    username: str
    password: str
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'LoginDTO':
        return cls(
            username=data.get('username', ''),
            password=data.get('password', '')
        )
    
    def validate(self) -> List[str]:
        errors = []
        
        if not self.username:
            errors.append("Имя пользователя обязательно")
        
        if not self.password:
            errors.append("Пароль обязателен")
        
        return errors

@dataclass
class UpdateProfileDTO:
    bio: Optional[str] = None
    telegram: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    theme_preference: Optional[str] = None
    email_notifications: Optional[bool] = None
    auto_save_interval: Optional[int] = None
    
    @classmethod
    def from_request(cls, data: Dict[str, Any]) -> 'UpdateProfileDTO':
        return cls(
            bio=data.get('bio'),
            telegram=data.get('telegram'),
            github=data.get('github'),
            website=data.get('website'),
            theme_preference=data.get('theme_preference'),
            email_notifications=data.get('email_notifications'),
            auto_save_interval=data.get('auto_save_interval')
        )
    
    def validate(self) -> List[str]:
        errors = []
        
        if self.bio is not None and len(self.bio) > 500:
            errors.append("Bio не может превышать 500 символов")
        
        if self.telegram is not None and len(self.telegram) > 100:
            errors.append("Telegram не может превышать 100 символов")
        
        if self.github is not None and len(self.github) > 100:
            errors.append("GitHub не может превышать 100 символов")
        
        if self.auto_save_interval is not None and self.auto_save_interval < 1:
            errors.append("Интервал автосохранения должен быть больше 0")
        
        return errors

@dataclass
class TokenDTO:
    token: str
    user: UserDTO
    
    @classmethod
    def create(cls, token: str, user_dto: UserDTO) -> 'TokenDTO':
        return cls(
            token=token,
            user=user_dto
        )

@dataclass
class StatisticsDTO:
    total_notes: int
    total_words: int
    join_date: str
    last_active: Optional[str]
    
    @classmethod
    def from_profile(cls, profile: ProfileEntity, join_date: datetime, last_active: Optional[datetime]) -> 'StatisticsDTO':
        moscow_tz = pytz.timezone('Europe/Moscow')
        
        join_date_str = None
        if join_date:
            if isinstance(join_date, datetime):
                local_time = join_date.astimezone(moscow_tz)
                join_date_str = local_time.strftime('%d.%m.%Y')
            else:
                join_date_str = join_date
        
        last_active_str = None
        if last_active:
            if isinstance(last_active, datetime):
                local_time = last_active.astimezone(moscow_tz)
                last_active_str = local_time.strftime('%d.%m.%Y %H:%M')
            else:
                last_active_str = last_active
        
        return cls(
            total_notes=profile.total_notes,
            total_words=profile.total_words,
            join_date=join_date_str,
            last_active=last_active_str
        )