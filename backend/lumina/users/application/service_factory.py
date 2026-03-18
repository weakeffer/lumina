from .services import AuthService, ProfileService
from ..infrastructure.repositories import DjangoUserRepository, DjangoProfileRepository

class ServiceFactory:
    _auth_service = None
    _profile_service = None
    
    @classmethod
    def get_auth_service(cls) -> AuthService:
        if cls._auth_service is None:
            user_repo = DjangoUserRepository()
            profile_repo = DjangoProfileRepository()
            cls._auth_service = AuthService(user_repo, profile_repo)
        return cls._auth_service
    
    @classmethod
    def get_profile_service(cls) -> ProfileService:
        if cls._profile_service is None:
            user_repo = DjangoUserRepository()
            profile_repo = DjangoProfileRepository()
            cls._profile_service = ProfileService(user_repo, profile_repo)
        return cls._profile_service
    
    @classmethod
    def clear(cls):
        cls._auth_service = None
        cls._profile_service = None