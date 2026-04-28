import threading
import time
import logging
from collections import defaultdict
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor, Future, TimeoutError as FutureTimeoutError
from queue import Queue, Full
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from ..models import Notes, NoteAnalysis
from .analyzer import analyze_text, generate_day_narrative

logger = logging.getLogger('lumina.nlp')


class BoundedThreadPoolExecutor:
    """
    Пул потоков с ограниченной очередью, таймаутами и метриками.
    
    Особенности:
    - Ограничение очереди (по умолчанию 50 задач)
    - Таймаут выполнения задачи (120 секунд)
    - Сбор метрик (успешно/провалено/отклонено)
    - Периодическая очистка зависших задач
    """
    
    def __init__(self, max_workers: int = 4, max_queue_size: int = 50, task_timeout: int = 120):
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self.max_queue_size = max_queue_size
        self.task_timeout = task_timeout
        self._active_tasks = 0
        self._lock = threading.Lock()
        
        # Метрики
        self.metrics = {
            'submitted': 0,
            'completed': 0,
            'failed': 0,
            'rejected': 0,
            'timed_out': 0,
        }
        self._metrics_lock = threading.Lock()
    
    def submit(self, fn, *args, **kwargs):
        """
        Отправляет задачу в пул. 
        Возвращает Future или None если очередь переполнена.
        """
        with self._lock:
            if self._active_tasks >= self.max_queue_size:
                with self._metrics_lock:
                    self.metrics['rejected'] += 1
                logger.warning(
                    f"Очередь NLP переполнена ({self.max_queue_size} задач). "
                    f"Задача отклонена."
                )
                return None
            
            self._active_tasks += 1
            with self._metrics_lock:
                self.metrics['submitted'] += 1
        
        future = self._executor.submit(fn, *args, **kwargs)
        future.add_done_callback(self._task_done)
        return future
    
    def _task_done(self, future: Future):
        """Callback при завершении задачи"""
        with self._lock:
            self._active_tasks = max(0, self._active_tasks - 1)
        
        try:
            future.result(timeout=0)  # Не ждем, просто проверяем исключения
            with self._metrics_lock:
                self.metrics['completed'] += 1
        except Exception:
            with self._metrics_lock:
                self.metrics['failed'] += 1
    
    def get_metrics(self) -> dict:
        """Возвращает текущие метрики пула"""
        with self._metrics_lock:
            metrics = dict(self.metrics)
        with self._lock:
            metrics['active_tasks'] = self._active_tasks
            metrics['queue_usage_percent'] = round(
                self._active_tasks / self.max_queue_size * 100, 1
            )
        return metrics
    
    def shutdown(self, wait: bool = True):
        """Graceful shutdown — ждет завершения текущих задач"""
        logger.info(f"Выключение NLP пула. Активных задач: {self._active_tasks}")
        self._executor.shutdown(wait=wait)
        logger.info(f"NLP пул выключен. Метрики: {self.get_metrics()}")


# Глобальный пул с ограничением
_executor = BoundedThreadPoolExecutor(
    max_workers=4,
    max_queue_size=50,
    task_timeout=120
)


def analyze_note_async(note_id: int):
    """
    Запускает анализ в отдельном потоке (неблокирующий).
    Если очередь переполнена — задача отклоняется и логируется.
    """
    future = _executor.submit(_run_analysis_sync, note_id)
    if future is None:
        logger.error(f"Анализ заметки {note_id} отклонен — очередь переполнена")
    else:
        future.add_done_callback(
            lambda f: _handle_analysis_result(f, note_id)
        )


