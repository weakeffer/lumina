from typing import Optional, List
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from ..domain.entities import UserEntity, ProfileEntity
from ..domain.interfaces import UserRepository, ProfileRepository
from ..models import Profile

class DjangoUserRepository(UserRepository):
    def _user_to_entity(self, user: User) -> UserEntity:
        try:
            profile = user.profile
            avatar_url = profile.avatar_url
            print(f"🔍 РЕПОЗИТОРИЙ - avatar_url: {avatar_url}") 
            profile_entity = ProfileEntity(
                id=profile.id,
                user_id=user.id,
                avatar=profile.avatar.name if profile.avatar else None,
                avatar_url=profile.avatar_url,
                bio=profile.bio or "",
                telegram=profile.telegram or "",
                github=profile.github or "",
                website=profile.website or "",
                theme_preference=profile.theme_preference,
                email_notifications=profile.email_notifications,
                auto_save_interval=profile.auto_save_interval,
                total_notes=profile.total_notes,
                total_words=profile.total_words,
                created_at=profile.created_at,
                updated_at=profile.updated_at
            )
        except Profile.DoesNotExist:
            profile_entity = None
        
        return UserEntity(
            id=user.id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            date_joined=user.date_joined,
            last_login=user.last_login,
            profile=profile_entity
        )
    
    def _entity_to_user(self, entity: UserEntity, user: Optional[User] = None) -> User:
        if user is None:
            user = User()
        
        user.username = entity.username
        user.email = entity.email
        user.first_name = entity.first_name
        user.last_name = entity.last_name
        user.is_active = entity.is_active
        
        return user
    
    def get_by_id(self, user_id: int) -> Optional[UserEntity]:
        try:
            user = User.objects.get(id=user_id)
            return self._user_to_entity(user)
        except User.DoesNotExist:
            return None
    
    def get_by_username(self, username: str) -> Optional[UserEntity]:
        try:
            user = User.objects.get(username=username)
            return self._user_to_entity(user)
        except User.DoesNotExist:
            return None
    
    def get_by_email(self, email: str) -> Optional[UserEntity]:
        try:
            user = User.objects.get(email=email)
            return self._user_to_entity(user)
        except User.DoesNotExist:
            return None
    
    def create(self, username: str, email: str, password: str) -> UserEntity:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        return self._user_to_entity(user)
    
    def update(self, user: UserEntity) -> UserEntity:
        try:
            django_user = User.objects.get(id=user.id)
            django_user = self._entity_to_user(user, django_user)
            django_user.save()
            return self._user_to_entity(django_user)
        except User.DoesNotExist:
            raise ValueError(f"Пользователь с id {user.id} не найден")
    
    def authenticate(self, username: str, password: str) -> Optional[UserEntity]:
        user = authenticate(username=username, password=password)
        if user:
            return self._user_to_entity(user)
        return None
    
    def update_last_login(self, user_id: int) -> None:
        try:
            user = User.objects.get(id=user_id)
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
        except User.DoesNotExist:
            pass


class DjangoProfileRepository(ProfileRepository):
    def _profile_to_entity(self, profile: Profile) -> ProfileEntity:
        return ProfileEntity(
            id=profile.id,
            user_id=profile.user_id,
            avatar=profile.avatar.name if profile.avatar else None,
            avatar_url=profile.avatar_url,
            bio=profile.bio or "",
            telegram=profile.telegram or "",
            github=profile.github or "",
            website=profile.website or "",
            theme_preference=profile.theme_preference,
            email_notifications=profile.email_notifications,
            auto_save_interval=profile.auto_save_interval,
            total_notes=profile.total_notes,
            total_words=profile.total_words,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
    
    def _entity_to_profile(self, entity: ProfileEntity, profile: Optional[Profile] = None) -> Profile:
        if profile is None:
            profile = Profile(user_id=entity.user_id)
        
        if entity.avatar is not None:
            profile.avatar = entity.avatar
        profile.bio = entity.bio
        profile.telegram = entity.telegram
        profile.github = entity.github
        profile.website = entity.website
        profile.theme_preference = entity.theme_preference
        profile.email_notifications = entity.email_notifications
        profile.auto_save_interval = entity.auto_save_interval
        profile.total_notes = entity.total_notes
        profile.total_words = entity.total_words
        
        return profile
    
    def get_by_user_id(self, user_id: int) -> Optional[ProfileEntity]:
        try:
            profile = Profile.objects.get(user_id=user_id)
            return self._profile_to_entity(profile)
        except Profile.DoesNotExist:
            return None
    
    def create(self, user_id: int) -> ProfileEntity:
        profile = Profile.objects.create(user_id=user_id)
        return self._profile_to_entity(profile)
    
    def update(self, profile: ProfileEntity) -> ProfileEntity:
        try:
            django_profile = Profile.objects.get(id=profile.id)
            django_profile = self._entity_to_profile(profile, django_profile)
            django_profile.save()
            return self._profile_to_entity(django_profile)
        except Profile.DoesNotExist:
            raise ValueError(f"Профиль с id {profile.id} не найден")
    
    def update_stats(self, user_id: int) -> ProfileEntity:
        try:
            profile = Profile.objects.get(user_id=user_id)
            profile.update_stats()
            return self._profile_to_entity(profile)
        except Profile.DoesNotExist:
            raise ValueError(f"Профиль для пользователя {user_id} не найден")