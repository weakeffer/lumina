# backend/lumina/notes/nlp/service.py
import threading
from collections import defaultdict
from datetime import timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.utils import timezone
from ..models import Notes, NoteAnalysis
from .analyzer import analyze_text, generate_day_narrative

# Пул потоков для анализа (не более 4 одновременных анализов)
_executor = ThreadPoolExecutor(max_workers=4)


def analyze_note_async(note_id: int):
    """Запускает анализ в отдельном потоке (неблокирующий)"""
    future = _executor.submit(_run_analysis_sync, note_id)
    # Добавляем callback для логирования ошибок
    future.add_done_callback(_handle_analysis_result)


def _run_analysis_sync(note_id: int) -> tuple:
    """
    Синхронная версия анализа для выполнения в пуле потоков.
    Возвращает (note_id, success, error_message)
    """
    try:
        note = Notes.objects.get(id=note_id, is_deleted=False)
        text = f"{note.title} {note.text}".strip()
        
        # Проверяем, не слишком ли короткий текст
        if len(text) < 3:
            # Создаём запись о том, что анализ не нужен
            NoteAnalysis.objects.update_or_create(
                note=note,
                defaults={
                    'sentiment': 'neutral',
                    'sentiment_score': 0.0,
                    'dominant_emotion': 'neutral',
                    'emotions': {},
                    'keywords': [],
                    'entities': {},
                    'topics': [],
                    'text_stats': {'word_count': len(text)},
                    'narrative': 'Слишком короткая заметка для анализа.',
                    'is_analyzed': True,
                },
            )
            return (note_id, True, None)
        
        result = analyze_text(text)

        NoteAnalysis.objects.update_or_create(
            note=note,
            defaults={
                'sentiment': result.sentiment,
                'sentiment_score': result.sentiment_score,
                'dominant_emotion': result.dominant_emotion,
                'emotions': result.emotions,
                'keywords': result.keywords,
                'entities': result.entities,
                'topics': result.topics,
                'text_stats': result.text_stats,
                'narrative': result.narrative,
                'is_analyzed': True,
            },
        )
        return (note_id, True, None)
    
    except Notes.DoesNotExist:
        return (note_id, False, f"Заметка {note_id} не найдена")
    except Exception as e:
        return (note_id, False, str(e))


def _handle_analysis_result(future):
    """Обрабатывает результат асинхронного анализа"""
    try:
        note_id, success, error = future.result(timeout=1)
        if not success:
            print(f"[NLP] Ошибка анализа заметки {note_id}: {error}")
    except Exception as e:
        print(f"[NLP] Критическая ошибка в callback анализа: {e}")


