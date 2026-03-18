# backend/lumina/notes/tests/test_api_v2.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from django.utils import timezone
import json
import pytz

from ..models import Notes, NoteGroup

class APIV2Tests(TestCase):
    """Тесты для v2 API (гексагональная архитектура)"""
    
    def setUp(self):
        """Подготовка тестовых данных"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Создаем тестовую группу
        self.group = NoteGroup.objects.create(
            name='Test Group',
            user=self.user,
            color='blue',
            icon='Folder'
        )
        
        # Создаем тестовую заметку
        self.note = Notes.objects.create(
            title='Test Note',
            text='Test Content',
            user=self.user,
            group=self.group
        )
    
    def test_create_note(self):
        """Тест создания заметки"""
        response = self.client.post('/api/v2/notes/', {
            'title': 'New Note',
            'text': 'New Content',
            'group': self.group.id
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'New Note')
        self.assertEqual(response.data['text'], 'New Content')
        self.assertTrue('id' in response.data)
        
        # Проверяем, что заметка создалась в БД
        note = Notes.objects.get(id=response.data['id'])
        self.assertEqual(note.title, 'New Note')
    
    def test_list_notes(self):
        """Тест получения списка заметок"""
        response = self.client.get('/api/v2/notes/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Note')
    
    def test_get_note_detail(self):
        """Тест получения детальной информации"""
        response = self.client.get(f'/api/v2/notes/{self.note.id}/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Test Note')
        self.assertEqual(response.data['text'], 'Test Content')
    
    def test_update_note(self):
        """Тест обновления заметки"""
        response = self.client.patch(f'/api/v2/notes/{self.note.id}/', {
            'title': 'Updated Title'
        })
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['title'], 'Updated Title')
        
        # Проверяем в БД
        self.note.refresh_from_db()
        self.assertEqual(self.note.title, 'Updated Title')
    
    def test_delete_note(self):
        """Тест удаления заметки"""
        response = self.client.delete(f'/api/v2/notes/{self.note.id}/')
        
        self.assertEqual(response.status_code, 200)
        
        # Проверяем, что заметка в корзине
        self.note.refresh_from_db()
        self.assertTrue(self.note.is_deleted)
        self.assertIsNotNone(self.note.deleted_at)
    
    def test_restore_note(self):
        """Тест восстановления заметки"""
        # Сначала удаляем
        self.client.delete(f'/api/v2/notes/{self.note.id}/')
        
        # Затем восстанавливаем
        response = self.client.post(f'/api/v2/notes/{self.note.id}/restore/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['message'], 'Заметка восстановлена')
        
        # Проверяем, что заметка активна
        self.note.refresh_from_db()
        self.assertFalse(self.note.is_deleted)
        self.assertIsNone(self.note.deleted_at)
    
    def test_deleted_list(self):
        """Тест получения списка удаленных заметок"""
        # Удаляем заметку
        self.client.delete(f'/api/v2/notes/{self.note.id}/')
        
        # Получаем список удаленных
        response = self.client.get('/api/v2/notes/deleted/')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Note')
    
    def test_empty_trash(self):
        """Тест очистки корзины"""
        # Создаем и удаляем несколько заметок
        note2 = Notes.objects.create(
            title='Note 2',
            text='Content 2',
            user=self.user
        )
        
        self.client.delete(f'/api/v2/notes/{self.note.id}/')
        self.client.delete(f'/api/v2/notes/{note2.id}/')
        
        # Очищаем корзину
        response = self.client.delete('/api/v2/notes/empty_trash/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('Удалено 2 заметок', response.data['message'])
        
        # Проверяем, что заметок в корзине нет
        deleted_response = self.client.get('/api/v2/notes/deleted/')
        self.assertEqual(len(deleted_response.data), 0)
    
    def test_move_to_group(self):
        """Тест перемещения заметки в группу"""
        # Создаем новую группу
        new_group = NoteGroup.objects.create(
            name='New Group',
            user=self.user
        )
        
        # Перемещаем заметку
        response = self.client.post(f'/api/v2/notes/{self.note.id}/move-to-group/', {
            'group_id': new_group.id
        })
        
        self.assertEqual(response.status_code, 200)
        
        # Проверяем
        self.note.refresh_from_db()
        self.assertEqual(self.note.group.id, new_group.id)
    
    def test_notes_by_groups(self):
        """Тест получения заметок по группам"""
        response = self.client.get('/api/v2/notes/by-groups/')
        
        self.assertEqual(response.status_code, 200)
        
        # Должны быть две группы: "Без группы" и "Test Group"
        groups = response.data
        self.assertEqual(len(groups), 2)
        
        # Находим нашу группу
        test_group = next(g for g in groups if g['id'] == self.group.id)
        self.assertEqual(test_group['name'], 'Test Group')
        self.assertEqual(len(test_group['notes']), 1)
        self.assertEqual(test_group['notes'][0]['title'], 'Test Note')
    
    def test_group_crud(self):
        """Тест CRUD для групп"""
        # Создание
        create_response = self.client.post('/api/v2/groups/', {
            'name': 'API Group',
            'description': 'Created from API',
            'color': 'red',
            'icon': 'Star'
        })
        
        self.assertEqual(create_response.status_code, 201)
        group_id = create_response.data['id']
        
        # Получение списка
        list_response = self.client.get('/api/v2/groups/')
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 2)  # Test Group + API Group
        
        # Обновление
        update_response = self.client.patch(f'/api/v2/groups/{group_id}/', {
            'name': 'Updated Group'
        })
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data['name'], 'Updated Group')
        
        # Удаление
        delete_response = self.client.delete(f'/api/v2/groups/{group_id}/')
        self.assertEqual(delete_response.status_code, 204)
        
        # Проверяем, что группа удалена
        list_after = self.client.get('/api/v2/groups/')
        self.assertEqual(len(list_after.data), 1)