# backend/lumina/notes/tests/test_hexagonal.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from django.utils import timezone
import json

from ..domain.entities import NoteEntity, NoteGroupEntity
from ..domain.dto import CreateNoteDTO, UpdateNoteDTO, CreateGroupDTO
from ..infrastructure.repositories import DjangoNoteRepository, DjangoNoteGroupRepository
from ..application.services import NoteService, NoteGroupService
from ..application.service_factory import ServiceFactory
from ..models import Notes, NoteGroup

class HexagonalArchitectureTests(TestCase):
    """Тесты для проверки гексагональной архитектуры"""
    
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
    
    def test_domain_entity_creation(self):
        """Тест создания доменной сущности"""
        note_entity = NoteEntity(
            title='Domain Note',
            text='Domain Content',
            user_id=self.user.id,
            group_id=self.group.id
        )
        
        self.assertEqual(note_entity.title, 'Domain Note')
        self.assertEqual(note_entity.text, 'Domain Content')
        self.assertEqual(note_entity.user_id, self.user.id)
        self.assertEqual(note_entity.group_id, self.group.id)
        self.assertFalse(note_entity.is_deleted)
        self.assertEqual(note_entity.images, [])
    
    def test_domain_entity_methods(self):
        """Тест методов доменной сущности"""
        note_entity = NoteEntity(
            title='Test',
            text='Content',
            user_id=self.user.id
        )
        
        # Тест обновления
        note_entity.update_content(title='New Title', text='New Content')
        self.assertEqual(note_entity.title, 'New Title')
        self.assertEqual(note_entity.text, 'New Content')
        
        # Тест перемещения
        note_entity.move_to_group(5)
        self.assertEqual(note_entity.group_id, 5)
        
        # Тест удаления
        note_entity.delete()
        self.assertTrue(note_entity.is_deleted)
        self.assertIsNotNone(note_entity.deleted_at)
        
        # Тест восстановления
        note_entity.restore()
        self.assertFalse(note_entity.is_deleted)
        self.assertIsNone(note_entity.deleted_at)
    
    def test_repository_get_by_id(self):
        """Тест репозитория - получение по ID"""
        repo = DjangoNoteRepository()
        
        # Получаем существующую заметку
        entity = repo.get_by_id(self.note.id, self.user.id)
        self.assertIsNotNone(entity)
        self.assertEqual(entity.title, 'Test Note')
        self.assertEqual(entity.text, 'Test Content')
        
        # Пытаемся получить несуществующую
        entity = repo.get_by_id(99999, self.user.id)
        self.assertIsNone(entity)
    
    def test_repository_create(self):
        """Тест репозитория - создание"""
        repo = DjangoNoteRepository()
        
        entity = NoteEntity(
            title='New Note',
            text='New Content',
            user_id=self.user.id,
            group_id=self.group.id
        )
        
        created = repo.create(entity)
        
        self.assertIsNotNone(created.id)
        self.assertEqual(created.title, 'New Note')
        self.assertEqual(created.text, 'New Content')
        
        # Проверяем, что сохранилось в БД
        db_note = Notes.objects.get(id=created.id)
        self.assertEqual(db_note.title, 'New Note')
    
    def test_repository_update(self):
        """Тест репозитория - обновление"""
        repo = DjangoNoteRepository()
        
        entity = repo.get_by_id(self.note.id, self.user.id)
        entity.update_content(title='Updated Title')
        
        updated = repo.update(entity)
        
        self.assertEqual(updated.title, 'Updated Title')
        
        # Проверяем в БД
        db_note = Notes.objects.get(id=self.note.id)
        self.assertEqual(db_note.title, 'Updated Title')
    
    def test_repository_delete(self):
        """Тест репозитория - удаление"""
        repo = DjangoNoteRepository()
        
        # Мягкое удаление
        result = repo.delete(self.note.id, self.user.id, hard_delete=False)
        self.assertTrue(result)
        
        # Проверяем, что заметка помечена как удаленная
        db_note = Notes.objects.get(id=self.note.id)
        self.assertTrue(db_note.is_deleted)
        self.assertIsNotNone(db_note.deleted_at)
        
        # Полное удаление
        result = repo.delete(self.note.id, self.user.id, hard_delete=True)
        self.assertTrue(result)
        
        # Проверяем, что заметка удалена из БД
        with self.assertRaises(Notes.DoesNotExist):
            Notes.objects.get(id=self.note.id)
    
    def test_service_create_note(self):
        """Тест сервиса - создание заметки"""
        service = ServiceFactory.get_note_service()
        
        dto = CreateNoteDTO(
            title='Service Note',
            text='Service Content',
            group_id=self.group.id
        )
        
        note, message = service.create_note(self.user.id, dto)
        
        self.assertIsNotNone(note)
        self.assertEqual(note.title, 'Service Note')
        self.assertEqual(message, 'Заметка успешно создана')
        
        # Проверяем в БД
        db_note = Notes.objects.get(id=note.id)
        self.assertEqual(db_note.title, 'Service Note')
    
    def test_service_get_user_notes(self):
        """Тест сервиса - получение списка заметок"""
        service = ServiceFactory.get_note_service()
        
        notes = service.get_user_notes(self.user.id)
        
        self.assertEqual(len(notes), 1)
        self.assertEqual(notes[0].title, 'Test Note')
    
    def test_service_delete_and_restore(self):
        """Тест сервиса - удаление и восстановление"""
        service = ServiceFactory.get_note_service()
        
        # Удаляем
        success, message = service.delete_note(self.note.id, self.user.id)
        self.assertTrue(success)
        
        # Проверяем, что заметка в корзине
        deleted = service.get_deleted_notes(self.user.id)
        self.assertEqual(len(deleted), 1)
        
        # Восстанавливаем
        note, message = service.restore_note(self.note.id, self.user.id)
        self.assertIsNotNone(note)
        
        # Проверяем, что заметка снова активна
        active = service.get_user_notes(self.user.id)
        self.assertEqual(len(active), 1)
    
    def test_group_service(self):
        """Тест сервиса групп"""
        service = ServiceFactory.get_group_service()
        
        # Создание группы
        dto = CreateGroupDTO(
            name='New Group',
            description='Test Description',
            color='red',
            icon='Star'
        )
        
        group, errors = service.create_group(self.user.id, dto)
        self.assertIsNotNone(group)
        self.assertEqual(errors, [])
        self.assertEqual(group.name, 'New Group')
        
        # Получение списка групп
        groups = service.get_user_groups(self.user.id)
        self.assertEqual(len(groups), 2)  # Test Group + New Group
        
        # Получение заметок группы
        notes = service.get_group_notes(group.id, self.user.id)
        self.assertEqual(len(notes), 0)  # Новая группа пустая
        
        # Добавление заметок в группу
        count, message = service.add_notes_to_group(
            group.id, self.user.id, [self.note.id]
        )
        self.assertEqual(count, 1)
        
        # Проверяем, что заметка переместилась
        notes = service.get_group_notes(group.id, self.user.id)
        self.assertEqual(len(notes), 1)
    
    def test_api_v2_endpoints(self):
        """Тест API v2 эндпоинтов"""
        # Получение списка заметок
        response = self.client.get('/api/v2/notes/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        
        # Создание заметки
        data = {
            'title': 'API Note',
            'text': 'API Content',
            'group': self.group.id
        }
        response = self.client.post('/api/v2/notes/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'API Note')
        
        # Получение детальной информации
        note_id = response.data['id']
        response = self.client.get(f'/api/v2/notes/{note_id}/')
        self.assertEqual(response.status_code, 200)
        
        # Обновление заметки
        data = {'title': 'Updated API Note'}
        response = self.client.patch(f'/api/v2/notes/{note_id}/', data)
        self.assertEqual(response.status_code, 200)
        
        # Удаление заметки
        response = self.client.delete(f'/api/v2/notes/{note_id}/')
        self.assertEqual(response.status_code, 200)
        
        # Проверка корзины
        response = self.client.get('/api/v2/notes/deleted/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
    
    def test_both_versions_work(self):
        """Тест, что обе версии API работают параллельно"""
        
        # Старая версия (v1)
        response_v1 = self.client.get('/api/notes/')
        self.assertEqual(response_v1.status_code, 200)
        
        # Новая версия (v2)
        response_v2 = self.client.get('/api/v2/notes/')
        self.assertEqual(response_v2.status_code, 200)
        
        # Сравниваем количество заметок
        self.assertEqual(len(response_v1.data), len(response_v2.data))
    
    def tearDown(self):
        """Очистка после тестов"""
        ServiceFactory.clear()