def get_daily_summary(user_id: int, date_str: str) -> dict:
    """
    Агрегирует анализы всех заметок за день и генерирует нарратив.
    Полностью локально, без внешних API.
    Теперь с правильной синхронизацией — ждём завершения анализов.
    """
    from django.utils.dateparse import parse_date

    target_date = parse_date(date_str)
    if not target_date:
        return {}

    start = timezone.make_aware(
        timezone.datetime.combine(target_date, timezone.datetime.min.time())
    )
    end = start + timedelta(days=1)

    notes = Notes.objects.filter(
        user_id=user_id,
        is_deleted=False,
        created_at__gte=start,
        created_at__lt=end,
    ).prefetch_related('analysis').order_by('created_at')

    if not notes.exists():
        return {
            'date': date_str,
            'notes_count': 0,
            'message': 'Нет записей за этот день',
            'narrative': 'За этот день записей нет.',
        }

    # Собираем ID заметок, которые нужно проанализировать
    notes_to_analyze = []
    for note in notes:
        try:
            if not hasattr(note, 'analysis') or not note.analysis.is_analyzed:
                notes_to_analyze.append(note.id)
        except NoteAnalysis.DoesNotExist:
            notes_to_analyze.append(note.id)

    # Асинхронно анализируем все необработанные заметки и ждём результата
    if notes_to_analyze:
        futures = []
        for note_id in notes_to_analyze:
            future = _executor.submit(_run_analysis_sync, note_id)
            futures.append(future)
        
        # Ждём завершения всех анализов с таймаутом
        for future in as_completed(futures):
            try:
                future.result(timeout=60)  # максимум 60 секунд на заметку
            except TimeoutError:
                print(f"[NLP] Таймаут анализа заметки")
            except Exception as e:
                print(f"[NLP] Ошибка при ожидании анализа: {e}")
    
    # Обновляем все объекты после завершения анализов
    # Важно: создаём новый QuerySet, чтобы получить свежие данные
    notes = Notes.objects.filter(
        user_id=user_id,
        is_deleted=False,
        created_at__gte=start,
        created_at__lt=end,
    ).prefetch_related('analysis').order_by('created_at')

    # Агрегируем данные
    all_emotions: dict = {}
    all_topics: dict = {}
    all_keywords: list = []
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
                all_emotions[em] = all_emotions.get(em, 0) + score

            for topic in analysis.topics:
                all_topics[topic] = all_topics.get(topic, 0) + 1

            all_keywords.extend(analysis.keywords[:3])

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

    # Если ни одной проанализированной заметки нет, но есть заметки
    if analyzed_count == 0 and notes.exists():
        return {
            'date': date_str,
            'notes_count': notes.count(),
            'analyzed_count': 0,
            'message': 'Заметки ещё анализируются, попробуйте обновить страницу через несколько секунд',
            'narrative': 'Анализ заметок выполняется в фоне. Обновите страницу через минуту.',
        }

    # Нормализуем эмоции
    if analyzed_count > 0:
        all_emotions = {k: round(v / analyzed_count, 3) for k, v in all_emotions.items()}

    # Общее настроение
    if sentiments:
        pos = sentiments.count('positive')
        neg = sentiments.count('negative')
        day_mood = 'positive' if pos > neg else 'negative' if neg > pos else 'neutral'
    else:
        day_mood = 'neutral'

    dominant_emotion = max(all_emotions, key=all_emotions.get) if all_emotions else 'neutral'

    # Генерируем нарратив локально
    narrative = generate_day_narrative(
        day_analyses=day_analyses,
        date_str=date_str,
        total_words=total_words,
    )

    # Топ эмоции (сортировка)
    sorted_emotions = dict(sorted(all_emotions.items(), key=lambda x: -x[1]))

    # Топ тем
    sorted_topics = dict(sorted(all_topics.items(), key=lambda x: -x[1])[:10])

    return {
        'date': date_str,
        'notes_count': notes.count(),
        'analyzed_count': analyzed_count,
        'day_mood': day_mood,
        'dominant_emotion': dominant_emotion,
        'emotions': sorted_emotions,
        'top_topics': sorted_topics,
        'total_words': total_words,
        'narrative': narrative,
        'notes': [
            {
                'id': n.id,
                'title': n.title,
                'preview': n.text[:100] if n.text else '',
                'created_at': n.created_at.isoformat(),
                'sentiment': getattr(
                    getattr(n, 'analysis', None), 'sentiment', 'neutral'
                ),
                'dominant_emotion': getattr(
                    getattr(n, 'analysis', None), 'dominant_emotion', 'neutral'
                ),
                'narrative': getattr(
                    getattr(n, 'analysis', None), 'narrative', ''
                ),
            }
            for n in notes
        ],
    }


def analyze_all_unprocessed(user_id: int = None) -> dict:
    """
    Массовый анализ всех непроанализированных заметок.
    Полезно для первоначальной обработки или после обновления моделей.
    
    Args:
        user_id: если указан, анализирует только заметки конкретного пользователя
    
    Returns:
        dict со статистикой обработки
    """
    queryset = Notes.objects.filter(is_deleted=False, analysis__isnull=True)
    if user_id:
        queryset = queryset.filter(user_id=user_id)
    
    # Также ищем заметки с analysis.is_analyzed = False
    notes_with_analysis = Notes.objects.filter(
        is_deleted=False,
        analysis__is_analyzed=False
    )
    if user_id:
        notes_with_analysis = notes_with_analysis.filter(user_id=user_id)
    
    all_notes = list(queryset) + list(notes_with_analysis)
    unique_notes = {note.id: note for note in all_notes}.values()
    
    if not unique_notes:
        return {'total': 0, 'processed': 0, 'failed': 0}
    
    total = len(unique_notes)
    processed = 0
    failed = 0
    
    for note in unique_notes:
        try:
            _run_analysis_sync(note.id)
            processed += 1
        except Exception as e:
            print(f"[NLP] Массовый анализ: ошибка заметки {note.id}: {e}")
            failed += 1
    
    return {
        'total': total,
        'processed': processed,
        'failed': failed,
    }


def get_analysis_status(note_id: int) -> dict:
    """
    Проверяет статус анализа заметки.
    Полезно для polling с фронтенда.
    """
    try:
        note = Notes.objects.get(id=note_id, is_deleted=False)
        try:
            analysis = note.analysis
            return {
                'note_id': note_id,
                'is_analyzed': analysis.is_analyzed,
                'analyzed_at': analysis.updated_at.isoformat() if analysis.updated_at else None,
                'has_analysis': True,
            }
        except NoteAnalysis.DoesNotExist:
            return {
                'note_id': note_id,
                'is_analyzed': False,
                'analyzed_at': None,
                'has_analysis': False,
            }
    except Notes.DoesNotExist:
        return {
            'note_id': note_id,
            'is_analyzed': False,
            'analyzed_at': None,
            'has_analysis': False,
            'error': 'Note not found',
        }