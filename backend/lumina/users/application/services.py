from typing import Optional, List, Tuple
from django.utils import timezone
from django.contrib.auth import login as django_login, logout as django_logout
from rest_framework.authtoken.models import Token

from ..domain.entities import UserEntity, ProfileEntity
from ..domain.interfaces import UserRepository, ProfileRepository
from ..domain.dto import (
    RegisterDTO, LoginDTO, UpdateProfileDTO,
    UserDTO, ProfileDTO, TokenDTO, StatisticsDTO
)

class AuthService:
    def __init__(self, user_repository: UserRepository, profile_repository: ProfileRepository):
        self.user_repository = user_repository
        self.profile_repository = profile_repository
    
    def register(self, dto: RegisterDTO) -> Tuple[Optional[UserDTO], List[str]]:
        errors = dto.validate()
        if errors:
            return None, errors

        existing_user = self.user_repository.get_by_username(dto.username)
        if existing_user:
            return None, ["Пользователь с таким именем уже существует"]
        
        existing_email = self.user_repository.get_by_email(dto.email)
        if existing_email:
            return None, ["Пользователь с таким email уже существует"]
        
        try:
            user = self.user_repository.create(
                username=dto.username,
                email=dto.email,
                password=dto.password
            )

            profile = self.profile_repository.get_by_user_id(user.id)

            profile_dto = ProfileDTO.from_entity(profile, profile.avatar_url)
            user_dto = UserDTO.from_entity(user, profile_dto)
            
            return user_dto, []
            
        except Exception as e:
            return None, [f"Ошибка при регистрации: {str(e)}"]
    
    def login(self, dto: LoginDTO, request) -> Tuple[Optional[TokenDTO], List[str]]:
        errors = dto.validate()
        if errors:
            return None, errors

        user_entity = self.user_repository.authenticate(dto.username, dto.password)
        
        if not user_entity:
            return None, ["Неверное имя пользователя или пароль"]

        self.user_repository.update_last_login(user_entity.id)

        from django.contrib.auth.models import User
        django_user = User.objects.get(id=user_entity.id)

        token, _ = Token.objects.get_or_create(user=django_user)

        django_login(request, django_user)

        profile = self.profile_repository.get_by_user_id(user_entity.id)
        profile_dto = ProfileDTO.from_entity(profile, profile.avatar_url)
        user_dto = UserDTO.from_entity(user_entity, profile_dto)
        
        return TokenDTO.create(token.key, user_dto), []
    
    def logout(self, request) -> None:
        if request.user.is_authenticated:
            try:
                token = Token.objects.get(user=request.user)
                token.delete()
            except Token.DoesNotExist:
                pass
            
            django_logout(request)


class ProfileService:
    def __init__(self, user_repository: UserRepository, profile_repository: ProfileRepository):
        self.user_repository = user_repository
        self.profile_repository = profile_repository
    
    def get_profile(self, user_id: int) -> Optional[UserDTO]:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            return None
        
        profile = self.profile_repository.get_by_user_id(user_id)
        if not profile:
            return None
        
        profile_dto = ProfileDTO.from_entity(profile, profile.avatar_url)
        return UserDTO.from_entity(user, profile_dto)
    
    def update_profile(self, user_id: int, dto: UpdateProfileDTO) -> Tuple[Optional[UserDTO], List[str]]:
        errors = dto.validate()
        if errors:
            return None, errors
        
        user = self.user_repository.get_by_id(user_id)
        if not user:
            return None, ["Пользователь не найден"]
        
        profile = self.profile_repository.get_by_user_id(user_id)
        if not profile:
            return None, ["Профиль не найден"]
         
        update_data = {}
        if dto.bio is not None:
            update_data['bio'] = dto.bio
        if dto.telegram is not None:
            update_data['telegram'] = dto.telegram
        if dto.github is not None:
            update_data['github'] = dto.github
        if dto.website is not None:
            update_data['website'] = dto.website
        if dto.theme_preference is not None:
            update_data['theme_preference'] = dto.theme_preference
        if dto.email_notifications is not None:
            update_data['email_notifications'] = dto.email_notifications
        if dto.auto_save_interval is not None:
            update_data['auto_save_interval'] = dto.auto_save_interval
        
        profile.update_profile(**update_data)
        updated_profile = self.profile_repository.update(profile)
        
        profile_dto = ProfileDTO.from_entity(updated_profile, updated_profile.avatar_url)
        return UserDTO.from_entity(user, profile_dto), []
    
    def refresh_stats(self, user_id: int) -> Optional[ProfileDTO]:
        try:
            profile = self.profile_repository.update_stats(user_id)
            return ProfileDTO.from_entity(profile, profile.avatar_url)
        except ValueError:
            return None
    
    def get_statistics(self, user_id: int) -> Optional[StatisticsDTO]:
        user = self.user_repository.get_by_id(user_id)
        if not user:
            return None
        
        profile = self.profile_repository.get_by_user_id(user_id)
        if not profile:
            return None
        
        return StatisticsDTO.from_profile(
            profile=profile,
            join_date=user.date_joined,
            last_active=user.last_login
        )
    
    def upload_avatar(self, user_id: int, avatar_file) -> Tuple[Optional[str], str]:
        try:
            from django.contrib.auth.models import User
            user = User.objects.get(id=user_id)
            
            if user.profile.avatar:
                user.profile.avatar.delete(save=False)

            user.profile.avatar = avatar_file
            user.profile.save()
            
            return user.profile.avatar.url, "Аватар успешно загружен"
            
        except User.DoesNotExist:
            return None, "Пользователь не найден"
        except Exception as e:
            return None, f"Ошибка при загрузке аватара: {str(e)}"