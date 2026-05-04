# backend/lumina/notes/management/commands/analyze_notes.py
"""
Массовый анализ непроанализированных заметок.
Использование: 
  python manage.py analyze_notes
  python manage.py analyze_notes --user-id 1
  python manage.py analyze_notes --force  # переанализировать все
"""
from django.core.management.base import BaseCommand
from notes.models import Notes, NoteAnalysis
from notes.nlp.service import _run_analysis_sync
import time


class Command(BaseCommand):
    help = 'Запускает NLP-анализ для непроанализированных заметок'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='ID пользователя (если не указан — для всех)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Переанализировать все заметки (даже уже проанализированные)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Максимальное количество заметок для анализа (по умолчанию 50)',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        force = options['force']
        limit = options['limit']
        
        # Выбираем заметки для анализа
        if force:
            # Все заметки (даже проанализированные)
            queryset = Notes.objects.filter(is_deleted=False)
            self.stdout.write('🔄 Режим принудительного переанализа ВСЕХ заметок')
        else:
            # Только непроанализированные
            queryset = Notes.objects.filter(
                is_deleted=False
            ).exclude(
                analysis__is_analyzed=True
            )
            self.stdout.write('📝 Анализ только непроанализированных заметок')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
            self.stdout.write(f'👤 Фильтр по пользователю: ID={user_id}')
        
        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('✅ Все заметки уже проанализированы!'))
            return
        
        # Ограничиваем количество
        notes_to_process = list(queryset.values_list('id', flat=True)[:limit])

        # В режиме --force сбрасываем флаг, иначе _run_analysis_sync пропустит заметки.
        if force and notes_to_process:
            NoteAnalysis.objects.filter(note_id__in=notes_to_process).update(is_analyzed=False)
        
        self.stdout.write(f'\n📊 Найдено заметок: {total}')
        self.stdout.write(f'🔧 Будет обработано: {len(notes_to_process)}')
        self.stdout.write('-' * 60)
        
        processed = 0
        failed = 0
        start_time = time.time()
        
        for i, note_id in enumerate(notes_to_process, 1):
            try:
                note_id, success, error = _run_analysis_sync(note_id)
                if success:
                    processed += 1
                    self.stdout.write(
                        f'✅ [{i}/{len(notes_to_process)}] Заметка {note_id} проанализирована'
                    )
                else:
                    failed += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠️  [{i}/{len(notes_to_process)}] Заметка {note_id}: {error}'
                        )
                    )
            except Exception as e:
                failed += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'❌ [{i}/{len(notes_to_process)}] Заметка {note_id}: {str(e)[:100]}'
                    )
                )
            
            # Небольшая пауза между анализами чтобы не перегружать CPU
            if i % 5 == 0:
                time.sleep(0.5)
        
        elapsed = time.time() - start_time
        
        # Итоговая статистика
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('📊 ИТОГИ АНАЛИЗА')
        self.stdout.write('=' * 60)
        self.stdout.write(f'✅ Успешно: {processed}')
        self.stdout.write(f'❌ Ошибок: {failed}')
        self.stdout.write(f'⏱️  Время: {elapsed:.1f} сек')
        if processed > 0:
            self.stdout.write(f'📈 Скорость: {processed/elapsed:.1f} зам/сек')
        
        # Проверяем общую статистику
        total_analyzed = NoteAnalysis.objects.filter(is_analyzed=True).count()
        total_notes = Notes.objects.filter(is_deleted=False).count()
        self.stdout.write(f'\n📦 Всего в системе:')
        self.stdout.write(f'  • Заметок: {total_notes}')
        self.stdout.write(f'  • Проанализировано: {total_analyzed} ({total_analyzed/max(total_notes,1)*100:.1f}%)')