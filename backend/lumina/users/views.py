from rest_framework.decorators import api_view, permission_classes, authentication_classes, action
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from .serializers import UserRegistrationSerializer, UserProfileSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    def get_serializer_class(self):
        if self.action in ['create', 'register']:
            return UserRegistrationSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return UserProfileSerializer
        return UserProfileSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        elif self.action in ['login', 'register']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        return self.register(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'], permission_classes = [permissions.AllowAny], url_path='register')
    def register(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception = True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user = user)
        return Response({
            'user' : {
                'id': user.id,
                'username' : user.username,
                'email' : user.email
            },
            'token': token.key,
            'message' : 'Успешная регистрация'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes = [permissions.AllowAny], url_path='login')
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({
                'error' : 'Укажите username и password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)

        if user:
            user.last_login = now()
            user.save(update_fields=['last_login'])

            token, created = Token.objects.get_or_create(user = user)
            return Response({
                'token' : token.key,
                'user_id' : user.id,
                'username' : user.username,
                'email': user.email,
                'last_login' : user.last_login.isoformat() if user.last_login else None,
                'message' : 'Успешная авторизация'
            })
        else:
            return Response({
                'error': 'Неверные данные'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail = False, methods=['post'], permission_classes = [permissions.IsAuthenticated])
    def logout(self,request):
        try:
            request.user.auth_token.delete()
            return Response({
                'message': 'Успешный выход'
            })
        except:
            return Response({
                'message' : 'Токен не найден'
            })
        
    @action(detail = False, methods=['get'], permission_classes = [permissions.IsAuthenticated])
    def profile(self,request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], permission_classes = [permissions.IsAuthenticated])
    def update_profile(self, request):
        serializer = self.get_serializer(
            request.user,
            data = request.data,
            partial = True
        )
        serializer.is_valid(raise_exception = True)
        serializer.save()
        return Response(serializer.data)

