# backend/lumina/notes/tests/test_architecture_comparison.py
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from django.utils import timezone
import json
import pytz
from datetime import datetime

from ..models import Notes, NoteGroup
from ..domain.entities import NoteEntity, NoteGroupEntity
from ..domain.dto import NoteResponseDTO, NoteListDTO
from ..infrastructure.repositories import DjangoNoteRepository
from ..application.services import NoteService
from ..application.service_factory import ServiceFactory

class ArchitectureComparisonTests(TestCase):
    """
    Сравнительные тесты для старой и новой архитектуры
    Каждый тест показывает, как одна и та же операция выполняется в обеих архитектурах
    """
    
    def setUp(self):
        """Подготовка тестовых данных"""
        print("\n" + "="*80)
        print("🔧 ПОДГОТОВКА ТЕСТОВЫХ ДАННЫХ")
        print("="*80)
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        print(f"✅ Создан пользователь: {self.user.username} (ID: {self.user.id})")
        
        self.group = NoteGroup.objects.create(
            name='Тестовая группа',
            description='Описание группы',
            color='blue',
            icon='Folder',
            user=self.user
        )
        print(f"✅ Создана группа: {self.group.name} (ID: {self.group.id})")
        
        self.note = Notes.objects.create(
            title='Тестовая заметка',
            text='Это текст тестовой заметки',
            user=self.user,
            group=self.group
        )
        print(f"✅ Создана заметка: {self.note.title} (ID: {self.note.id})")
        
        self.client_v1 = APIClient()
        self.client_v1.force_authenticate(user=self.user)
        
        self.client_v2 = APIClient()
        self.client_v2.force_authenticate(user=self.user)
        
        self.service = ServiceFactory.get_note_service()
        self.group_service = ServiceFactory.get_group_service()
    
    def print_section(self, title):
        """Вывод заголовка секции"""
        print(f"\n📌 {title}")
        print("-" * 60)
    
    def print_result(self, arch, operation, result, expected=None):
        """Вывод результата операции"""
        status = "✅" if result == expected or expected is None else "❌"
        print(f"  {status} {arch}: {operation}")
        if result is not None:
            print(f"     Результат: {result}")
        if expected is not None and result != expected:
            print(f"     Ожидалось: {expected}")
    
    def debug_datetime(self, dt_value, name="datetime"):
        """Отладка datetime объектов"""
        print(f"\n  🔍 Отладка {name}:")
        print(f"     Тип: {type(dt_value)}")
        if isinstance(dt_value, datetime):
            print(f"     Значение: {dt_value}")
            print(f"     ISO: {dt_value.isoformat()}")
            print(f"     tzinfo: {dt_value.tzinfo}")
        else:
            print(f"     Значение (строка): {dt_value}")
    
    def test_1_create_note_comparison(self):
        """Тест 1: Сравнение создания заметки"""
        self.print_section("ТЕСТ 1: СОЗДАНИЕ ЗАМЕТКИ")
        
        # Старая архитектура (v1)
        print("\n  📦 Старая архитектура (v1):")
        v1_data = {
            'title': 'Заметка из v1',
            'text': 'Текст из старой архитектуры',
            'group': self.group.id
        }
        v1_response = self.client_v1.post('/api/notes/', v1_data)
        print(f"  Статус: {v1_response.status_code}")
        print(f"  Ответ: {json.dumps(v1_response.data, indent=2, ensure_ascii=False)[:200]}...")
        
        # Новая архитектура (v2)
        print("\n  🏗️ Новая архитектура (v2):")
        v2_data = {
            'title': 'Заметка из v2',
            'text': 'Текст из новой архитектуры',
            'group': self.group.id
        }
        v2_response = self.client_v2.post('/api/v2/notes/', v2_data)
        print(f"  Статус: {v2_response.status_code}")
        print(f"  Ответ: {json.dumps(v2_response.data, indent=2, ensure_ascii=False)[:200]}...")
        
        # Проверяем структуру ответов
        self.print_section("СРАВНЕНИЕ СТРУКТУРЫ ОТВЕТОВ")
        
        v1_keys = set(v1_response.data.keys()) if v1_response.data else set()
        v2_keys = set(v2_response.data.keys()) if v2_response.data else set()
        
        print(f"  v1 ключи: {sorted(v1_keys)}")
        print(f"  v2 ключи: {sorted(v2_keys)}")
        print(f"  Общие ключи: {sorted(v1_keys & v2_keys)}")
        print(f"  Уникальные для v1: {sorted(v1_keys - v2_keys)}")
        print(f"  Уникальные для v2: {sorted(v2_keys - v1_keys)}")
        
        self.assertEqual(v1_response.status_code, 201)
        self.assertEqual(v2_response.status_code, 201)
    
    def test_2_list_notes_comparison(self):
        """Тест 2: Сравнение получения списка заметок"""
        self.print_section("ТЕСТ 2: ПОЛУЧЕНИЕ СПИСКА ЗАМЕТОК")
        
        # Старая архитектура
        print("\n  📦 Старая архитектура (v1):")
        v1_response = self.client_v1.get('/api/notes/')
        print(f"  Статус: {v1_response.status_code}")
        print(f"  Количество заметок: {len(v1_response.data)}")
        
        if len(v1_response.data) > 0:
            first_note = v1_response.data[0]
            print("\n  Первая заметка (v1):")
            for key, value in first_note.items():
                if key in ['created_at_formatted', 'updated_at_formatted']:
                    print(f"    {key}: {value} (тип: {type(value).__name__})")
                else:
                    print(f"    {key}: {value}")
        
        # Новая архитектура
        print("\n  🏗️ Новая архитектура (v2):")
        v2_response = self.client_v2.get('/api/v2/notes/')
        print(f"  Статус: {v2_response.status_code}")
        print(f"  Количество заметок: {len(v2_response.data)}")
        
        if len(v2_response.data) > 0:
            first_note = v2_response.data[0]
            print("\n  Первая заметка (v2):")
            for key, value in first_note.items():
                if 'created_at' in key or 'updated_at' in key:
                    print(f"    {key}: {value} (тип: {type(value).__name__})")
                else:
                    print(f"    {key}: {value}")
        
        self.assertEqual(v1_response.status_code, 200)
        self.assertEqual(v2_response.status_code, 200)
        self.assertEqual(len(v1_response.data), len(v2_response.data))
    
    def test_3_datetime_handling_comparison(self):
        """Тест 3: Сравнение обработки дат"""
        self.print_section("ТЕСТ 3: ОБРАБОТКА ДАТ")
        
        # Получаем заметку из старой архитектуры
        v1_response = self.client_v1.get(f'/api/notes/{self.note.id}/')
        
        # Получаем заметку из новой архитектуры
        v2_response = self.client_v2.get(f'/api/v2/notes/{self.note.id}/')
        
        print("\n  📦 Старая архитектура (v1) - даты:")
        if 'created_at_formatted' in v1_response.data:
            self.debug_datetime(v1_response.data['created_at_formatted'], "created_at_formatted")
        if 'updated_at_formatted' in v1_response.data:
            self.debug_datetime(v1_response.data['updated_at_formatted'], "updated_at_formatted")
        
        print("\n  🏗️ Новая архитектура (v2) - даты:")
        if 'created_at' in v2_response.data:
            self.debug_datetime(v2_response.data['created_at'], "created_at")
        if 'updated_at' in v2_response.data:
            self.debug_datetime(v2_response.data['updated_at'], "updated_at")
        
        # Проверяем, что даты конвертируются правильно
        self.assertEqual(v1_response.status_code, 200)
        self.assertEqual(v2_response.status_code, 200)
    
    def test_4_delete_and_restore_comparison(self):
        """Тест 4: Сравнение удаления и восстановления"""
        self.print_section("ТЕСТ 4: УДАЛЕНИЕ И ВОССТАНОВЛЕНИЕ")
        
        # Создаем заметку для теста
        test_note = Notes.objects.create(
            title='Заметка для удаления',
            text='Будет удалена',
            user=self.user
        )
        note_id = test_note.id
        print(f"\n  Создана тестовая заметка ID: {note_id}")
        
        # Удаление в старой архитектуре
        print("\n  📦 Старая архитектура (v1) - удаление:")
        v1_delete = self.client_v1.delete(f'/api/notes/{note_id}/')
        print(f"  Статус: {v1_delete.status_code}")
        print(f"  Ответ: {v1_delete.data}")
        
        # Проверяем статус в БД после v1 удаления
        test_note.refresh_from_db()
        print(f"  После удаления v1: is_deleted={test_note.is_deleted}, deleted_at={test_note.deleted_at}")
        
        # Восстанавливаем через v1
        print("\n  📦 Старая архитектура (v1) - восстановление:")
        v1_restore = self.client_v1.post(f'/api/notes/{note_id}/restore/')
        print(f"  Статус: {v1_restore.status_code}")
        print(f"  Ответ: {v1_restore.data}")
        
        test_note.refresh_from_db()
        print(f"  После восстановления v1: is_deleted={test_note.is_deleted}, deleted_at={test_note.deleted_at}")
        
        # Удаление в новой архитектуре
        print("\n  🏗️ Новая архитектура (v2) - удаление:")
        v2_delete = self.client_v2.delete(f'/api/v2/notes/{note_id}/')
        print(f"  Статус: {v2_delete.status_code}")
        print(f"  Ответ: {v2_delete.data}")
        
        test_note.refresh_from_db()
        print(f"  После удаления v2: is_deleted={test_note.is_deleted}, deleted_at={test_note.deleted_at}")
        
        # Восстанавливаем через v2
        print("\n  🏗️ Новая архитектура (v2) - восстановление:")
        v2_restore = self.client_v2.post(f'/api/v2/notes/{note_id}/restore/')
        print(f"  Статус: {v2_restore.status_code}")
        print(f"  Ответ: {v2_restore.data}")
        
        test_note.refresh_from_db()
        print(f"  После восстановления v2: is_deleted={test_note.is_deleted}, deleted_at={test_note.deleted_at}")
    
    def test_5_domain_vs_model_comparison(self):
        """Тест 5: Сравнение доменных сущностей и Django моделей"""
        self.print_section("ТЕСТ 5: ДОМЕННЫЕ СУЩНОСТИ VS DJANGO МОДЕЛИ")
        
        # Получаем Django модель
        print("\n  📦 Django модель:")
        print(f"  Тип: {type(self.note)}")
        print(f"  Атрибуты: id={self.note.id}, title={self.note.title}")
        print(f"  Методы: has_images(), add_image(), remove_image()")
        
        # Создаем доменную сущность
        note_entity = NoteEntity(
            id=self.note.id,
            title=self.note.title,
            text=self.note.text,
            user_id=self.note.user_id,
            group_id=self.note.group_id,
            created_at=self.note.created_at,
            updated_at=self.note.updated_at,
            is_deleted=self.note.is_deleted,
            deleted_at=self.note.deleted_at,
            images=self.note.images
        )
        
        print("\n  🏗️ Доменная сущность:")
        print(f"  Тип: {type(note_entity)}")
        print(f"  Атрибуты: {note_entity.__dict__}")
        print(f"  Методы: update_content(), move_to_group(), delete(), restore()")
        
        # Сравниваем данные
        print("\n  Сравнение данных:")
        print(f"  title: {self.note.title} == {note_entity.title}")
        print(f"  text: {self.note.text} == {note_entity.text}")
        print(f"  user_id: {self.note.user_id} == {note_entity.user_id}")
    
    def test_6_repository_pattern_comparison(self):
        """Тест 6: Демонстрация паттерна Repository"""
        self.print_section("ТЕСТ 6: ПАТТЕРН РЕПОЗИТОРИЙ")
        
        repo = DjangoNoteRepository()
        
        print("\n  Получение заметки через репозиторий:")
        entity = repo.get_by_id(self.note.id, self.user.id)
        
        print(f"  Репозиторий вернул: {type(entity)}")
        print(f"  Данные: id={entity.id}, title={entity.title}")
        
        print("\n  Преимущества репозитория:")
        print("  • Абстракция от базы данных")
        print("  • Легко тестировать")
        print("  • Можно заменить Django на другую БД")
        
        print("\n  Создание заметки через репозиторий:")
        new_entity = NoteEntity(
            title='Репозиторий тест',
            text='Создано через репозиторий',
            user_id=self.user.id
        )
        
        created = repo.create(new_entity)
        print(f"  Создана заметка ID: {created.id}")
        
        # Проверяем, что она действительно в БД
        db_check = Notes.objects.get(id=created.id)
        print(f"  Проверка в БД: {db_check.title}")
    
    def test_7_service_layer_comparison(self):
        """Тест 7: Демонстрация сервисного слоя"""
        self.print_section("ТЕСТ 7: СЕРВИСНЫЙ СЛОЙ")
        
        print("\n  🏗️ Сервис заметок (NoteService):")
        print("  Методы сервиса:")
        methods = [m for m in dir(self.service) if not m.startswith('_')]
        for method in sorted(methods)[:10]:  # Первые 10 методов
            print(f"    • {method}")
        
        print("\n  Использование сервиса:")
        from ..domain.dto import CreateNoteDTO
        
        dto = CreateNoteDTO(
            title='Сервис тест',
            text='Создано через сервис',
            group_id=self.group.id
        )
        
        note, message = self.service.create_note(self.user.id, dto)
        print(f"  Результат: {message}")
        print(f"  Создана заметка: {note.title} (ID: {note.id})")
        
        print("\n  Преимущества сервисного слоя:")
        print("  • Бизнес-логика в одном месте")
        print("  • Легко тестировать")
        print("  • Независимость от API")
    
    def test_8_error_handling_comparison(self):
        """Тест 8: Сравнение обработки ошибок"""
        self.print_section("ТЕСТ 8: ОБРАБОТКА ОШИБОК")
        
        # Несуществующая заметка
        wrong_id = 99999
        
        print("\n  📦 Старая архитектура (v1) - несуществующая заметка:")
        v1_response = self.client_v1.get(f'/api/notes/{wrong_id}/')
        print(f"  Статус: {v1_response.status_code}")
        print(f"  Ответ: {v1_response.data}")
        
        print("\n  🏗️ Новая архитектура (v2) - несуществующая заметка:")
        v2_response = self.client_v2.get(f'/api/v2/notes/{wrong_id}/')
        print(f"  Статус: {v2_response.status_code}")
        print(f"  Ответ: {v2_response.data}")
        
        # Создание с невалидными данными
        print("\n  📦 Старая архитектура (v1) - невалидные данные:")
        v1_response = self.client_v1.post('/api/notes/', {'title': ''})
        print(f"  Статус: {v1_response.status_code}")
        print(f"  Ответ: {v1_response.data}")
        
        print("\n  🏗️ Новая архитектура (v2) - невалидные данные:")
        v2_response = self.client_v2.post('/api/v2/notes/', {'title': ''})
        print(f"  Статус: {v2_response.status_code}")
        print(f"  Ответ: {v2_response.data}")
    
    def test_9_performance_comparison(self):
        """Тест 9: Сравнение производительности"""
        self.print_section("ТЕСТ 9: ПРОИЗВОДИТЕЛЬНОСТЬ")
        
        import time
        
        # Создаем много заметок для теста
        print("\n  Создание 10 тестовых заметок...")
        for i in range(10):
            Notes.objects.create(
                title=f'Тест {i}',
                text='x' * 1000,
                user=self.user
            )
        
        # Тест старой архитектуры
        print("\n  📦 Старая архитектура (v1) - получение списка:")
        start = time.time()
        for _ in range(5):
            self.client_v1.get('/api/notes/')
        v1_time = time.time() - start
        print(f"  Время: {v1_time:.4f} сек")
        
        # Тест новой архитектуры
        print("\n  🏗️ Новая архитектура (v2) - получение списка:")
        start = time.time()
        for _ in range(5):
            self.client_v2.get('/api/v2/notes/')
        v2_time = time.time() - start
        print(f"  Время: {v2_time:.4f} сек")
        
        if v1_time < v2_time:
            print(f"\n  📦 v1 быстрее на {(v2_time - v1_time)/v1_time*100:.1f}%")
        else:
            print(f"\n  🏗️ v2 быстрее на {(v1_time - v2_time)/v2_time*100:.1f}%")
    
    def test_10_data_integrity(self):
        """Тест 10: Проверка целостности данных"""
        self.print_section("ТЕСТ 10: ЦЕЛОСТНОСТЬ ДАННЫХ")
        
        print("\n  Проверка данных после операций в разных архитектурах:")
        
        # Создаем заметку через v1
        v1_data = {'title': 'V1 Note', 'text': 'Content'}
        v1_response = self.client_v1.post('/api/notes/', v1_data)
        v1_id = v1_response.data['id']
        
        # Обновляем через v2
        v2_data = {'title': 'Updated by V2'}
        v2_response = self.client_v2.patch(f'/api/v2/notes/{v1_id}/', v2_data)
        
        # Проверяем в БД
        db_note = Notes.objects.get(id=v1_id)
        print(f"  Заметка в БД: {db_note.title} (должно быть 'Updated by V2')")
        
        # Удаляем через v1
        self.client_v1.delete(f'/api/notes/{v1_id}/')
        
        # Восстанавливаем через v2
        self.client_v2.post(f'/api/v2/notes/{v1_id}/restore/')
        
        db_note.refresh_from_db()
        print(f"  После восстановления: is_deleted={db_note.is_deleted}")
        
        self.assertFalse(db_note.is_deleted)
    
    def tearDown(self):
        """Очистка после тестов"""
        print("\n" + "="*80)
        print("🧹 ОЧИСТКА ТЕСТОВЫХ ДАННЫХ")
        print("="*80)
        ServiceFactory.clear()

class VerboseTestCase(TestCase):
    """
    Базовый класс для тестов с подробным выводом
    """
    
    def setUp(self):
        """Подготовка с выводом информации"""
        print(f"\n▶️ Запуск теста: {self._testMethodName}")
        print("-" * 60)
        super().setUp()
    
    def tearDown(self):
        """Завершение теста с выводом результата"""
        super().tearDown()
        print(f"✅ Тест завершен: {self._testMethodName}")
        print("=" * 60)
    
    def assertWithDebug(self, condition, message, debug_info=None):
        """Ассерт с отладочной информацией"""
        try:
            self.assertTrue(condition, message)
        except AssertionError as e:
            if debug_info:
                print(f"❌ Ошибка: {message}")
                print(f"🔍 Отладка: {debug_info}")
            raise e