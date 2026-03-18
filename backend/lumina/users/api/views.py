from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from django.utils import timezone
from django.contrib.auth.models import User

from ..application.service_factory import ServiceFactory
from ..domain.dto import RegisterDTO, LoginDTO, UpdateProfileDTO

class UserViewSet(viewsets.ViewSet):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.auth_service = ServiceFactory.get_auth_service()
        self.profile_service = ServiceFactory.get_profile_service()
    
    def get_permissions(self):
        if self.action in ['register', 'login']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        dto = RegisterDTO.from_request(request.data)
        
        user_dto, errors = self.auth_service.register(dto)
        
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        django_user = User.objects.get(id=user_dto.id)
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=django_user)

        self.profile_service.refresh_stats(user_dto.id)
        
        return Response({
            'user': {
                'id': user_dto.id,
                'username': user_dto.username,
                'email': user_dto.email,
                'first_name': user_dto.first_name,
                'last_name': user_dto.last_name,
                'avatar': user_dto.profile.avatar,
                'avatar_url': user_dto.profile.avatar_url,
                'bio': user_dto.profile.bio,
                'telegram': user_dto.profile.telegram,
                'github': user_dto.profile.github,
                'website': user_dto.profile.website,
                'theme_preference': user_dto.profile.theme_preference,
                'email_notifications': user_dto.profile.email_notifications,
                'auto_save_interval': user_dto.profile.auto_save_interval,
                'total_notes': user_dto.profile.total_notes,
                'total_words': user_dto.profile.total_words,
                'joined_date': user_dto.date_joined.split('T')[0] if user_dto.date_joined else None,
                'last_login': user_dto.last_login,
            },
            'token': token.key,
            'message': 'Успешная регистрация'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        dto = LoginDTO.from_request(request.data)
        
        token_dto, errors = self.auth_service.login(dto, request)
        
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.profile_service.refresh_stats(token_dto.user.id)
        
        return Response({
            'token': token_dto.token,
            'user': {
                'id': token_dto.user.id,
                'username': token_dto.user.username,
                'email': token_dto.user.email,
                'first_name': token_dto.user.first_name,
                'last_name': token_dto.user.last_name,
                'avatar': token_dto.user.profile.avatar,
                'avatar_url': token_dto.user.profile.avatar_url,
                'bio': token_dto.user.profile.bio,
                'telegram': token_dto.user.profile.telegram,
                'github': token_dto.user.profile.github,
                'website': token_dto.user.profile.website,
                'theme_preference': token_dto.user.profile.theme_preference,
                'email_notifications': token_dto.user.profile.email_notifications,
                'auto_save_interval': token_dto.user.profile.auto_save_interval,
                'total_notes': token_dto.user.profile.total_notes,
                'total_words': token_dto.user.profile.total_words,
                'joined_date': token_dto.user.date_joined.split('T')[0] if token_dto.user.date_joined else None,
                'last_login': token_dto.user.last_login,
            },
            'message': 'Успешная авторизация'
        })
    
    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        try:
            self.auth_service.logout(request)
            return Response({'message': 'Успешный выход'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get', 'put', 'patch'], url_path='profile')
    def profile(self, request):
        if request.method == 'GET':
            user_dto = self.profile_service.get_profile(request.user.id)
            if not user_dto:
                return Response(
                    {'error': 'Профиль не найден'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'id': user_dto.id,
                'username': user_dto.username,
                'email': user_dto.email,
                'first_name': user_dto.first_name,
                'last_name': user_dto.last_name,
                'avatar': user_dto.profile.avatar,
                'avatar_url': user_dto.profile.avatar_url,
                'bio': user_dto.profile.bio,
                'telegram': user_dto.profile.telegram,
                'github': user_dto.profile.github,
                'website': user_dto.profile.website,
                'theme_preference': user_dto.profile.theme_preference,
                'email_notifications': user_dto.profile.email_notifications,
                'auto_save_interval': user_dto.profile.auto_save_interval,
                'total_notes': user_dto.profile.total_notes,
                'total_words': user_dto.profile.total_words,
                'joined_date': user_dto.date_joined.split('T')[0] if user_dto.date_joined else None,
                'last_login': user_dto.last_login,
                'date_joined': user_dto.date_joined,
            })
        dto = UpdateProfileDTO.from_request(request.data)
        
        user_dto, errors = self.profile_service.update_profile(request.user.id, dto)
        
        if errors:
            return Response(
                {'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'id': user_dto.id,
            'username': user_dto.username,
            'email': user_dto.email,
            'first_name': user_dto.first_name,
            'last_name': user_dto.last_name,
            'avatar': user_dto.profile.avatar,
            'avatar_url': user_dto.profile.avatar_url,
            'bio': user_dto.profile.bio,
            'telegram': user_dto.profile.telegram,
            'github': user_dto.profile.github,
            'website': user_dto.profile.website,
            'theme_preference': user_dto.profile.theme_preference,
            'email_notifications': user_dto.profile.email_notifications,
            'auto_save_interval': user_dto.profile.auto_save_interval,
            'total_notes': user_dto.profile.total_notes,
            'total_words': user_dto.profile.total_words,
        })
    
    @action(detail=False, methods=['post'], url_path='upload_avatar')
    def upload_avatar(self, request):
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Файл не предоставлен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_url, message = self.profile_service.upload_avatar(
            request.user.id,
            request.FILES['avatar']
        )
        
        if not avatar_url:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'message': message,
            'avatar_url': avatar_url
        })
    
    @action(detail=False, methods=['post'], url_path='refresh_stats')
    def refresh_stats(self, request):
        profile_dto = self.profile_service.refresh_stats(request.user.id)
        
        if not profile_dto:
            return Response(
                {'error': 'Профиль не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'message': 'Статистика обновлена',
            'total_notes': profile_dto.total_notes,
            'total_words': profile_dto.total_words
        })
    
    @action(detail=False, methods=['get'], url_path='statistics')
    def statistics(self, request):
        stats_dto = self.profile_service.get_statistics(request.user.id)
        
        if not stats_dto:
            return Response(
                {'error': 'Статистика не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'total_notes': stats_dto.total_notes,
            'total_words': stats_dto.total_words,
            'join_date': stats_dto.join_date,
            'last_active': stats_dto.last_active
        })