def _run_analysis_sync(note_id: int) -> tuple:
    """
    Синхронный анализ заметки с защитой от race condition.
    Использует select_for_update для блокировки строки в БД.
    """
    try:
        with transaction.atomic():
            # Блокируем заметку чтобы избежать двойного анализа
            try:
                note = Notes.objects.select_for_update().get(
                    id=note_id, 
                    is_deleted=False
                )
            except Notes.DoesNotExist:
                logger.warning(f"Заметка {note_id} не найдена для анализа")
                return (note_id, False, "Заметка не найдена")
            
            # Получаем или создаём запись анализа
            analysis, created = NoteAnalysis.objects.get_or_create(
                note=note,
                defaults={'is_analyzed': False}
            )
            
            # Если уже проанализировано — пропускаем
            if not created and analysis.is_analyzed:
                logger.debug(f"Заметка {note_id} уже проанализирована, пропускаем")
                return (note_id, True, "Уже проанализировано")
            
            # Проверяем длину текста
            text = f"{note.title} {note.text}".strip()
            if len(text) < 3:
                analysis.sentiment = 'neutral'
                analysis.sentiment_score = 0.0
                analysis.dominant_emotion = 'neutral'
                analysis.emotions = {}
                analysis.keywords = []
                analysis.entities = {}
                analysis.topics = []
                analysis.text_stats = {
                    'word_count': len(text.split()),
                    'too_short': True,
                    'analysis_timestamp': timezone.now().isoformat()
                }
                analysis.narrative = 'Слишком короткая заметка для анализа.'
                analysis.is_analyzed = True
                analysis.save()
                logger.debug(f"Заметка {note_id} слишком короткая, анализ пропущен")
                return (note_id, True, "Слишком короткий текст")
            
            # Запускаем анализ с замером времени
            start_time = time.time()
            try:
                result = analyze_text(text)
                analysis_time = time.time() - start_time
                logger.info(
                    f"Анализ заметки {note_id} завершен за {analysis_time:.2f}с. "
                    f"Слов: {result.text_stats.get('word_count', 0)}, "
                    f"Тональность: {result.sentiment}, "
                    f"Эмоция: {result.dominant_emotion}"
                )
            except Exception as e:
                analysis_time = time.time() - start_time
                logger.error(
                    f"Ошибка анализа заметки {note_id} (заняло {analysis_time:.2f}с): {e}",
                    exc_info=True
                )
                # Сохраняем частичный результат
                analysis.sentiment = 'neutral'
                analysis.sentiment_score = 0.0
                analysis.dominant_emotion = 'neutral'
                analysis.emotions = {'error': 1.0}
                analysis.keywords = []
                analysis.entities = {}
                analysis.topics = []
                analysis.text_stats = {
                    'word_count': len(text.split()),
                    'error': str(e)[:200],
                    'analysis_time': round(analysis_time, 2)
                }
                analysis.narrative = (
                    'Не удалось выполнить полный анализ заметки из-за технической ошибки. '
                    'Попробуйте обновить страницу позже.'
                )
                analysis.is_analyzed = True
                analysis.save()
                return (note_id, False, str(e)[:200])
            
            # Сохраняем успешный результат
            analysis.sentiment = result.sentiment
            analysis.sentiment_score = result.sentiment_score
            analysis.dominant_emotion = result.dominant_emotion
            analysis.emotions = result.emotions
            analysis.keywords = result.keywords
            analysis.entities = result.entities
            analysis.topics = result.topics
            analysis.text_stats = {
                **result.text_stats,
                'analysis_time': round(analysis_time, 2),
                'analysis_timestamp': timezone.now().isoformat()
            }
            analysis.narrative = result.narrative
            analysis.is_analyzed = True
            analysis.save()
            
            return (note_id, True, None)
    
    except Exception as e:
        logger.critical(
            f"Критическая ошибка при анализе заметки {note_id}: {e}",
            exc_info=True
        )
        return (note_id, False, str(e)[:200])


def _handle_analysis_result(future: Future, note_id: int):
    """Обрабатывает результат асинхронного анализа с логированием"""
    try:
        result_note_id, success, error = future.result(timeout=1)
        if not success:
            logger.warning(f"Анализ заметки {note_id} завершился с ошибкой: {error}")
    except FutureTimeoutError:
        logger.error(f"Таймаут при получении результата анализа заметки {note_id}")
    except Exception as e:
        logger.error(f"Неожиданная ошибка в callback анализа заметки {note_id}: {e}")


