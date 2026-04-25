import threading
from ..models import Notes, NoteAnalysis
from .analyzer import analyze_text


def analyze_note_async(note_id: int):
    """Запускает анализ в отдельном потоке, чтобы не блокировать API"""
    thread = threading.Thread(
        target=_run_analysis,
        args=(note_id,),
        daemon=True
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
                'is_analyzed': True,
            }
        )

    except Exception as e:
        print(f"[NLP] Ошибка анализа заметки {note_id}: {e}")


def get_daily_summary(user_id: int, date_str: str) -> dict:
    """Агрегирует анализы всех заметок за конкретный день"""
    from django.utils.dateparse import parse_date
    from datetime import timedelta
    from django.utils import timezone

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
        created_at__lt=end
    ).prefetch_related('analysis')

    if not notes.exists():
        return {'date': date_str, 'notes_count': 0, 'message': 'Нет заметок за этот день'}

    # Агрегируем
    all_emotions = {}
    all_topics = {}
    sentiments = []
    total_words = 0

    for note in notes:
        try:
            analysis = note.analysis
            if not analysis.is_analyzed:
                continue
            # Эмоции
            for em, score in analysis.emotions.items():
                all_emotions[em] = all_emotions.get(em, 0) + score
            # Топики
            for topic in analysis.topics:
                all_topics[topic] = all_topics.get(topic, 0) + 1
            # Sentiment
            sentiments.append(analysis.sentiment)
            # Слова
            total_words += analysis.text_stats.get('word_count', 0)
        except NoteAnalysis.DoesNotExist:
            continue

    # Нормализуем эмоции
    note_count = len([n for n in notes if hasattr(n, 'analysis')])
    if note_count > 0:
        all_emotions = {k: round(v / note_count, 3) for k, v in all_emotions.items()}

    # Общее настроение дня
    if sentiments:
        pos = sentiments.count('positive')
        neg = sentiments.count('negative')
        if pos > neg:
            day_mood = 'positive'
        elif neg > pos:
            day_mood = 'negative'
        else:
            day_mood = 'neutral'
    else:
        day_mood = 'neutral'

    return {
        'date': date_str,
        'notes_count': notes.count(),
        'analyzed_count': note_count,
        'day_mood': day_mood,
        'dominant_emotion': max(all_emotions, key=all_emotions.get) if all_emotions else 'neutral',
        'emotions': dict(sorted(all_emotions.items(), key=lambda x: -x[1])),
        'top_topics': dict(sorted(all_topics.items(), key=lambda x: -x[1])[:10]),
        'total_words': total_words,
        'notes': [
            {
                'id': n.id,
                'title': n.title,
                'preview': n.text[:80],
                'created_at': n.created_at.isoformat(),
            }
            for n in notes
        ]
    }