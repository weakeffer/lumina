from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from .serializers import UserRegistrationSerializer, UserProfileSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data = request.data)
    if serializer.is_valid():
        user = serializer.save()

        token, created = Token.objects.get_or_create(user = user)

        return Response({
            'user':{
                'id': user.id,
                'username' : user.username,
                'email': user.email
            },
            'token': token.key,
            'message': 'Регистрация успешна'
        }, status= status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({
            'error': 'Введите username и password'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(username = username)

    except User.DoesNotExist:
        return Response({
            'errror': 'Пользователь не существует'
        }, status=status.HTTP_404_NOT_FOUND)
    
    user = authenticate(username = username, password = password)

    if user:
        token,created = Token.objects.get_or_create(user=user)
        login(request, user)

        return Response({
            'token' : token.key,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'message': 'Успешная авторизация'
        }, status=status.HTTP_200_OK)
    
    else:
        return Response({
            'error': 'Неверные учетные данные'
        },status=status.HTTP_400_BAD_REQUEST)