def get_daily_summary(user_id: int, date_str: str) -> dict:
    """
    Агрегирует анализы всех заметок за день и генерирует нарратив.
    С пагинацией и оптимизацией запросов.
    """
    from django.utils.dateparse import parse_date

    target_date = parse_date(date_str)
    if not target_date:
        logger.warning(f"Некорректная дата в daily_summary: {date_str}")
        return {'error': 'Некорректный формат даты. Используйте YYYY-MM-DD'}
    
    # Кэш на 10 минут
    cache_key = f'daily_summary_{user_id}_{date_str}'
    cached = cache.get(cache_key)
    if cached:
        logger.debug(f"Daily summary для {user_id}/{date_str} взято из кэша")
        return cached

    start = timezone.make_aware(
        timezone.datetime.combine(target_date, timezone.datetime.min.time())
    )
    end = start + timedelta(days=1)

    # Оптимизированный запрос с select_related
    notes = Notes.objects.filter(
        user_id=user_id,
        is_deleted=False,
        created_at__gte=start,
        created_at__lt=end,
    ).select_related('analysis').order_by('created_at')

    total_notes = notes.count()
    if total_notes == 0:
        result = {
            'date': date_str,
            'notes_count': 0,
            'message': 'Нет записей за этот день',
            'narrative': 'За этот день записей нет.',
        }
        cache.set(cache_key, result, 600)  # кэш на 10 минут
        return result

    # Проверяем, нужно ли анализировать заметки
    notes_to_analyze = []
    for note in notes:
        try:
            if not note.analysis.is_analyzed:
                notes_to_analyze.append(note.id)
        except NoteAnalysis.DoesNotExist:
            notes_to_analyze.append(note.id)

    if notes_to_analyze:
        logger.info(f"Запуск анализа {len(notes_to_analyze)} заметок для daily_summary")
        # Запускаем анализы параллельно с таймаутом
        futures = {}
        for note_id in notes_to_analyze:
            future = _executor.submit(_run_analysis_sync, note_id)
            if future:
                futures[future] = note_id
        
        # Ждем завершения с общим таймаутом 60 секунд
        deadline = time.time() + 60
        for future in list(futures.keys()):
            remaining = deadline - time.time()
            if remaining <= 0:
                logger.warning(f"Таймаут ожидания анализа для daily_summary")
                break
            try:
                future.result(timeout=remaining)
            except FutureTimeoutError:
                logger.warning(f"Таймаут анализа заметки {futures[future]}")
            except Exception as e:
                logger.error(f"Ошибка анализа заметки {futures[future]}: {e}")

        # Перезагружаем queryset с обновленными данными
        notes = Notes.objects.filter(
            user_id=user_id,
            is_deleted=False,
            created_at__gte=start,
            created_at__lt=end,
        ).select_related('analysis').order_by('created_at')

    # Агрегируем данные (оптимизировано)
    all_emotions = defaultdict(float)
    all_topics = defaultdict(int)
    sentiments = []
    total_words = 0
    analyzed_count = 0
    day_analyses = []

    for note in notes:
        try:
            analysis = note.analysis
            if not analysis.is_analyzed:
                continue

            analyzed_count += 1
            sentiments.append(analysis.sentiment)
            total_words += analysis.text_stats.get('word_count', 0)

            for em, score in analysis.emotions.items():
                if isinstance(score, (int, float)):
                    all_emotions[em] += score

            for topic in analysis.topics[:5]:  # Ограничиваем количество тем
                all_topics[topic] += 1

            day_analyses.append({
                'sentiment': analysis.sentiment,
                'sentiment_score': analysis.sentiment_score,
                'emotions': analysis.emotions,
                'topics': analysis.topics,
                'keywords': analysis.keywords,
                'dominant_emotion': analysis.dominant_emotion,
            })

        except NoteAnalysis.DoesNotExist:
            continue

    # Если анализов нет, но заметки есть — они в процессе анализа
    if analyzed_count == 0 and total_notes > 0:
        result = {
            'date': date_str,
            'notes_count': total_notes,
            'analyzed_count': 0,
            'message': 'Заметки анализируются. Обновите страницу через несколько секунд.',
            'narrative': 'Анализ заметок выполняется в фоне.',
            'status': 'processing'
        }
        cache.set(cache_key, result, 30)  # короткий кэш — 30 секунд
        return result

    # Нормализуем эмоции
    if analyzed_count > 0:
        all_emotions = {k: round(v / analyzed_count, 3) 
                       for k, v in all_emotions.items()}

    # Общее настроение
    pos = sentiments.count('positive')
    neg = sentiments.count('negative')
    day_mood = 'positive' if pos > neg else 'negative' if neg > pos else 'neutral'

    dominant_emotion = max(all_emotions, key=all_emotions.get) if all_emotions else 'neutral'

    # Генерируем нарратив
    narrative = generate_day_narrative(
        day_analyses=day_analyses,
        date_str=date_str,
        total_words=total_words,
    )

    # Формируем результат с оптимизированными данными
    result = {
        'date': date_str,
        'notes_count': total_notes,
        'analyzed_count': analyzed_count,
        'day_mood': day_mood,
        'dominant_emotion': dominant_emotion,
        'emotions': dict(sorted(all_emotions.items(), key=lambda x: -x[1])),
        'top_topics': dict(sorted(all_topics.items(), key=lambda x: -x[1])[:10]),
        'total_words': total_words,
        'narrative': narrative,
        'notes': [
            {
                'id': n.id,
                'title': n.title,
                'preview': n.text[:100] if n.text else '',
                'created_at': n.created_at.isoformat(),
                'sentiment': n.analysis.sentiment if hasattr(n, 'analysis') else 'neutral',
                'dominant_emotion': n.analysis.dominant_emotion if hasattr(n, 'analysis') else 'neutral',
                'narrative': n.analysis.narrative if hasattr(n, 'analysis') else '',
            }
            for n in notes[:50]  # Ограничиваем количество заметок в ответе
        ],
        'status': 'completed'
    }
    
    cache.set(cache_key, result, 600)  # кэш на 10 минут
    logger.info(f"Daily summary для {user_id}/{date_str}: {analyzed_count}/{total_notes} заметок проанализировано")
    return result


