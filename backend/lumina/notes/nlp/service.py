import threading
from collections import defaultdict
from datetime import timedelta
from django.utils import timezone
from ..models import Notes, NoteAnalysis
from .analyzer import analyze_text, generate_day_narrative


def analyze_note_async(note_id: int):
    """Запускает анализ в отдельном потоке"""
    thread = threading.Thread(
        target=_run_analysis,
        args=(note_id,),
        daemon=True,
    )
    thread.start()


def _run_analysis(note_id: int):
    try:
        note = Notes.objects.get(id=note_id, is_deleted=False)
        text = f"{note.title} {note.text}".strip()
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
    except Exception as e:
        print(f"[NLP] Ошибка анализа заметки {note_id}: {e}")


def get_daily_summary(user_id: int, date_str: str) -> dict:
    """
    Агрегирует анализы всех заметок за день и генерирует нарратив.
    Полностью локально, без внешних API.
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

    # Запускаем анализ для неанализированных заметок
    for note in notes:
        try:
            if not hasattr(note, 'analysis') or not note.analysis.is_analyzed:
                _run_analysis(note.id)
                note.refresh_from_db()
        except NoteAnalysis.DoesNotExist:
            _run_analysis(note.id)
            note.refresh_from_db()

    # Агрегируем
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

    # Топ эмоций (сортировка)
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
                'preview': n.text[:100],
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