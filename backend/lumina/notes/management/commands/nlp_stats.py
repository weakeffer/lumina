# backend/lumina/notes/management/commands/nlp_stats.py
"""
Команда для просмотра статистики NLP-модуля.
Использование: python manage.py nlp_stats
"""
from django.core.management.base import BaseCommand
from notes.nlp.service import _executor
from notes.nlp.neural_emotion_analyzer import get_emotion_analyzer, NeuralEmotionAnalyzer
from notes.models import NoteAnalysis, Notes
from datetime import datetime, timedelta
from django.utils import timezone
import torch


class Command(BaseCommand):
    help = 'Показывает статистику NLP-модуля'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write('📊 СТАТИСТИКА NLP-МОДУЛЯ')
        self.stdout.write('=' * 60)
        
        # Статистика пула потоков
        self.stdout.write('\n🔧 Пул потоков:')
        metrics = _executor.get_metrics()
        self.stdout.write(f"  • Отправлено задач: {metrics.get('submitted', 0)}")
        self.stdout.write(f"  • Выполнено: {metrics.get('completed', 0)}")
        self.stdout.write(f"  • Ошибок: {metrics.get('failed', 0)}")
        self.stdout.write(f"  • Отклонено: {metrics.get('rejected', 0)}")
        self.stdout.write(f"  • Активных задач: {metrics.get('active_tasks', 0)}")
        self.stdout.write(f"  • Заполненность очереди: {metrics.get('queue_usage_percent', 0)}%")
        
        # Статистика нейросети
        self.stdout.write('\n🧠 Нейросеть эмоций:')
        try:
            analyzer = get_emotion_analyzer()
            if isinstance(analyzer, NeuralEmotionAnalyzer):
                nn_metrics = analyzer.get_metrics()
                self.stdout.write(f"  • Модель: {nn_metrics.get('model_name', 'N/A')}")
                self.stdout.write(f"  • Устройство: {nn_metrics.get('device', 'N/A')}")
                self.stdout.write(f"  • Размер кэша: {nn_metrics.get('cache_size', 0)}/{nn_metrics.get('cache_max_size', 0)}")
                self.stdout.write(f"  • Всего запросов: {nn_metrics.get('total_requests', 0)}")
                
                if torch.cuda.is_available():
                    self.stdout.write(f"  • GPU память: {torch.cuda.memory_allocated() / 1024**2:.1f} MB")
            else:
                self.stdout.write('  • Используется лексиконный анализатор (нейросеть недоступна)')
        except Exception as e:
            self.stdout.write(f'  • Ошибка: {e}')
        
        # Статистика БД
        self.stdout.write('\n📦 База данных:')
        total_notes = Notes.objects.filter(is_deleted=False).count()
        analyzed = NoteAnalysis.objects.filter(is_analyzed=True).count()
        self.stdout.write(f"  • Всего заметок: {total_notes}")
        self.stdout.write(f"  • Проанализировано: {analyzed} ({analyzed/max(total_notes,1)*100:.1f}%)")
        
        # Анализы за последние 24 часа
        yesterday = timezone.now() - timedelta(days=1)
        recent = NoteAnalysis.objects.filter(
            analyzed_at__gte=yesterday,
            is_analyzed=True
        ).count()
        self.stdout.write(f"  • Анализов за 24ч: {recent}")
        
        # Ошибки анализа
        errors = NoteAnalysis.objects.filter(
            is_analyzed=True,
            narrative__contains='Не удалось выполнить'
        ).count()
        if errors > 0:
            self.stdout.write(f"  • Заметок с ошибками анализа: {errors}")
        
        self.stdout.write('\n' + '=' * 60)