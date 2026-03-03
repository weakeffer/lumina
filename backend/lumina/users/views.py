from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.utils import timezone
from .serializers import UserRegistrationSerializer, UserProfileSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'create' or self.action == 'register':
            return UserRegistrationSerializer
        return UserProfileSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'register', 'login']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        token, _ = Token.objects.get_or_create(user=user)

        user.profile.update_stats()
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'token': token.key,
            'message': 'Успешная регистрация'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'error': 'Укажите username и password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            
            token, _ = Token.objects.get_or_create(user=user)

            user.profile.update_stats()
            
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
                'message': 'Успешная авторизация'
            })
        else:
            return Response({
                'error': 'Неверные данные'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        try:
            request.user.auth_token.delete()
            return Response({'message': 'Успешный выход'})
        except:
            return Response({'message': 'Токен не найден'})
    
    @action(detail=False, methods=['get', 'put', 'patch'], 
            permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        if request.method == 'GET':
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data)
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        request.user.profile.update_stats()
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def upload_avatar(self, request):
        if 'avatar' not in request.FILES:
            return Response({'error': 'Файл не предоставлен'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile = request.user.profile
        profile.avatar = request.FILES['avatar']
        profile.save()
        
        return Response({
            'message': 'Аватар успешно загружен',
            'avatar_url': profile.avatar.url if profile.avatar else None
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def refresh_stats(self, request):
        profile = request.user.profile
        profile.update_stats()
        
        return Response({
            'message': 'Статистика обновлена',
            'total_notes': profile.total_notes,
            'total_words': profile.total_words
        })