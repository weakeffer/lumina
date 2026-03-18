# backend/lumina/users/tests/test_users_api_v2.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from django.utils import timezone

class UserAPIV2Tests(TestCase):
    """Тесты для v2 API пользователей"""
    
    def setUp(self):
        """Подготовка тестовых данных"""
        self.client = APIClient()
        
        # Тестовый пользователь
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_register(self):
        """Тест регистрации"""
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'password123',
            'password2': 'password123'
        })
        
        print(f"Register response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')
        
        # Проверяем, что пользователь создан
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_register_password_mismatch(self):
        """Тест регистрации с несовпадающими паролями"""
        response = self.client.post('/api/users/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'password123',
            'password2': 'different'
        })
        
        print(f"Register mismatch response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
    
    def test_login(self):
        """Тест входа"""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        print(f"Login response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_login_invalid(self):
        """Тест входа с неверными данными"""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        })
        
        print(f"Invalid login response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 400)
        self.assertIn('errors', response.data)
    
    def test_logout(self):
        """Тест выхода"""
        # Сначала логинимся
        login_response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        print(f"Login for logout: {login_response.status_code}")
        self.assertEqual(login_response.status_code, 200)
        
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Выходим
        logout_response = self.client.post('/api/users/logout/')
        print(f"Logout response: {logout_response.status_code} - {logout_response.data}")
        self.assertEqual(logout_response.status_code, 200)
        self.assertEqual(logout_response.data['message'], 'Успешный выход')
    
    def test_get_profile(self):
        """Тест получения профиля"""
        # Логинимся
        login_response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(login_response.status_code, 200)
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Получаем профиль
        response = self.client.get('/api/users/profile/')
        print(f"Get profile response: {response.status_code} - {response.data}")
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_update_profile(self):
        """Тест обновления профиля"""
        # Логинимся
        login_response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(login_response.status_code, 200)
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Обновляем профиль
        response = self.client.patch('/api/users/profile/', {
            'bio': 'Test bio',
            'telegram': '@testuser'
        })
        
        print(f"Update profile response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['bio'], 'Test bio')
        self.assertEqual(response.data['telegram'], '@testuser')
        
        # Проверяем в БД
        self.user.refresh_from_db()
        self.assertEqual(self.user.profile.bio, 'Test bio')
    
    def test_refresh_stats(self):
        """Тест обновления статистики"""
        # Логинимся
        login_response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(login_response.status_code, 200)
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Обновляем статистику
        response = self.client.post('/api/users/refresh_stats/')
        print(f"Refresh stats response: {response.status_code} - {response.data}")
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_notes', response.data)
        self.assertIn('total_words', response.data)
    
    def test_upload_avatar(self):
        """Тест загрузки аватара"""
        # Логинимся
        login_response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        
        self.assertEqual(login_response.status_code, 200)
        token = login_response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        
        # Создаем тестовый файл
        from django.core.files.uploadedfile import SimpleUploadedFile
        avatar_file = SimpleUploadedFile(
            "test.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        # Загружаем аватар
        response = self.client.post('/api/users/upload_avatar/', {
            'avatar': avatar_file
        }, format='multipart')
        
        print(f"Upload avatar response: {response.status_code} - {response.data}")
        self.assertEqual(response.status_code, 200)
        self.assertIn('avatar_url', response.data)