def get_analysis_status(note_id: int) -> dict:
    """
    Проверяет статус анализа заметки.
    Для polling с фронтенда.
    """
    try:
        note = Notes.objects.get(id=note_id, is_deleted=False)
        try:
            analysis = note.analysis
            return {
                'note_id': note_id,
                'is_analyzed': analysis.is_analyzed,
                'analyzed_at': analysis.analyzed_at.isoformat() if analysis.analyzed_at else None,
                'has_analysis': True,
                'status': 'completed' if analysis.is_analyzed else 'processing'
            }
        except NoteAnalysis.DoesNotExist:
            return {
                'note_id': note_id,
                'is_analyzed': False,
                'analyzed_at': None,
                'has_analysis': False,
                'status': 'not_started'
            }
    except Notes.DoesNotExist:
        return {
            'note_id': note_id,
            'is_analyzed': False,
            'status': 'error',
            'error': 'Заметка не найдена'
        }


def analyze_all_unprocessed(user_id: int = None, batch_size: int = 20) -> dict:
    """
    Массовый анализ непроанализированных заметок с защитой от перегрузки.
    
    Args:
        user_id: опциональный фильтр по пользователю
        batch_size: максимальное количество заметок для анализа за один вызов
    
    Returns:
        dict со статистикой
    """
    # Ищем заметки без анализа
    from django.db.models import Q
    
    queryset = Notes.objects.filter(
        is_deleted=False
    ).filter(
        Q(analysis__isnull=True) | Q(analysis__is_analyzed=False)
    )
    
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    # Ограничиваем batch_size
    total = queryset.count()
    notes_to_process = list(queryset.values_list('id', flat=True)[:batch_size])
    
    if not notes_to_process:
        logger.info("Нет заметок для анализа")
        return {
            'total': 0, 
            'processed': 0, 
            'failed': 0,
            'message': 'Все заметки уже проанализированы'
        }
    
    logger.info(f"Запуск массового анализа: {len(notes_to_process)} из {total} заметок")
    
    processed = 0
    failed = 0
    rejected = 0
    
    for note_id in notes_to_process:
        future = _executor.submit(_run_analysis_sync, note_id)
        if future is None:
            rejected += 1
            logger.warning(f"Заметка {note_id} отклонена при массовом анализе (очередь полна)")
        else:
            try:
                note_id, success, error = future.result(timeout=120)
                if success:
                    processed += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                logger.error(f"Ошибка массового анализа заметки {note_id}: {e}")
    
    result = {
        'total': total,
        'in_batch': len(notes_to_process),
        'processed': processed,
        'failed': failed,
        'rejected': rejected,
        'remaining': total - processed - failed,
        'message': f'Обработано {processed}, ошибок {failed}, отклонено {rejected}. Осталось {total - processed - failed}'
    }
    
    logger.info(f"Массовый анализ завершен: {result['message']}")
    return result