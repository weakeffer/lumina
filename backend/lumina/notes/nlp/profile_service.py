# backend/lumina/notes/nlp/profile_service.py
from collections import defaultdict
from datetime import datetime, timedelta
from django.utils import timezone
from ..models import Notes, NoteAnalysis


def get_personality_profile(user_id: int) -> dict:
    """Строит полный психологический профиль пользователя"""

    analyses = NoteAnalysis.objects.filter(
        note__user_id=user_id,
        note__is_deleted=False,
        is_analyzed=True
    ).select_related('note').order_by('note__created_at')

    if not analyses.exists():
        return {'has_data': False}

    # ── 1. Облако тем ─────────────────────────────────────────────────────
    topic_counts = defaultdict(int)
    topic_sentiment = defaultdict(list)

    for a in analyses:
        for topic in a.topics:
            topic_counts[topic] += 1
            topic_sentiment[topic].append(a.sentiment)

    # Нормализуем веса
    max_count = max(topic_counts.values(), default=1)
    tag_cloud = [
        {
            'topic': t,
            'count': c,
            'weight': round(c / max_count, 3),
            'dominant_sentiment': _dominant(topic_sentiment[t])
        }
        for t, c in sorted(topic_counts.items(), key=lambda x: -x[1])[:40]
    ]

    # ── 2. График настроения по дням ──────────────────────────────────────
    mood_by_day = defaultdict(list)
    for a in analyses:
        day = a.note.created_at.strftime('%Y-%m-%d')
        score = _sentiment_to_score(a.sentiment, a.sentiment_score)
        mood_by_day[day].append(score)

    mood_timeline = [
        {
            'date': day,
            'score': round(sum(scores) / len(scores), 2),
            'count': len(scores)
        }
        for day, scores in sorted(mood_by_day.items())
    ]

    # ── 3. Топ эмоций за всё время ────────────────────────────────────────
    total_emotions = defaultdict(float)
    for a in analyses:
        for em, score in a.emotions.items():
            total_emotions[em] += score

    total = sum(total_emotions.values()) or 1
    emotions_summary = [
        {'emotion': em, 'score': round(v / total, 3)}
        for em, v in sorted(total_emotions.items(), key=lambda x: -x[1])
    ]

    # ── 4. Динамика тем по неделям ────────────────────────────────────────
    weeks = defaultdict(lambda: defaultdict(int))
    for a in analyses:
        week = _week_key(a.note.created_at)
        for topic in a.topics[:3]:  # топ-3 темы заметки
            weeks[week][topic] += 1

    topics_dynamics = []
    for week, topics in sorted(weeks.items())[-12:]:  # последние 12 недель
        top = sorted(topics.items(), key=lambda x: -x[1])[:5]
        topics_dynamics.append({
            'week': week,
            'topics': [{'topic': t, 'count': c} for t, c in top]
        })

    # ── 5. Психологические черты ──────────────────────────────────────────
    traits = _compute_traits(analyses, total_emotions)

    # ── 6. Общая статистика ───────────────────────────────────────────────
    total_notes = analyses.count()
    total_words = sum(
        a.text_stats.get('word_count', 0) for a in analyses
    )
    avg_sentiment = sum(
        _sentiment_to_score(a.sentiment, a.sentiment_score)
        for a in analyses
    ) / total_notes

    # Серия дней подряд
    streak = _compute_streak(user_id)

    return {
        'has_data': True,
        'tag_cloud': tag_cloud,
        'mood_timeline': mood_timeline,
        'emotions_summary': emotions_summary,
        'topics_dynamics': topics_dynamics,
        'traits': traits,
        'stats': {
            'total_analyzed': total_notes,
            'total_words': total_words,
            'avg_sentiment': round(avg_sentiment, 2),
            'streak_days': streak,
            'most_active_hour': _most_active_hour(analyses),
        }
    }


# ── Вспомогательные ───────────────────────────────────────────────────────

def _sentiment_to_score(sentiment: str, score: float) -> float:
    if sentiment == 'positive':
        return 0.5 + score * 0.5
    elif sentiment == 'negative':
        return 0.5 - score * 0.5
    return 0.5


def _dominant(sentiments: list) -> str:
    if not sentiments:
        return 'neutral'
    counts = {'positive': 0, 'neutral': 0, 'negative': 0}
    for s in sentiments:
        counts[s] = counts.get(s, 0) + 1
    return max(counts, key=counts.get)


def _week_key(dt: datetime) -> str:
    monday = dt - timedelta(days=dt.weekday())
    return monday.strftime('%Y-%m-%d')


def _compute_traits(analyses, total_emotions: dict) -> list:
    """Вычисляет психологические черты по паттернам записей"""
    total = len(analyses)
    if total == 0:
        return []

    traits = []

    # Открытость к новому — много разных тем
    all_topics = [t for a in analyses for t in a.topics]
    diversity = len(set(all_topics)) / max(len(all_topics), 1)
    traits.append({
        'name': 'Открытость к новому',
        'score': round(min(diversity * 2, 1.0), 2),
        'description': 'Разнообразие тем в записях'
    })

    # Рефлексивность — длина записей
    avg_words = sum(
        a.text_stats.get('word_count', 0) for a in analyses
    ) / total
    reflectivity = min(avg_words / 200, 1.0)
    traits.append({
        'name': 'Рефлексивность',
        'score': round(reflectivity, 2),
        'description': f'Средняя длина записи: {int(avg_words)} слов'
    })

    # Эмоциональность — интенсивность эмоций
    avg_emotion_intensity = sum(
        max(a.emotions.values(), default=0) for a in analyses
    ) / total
    traits.append({
        'name': 'Эмоциональность',
        'score': round(min(avg_emotion_intensity, 1.0), 2),
        'description': 'Средняя интенсивность эмоций в записях'
    })

    # Позитивность — доля позитивных записей
    positive_count = sum(1 for a in analyses if a.sentiment == 'positive')
    traits.append({
        'name': 'Позитивность',
        'score': round(positive_count / total, 2),
        'description': f'{positive_count} из {total} записей позитивные'
    })

    # Регулярность — насколько равномерно ведётся дневник
    days_with_notes = len(set(
        a.note.created_at.strftime('%Y-%m-%d') for a in analyses
    ))
    first = analyses.first().note.created_at
    last = analyses.last().note.created_at
    total_days = max((last - first).days + 1, 1)
    regularity = days_with_notes / total_days
    traits.append({
        'name': 'Регулярность',
        'score': round(min(regularity * 2, 1.0), 2),
        'description': f'Записи в {days_with_notes} из {total_days} дней'
    })

    return traits


def _compute_streak(user_id: int) -> int:
    today = timezone.now().date()
    streak = 0
    current = today

    while True:
        has = Notes.objects.filter(
            user_id=user_id,
            is_deleted=False,
            created_at__date=current
        ).exists()
        if has:
            streak += 1
            current -= timedelta(days=1)
        else:
            break

    return streak


def _most_active_hour(analyses) -> int:
    hours = defaultdict(int)
    for a in analyses:
        hours[a.note.created_at.hour] += 1
    return max(hours, key=hours.get) if hours else 12