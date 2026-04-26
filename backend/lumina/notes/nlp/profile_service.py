# backend/lumina/notes/nlp/profile_service.py
from collections import defaultdict
from datetime import datetime, timedelta
from django.core.cache import cache
from django.utils import timezone
from ..models import Notes, NoteAnalysis


# Константы для кэширования
PROFILE_CACHE_TTL = 3600  # 1 час
PROFILE_CACHE_PREFIX = 'personality_profile'


def get_personality_profile(user_id: int, force_refresh: bool = False) -> dict:
    """
    Строит полный психологический профиль пользователя.
    С поддержкой кэширования для производительности.
    
    Args:
        user_id: ID пользователя
        force_refresh: принудительно пересчитать профиль (не использовать кэш)
    """
    cache_key = f"{PROFILE_CACHE_PREFIX}_{user_id}"
    
    if not force_refresh:
        cached = cache.get(cache_key)
        if cached:
            return cached
    
    analyses = NoteAnalysis.objects.filter(
        note__user_id=user_id,
        note__is_deleted=False,
        is_analyzed=True
    ).select_related('note').order_by('note__created_at')

    if not analyses.exists():
        result = {'has_data': False}
        cache.set(cache_key, result, PROFILE_CACHE_TTL)
        return result

    # ── 1. Облако тем с нормализацией ─────────────────────────────────────
    topic_counts = defaultdict(int)
    topic_sentiment = defaultdict(list)
    topic_timeline = defaultdict(lambda: defaultdict(int))  # тема -> неделя -> кол-во

    for a in analyses:
        week_key = _week_key(a.note.created_at)
        for topic in a.topics:
            topic_counts[topic] += 1
            topic_sentiment[topic].append(a.sentiment)
            topic_timeline[topic][week_key] += 1

    # Нормализуем веса (логарифмическое масштабирование для более равномерного облака)
    max_count = max(topic_counts.values(), default=1)
    import math
    tag_cloud = [
        {
            'topic': t,
            'count': c,
            'weight': round(math.log(c + 1) / math.log(max_count + 1), 3),
            'dominant_sentiment': _dominant(topic_sentiment[t]),
            'trend': _compute_topic_trend(topic_timeline[t]) if topic_timeline[t] else 'stable'
        }
        for t, c in sorted(topic_counts.items(), key=lambda x: -x[1])[:40]
    ]

    # ── 2. График настроения по дням с интерполяцией ──────────────────────
    mood_by_day = defaultdict(list)
    for a in analyses:
        day = a.note.created_at.strftime('%Y-%m-%d')
        score = _sentiment_to_score(a.sentiment, a.sentiment_score)
        mood_by_day[day].append(score)

    # Строим сырой массив для дальнейшего использования
    mood_timeline_raw = [
        {
            'date': day,
            'score': round(sum(scores) / len(scores), 2),
            'count': len(scores)
        }
        for day, scores in sorted(mood_by_day.items())
    ]

    # Добавляем тренд для каждого дня (если достаточно данных)
    mood_timeline = []
    for i, item in enumerate(mood_timeline_raw):
        day = item['date']
        # Вычисляем тренд на основе последних 7 дней
        if len(mood_timeline_raw) > 7:
            trend = _compute_mood_trend(mood_by_day, day)
        else:
            trend = 'insufficient_data'
        
        mood_timeline.append({
            'date': item['date'],
            'score': item['score'],
            'count': item['count'],
            'trend': trend
        })
        
    # ── 3. Топ эмоций с временной динамикой ───────────────────────────────
    total_emotions = defaultdict(float)
    emotions_by_week = defaultdict(lambda: defaultdict(float))
    
    for a in analyses:
        week = _week_key(a.note.created_at)
        for em, score in a.emotions.items():
            total_emotions[em] += score
            emotions_by_week[week][em] += score

    total = sum(total_emotions.values()) or 1
    emotions_summary = [
        {'emotion': em, 'score': round(v / total, 3)}
        for em, v in sorted(total_emotions.items(), key=lambda x: -x[1])
    ]

    # Тренды эмоций (последние 4 недели vs предыдущие)
    emotion_trends = _compute_emotion_trends(emotions_by_week)

    # ── 4. Динамика тем по неделям ────────────────────────────────────────
    weeks = defaultdict(lambda: defaultdict(int))
    for a in analyses:
        week = _week_key(a.note.created_at)
        for topic in a.topics[:3]:
            weeks[week][topic] += 1

    topics_dynamics = []
    for week, topics in sorted(weeks.items())[-12:]:
        top = sorted(topics.items(), key=lambda x: -x[1])[:5]
        topics_dynamics.append({
            'week': week,
            'topics': [{'topic': t, 'count': c} for t, c in top]
        })

    # ── 5. Психологические черты (улучшенные эвристики) ───────────────────
    traits = _compute_traits_improved(analyses, total_emotions)

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
    
    # Активность по часам с распределением
    hour_activity = _hour_activity_distribution(analyses)
    
    # Прогресс (как меняется средний тонус записей)
    sentiment_progress = _compute_sentiment_progress(analyses)

    result = {
        'has_data': True,
        'tag_cloud': tag_cloud,
        'mood_timeline': mood_timeline,
        'emotions_summary': emotions_summary,
        'emotion_trends': emotion_trends,
        'topics_dynamics': topics_dynamics,
        'traits': traits,
        'stats': {
            'total_analyzed': total_notes,
            'total_words': total_words,
            'avg_sentiment': round(avg_sentiment, 2),
            'streak_days': streak,
            'most_active_hour': _most_active_hour(analyses),
            'hour_activity': hour_activity,
            'sentiment_progress': sentiment_progress,
            'first_note_date': analyses.first().note.created_at.isoformat(),
            'last_note_date': analyses.last().note.created_at.isoformat(),
        }
    }
    
    cache.set(cache_key, result, PROFILE_CACHE_TTL)
    return result


def invalidate_profile_cache(user_id: int):
    """Инвалидирует кэш профиля при добавлении новой заметки"""
    cache_key = f"{PROFILE_CACHE_PREFIX}_{user_id}"
    cache.delete(cache_key)


# ── Вспомогательные функции ───────────────────────────────────────────────

def _sentiment_to_score(sentiment: str, score: float) -> float:
    """Конвертирует сентимент в числовую шкалу от 0 до 1"""
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


def _compute_traits_improved(analyses, total_emotions: dict) -> list:
    """Улучшенное вычисление психологических черт"""
    total = len(analyses)
    if total == 0:
        return []

    traits = []

    # 1. Открытость к новому — разнообразие тем с поправкой на количество заметок
    all_topics = [t for a in analyses for t in a.topics]
    unique_topics = len(set(all_topics))
    # Используем corrected diversity: чем больше заметок, тем выше ожидаемое разнообразие
    expected_diversity = min(1.0, total / 50)  # ожидаем 50 заметок для полного разнообразия
    observed_diversity = unique_topics / max(total, 10)
    openness = min(1.0, observed_diversity / max(expected_diversity, 0.1))
    traits.append({
        'name': 'Открытость к новому',
        'score': round(openness, 2),
        'description': f'{unique_topics} разных тем в {total} заметках',
        'icon': '🌟'
    })

    # 2. Рефлексивность — длина записей + наличие вопросительных предложений
    avg_words = sum(a.text_stats.get('word_count', 0) for a in analyses) / total
    # Считаем долю вопросительных предложений как признак самоанализа
    questions_ratio = _count_questions_ratio(analyses)
    reflectivity = min(1.0, (avg_words / 150) * 0.7 + questions_ratio * 0.3)
    traits.append({
        'name': 'Рефлексивность',
        'score': round(reflectivity, 2),
        'description': f'Средняя длина: {int(avg_words)} слов, {int(questions_ratio * 100)}% записей содержат вопросы',
        'icon': '🤔'
    })

    # 3. Эмоциональность — не только интенсивность, но и вариативность эмоций
    avg_intensity = sum(max(a.emotions.values(), default=0) for a in analyses) / total
    # Вариативность эмоций (чем больше разных эмоций, тем выше эмоциональность)
    unique_emotions_per_note = [
        len([e for e, s in a.emotions.items() if s > 0.2])
        for a in analyses
    ]
    avg_variety = sum(unique_emotions_per_note) / total
    emotionality = min(1.0, avg_intensity * 0.6 + (avg_variety / 5) * 0.4)
    traits.append({
        'name': 'Эмоциональность',
        'score': round(emotionality, 2),
        'description': f'Интенсивность: {avg_intensity:.2f}, вариативность: {avg_variety:.1f} эмоций на запись',
        'icon': '💖'
    })

    # 4. Позитивность — с учётом тренда
    positive_count = sum(1 for a in analyses if a.sentiment == 'positive')
    recent_analyses = list(analyses)[-min(10, total):]
    recent_positive = sum(1 for a in recent_analyses if a.sentiment == 'positive')
    recent_ratio = recent_positive / len(recent_analyses) if recent_analyses else 0.5
    
    # Сглаживаем: общая + тренд за последние записи
    overall_positivity = positive_count / total
    positivity = min(1.0, overall_positivity * 0.7 + recent_ratio * 0.3)
    traits.append({
        'name': 'Позитивность',
        'score': round(positivity, 2),
        'description': f'{positive_count} из {total} записей позитивные {"(тренд ↑)" if recent_ratio > overall_positivity else "(тренд ↓)" if recent_ratio < overall_positivity - 0.1 else ""}',
        'icon': '😊'
    })

    # 5. Регулярность — комплексная метрика
    days_with_notes = len(set(a.note.created_at.strftime('%Y-%m-%d') for a in analyses))
    first = analyses.first().note.created_at
    last = analyses.last().note.created_at
    total_days = max((last - first).days + 1, 1)
    
    # Коэффициент стабильности интервалов
    intervals = _compute_interval_regularity(analyses)
    
    base_regularity = days_with_notes / total_days
    regularity = min(1.0, base_regularity * 0.6 + intervals * 0.4)
    traits.append({
        'name': 'Регулярность',
        'score': round(regularity, 2),
        'description': f'Записи в {days_with_notes} из {total_days} дней',
        'icon': '📅'
    })

    # 6. НОВАЯ ЧЕРТА: Аналитичность — структура записей
    avg_sentences = sum(a.text_stats.get('sentence_count', 1) for a in analyses) / total
    avg_chars_per_word = sum(a.text_stats.get('char_count', 0) / max(a.text_stats.get('word_count', 1), 1) for a in analyses) / total
    analytical = min(1.0, (avg_sentences / 10) * 0.5 + (avg_chars_per_word / 10) * 0.5)
    traits.append({
        'name': 'Аналитичность',
        'score': round(analytical, 2),
        'description': f'В среднем {avg_sentences:.1f} предложений на запись',
        'icon': '📊'
    })

    return traits


def _count_questions_ratio(analyses) -> float:
    """Считает долю записей, содержащих вопросительные предложения"""
    question_count = 0
    for a in analyses:
        text = a.note.text or ''
        if '?' in text or '?' in text or any(
            q in text.lower() for q in ['почему', 'как', 'зачем', 'что если', 'когда']
        ):
            question_count += 1
    return question_count / len(analyses) if analyses else 0


def _compute_interval_regularity(analyses) -> float:
    """Вычисляет регулярность интервалов между записями"""
    if len(analyses) < 3:
        return 0.5  # недостаточно данных
    
    dates = sorted([a.note.created_at for a in analyses])
    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
    intervals = [i for i in intervals if i > 0]  # игнорируем несколько записей в один день
    
    if not intervals:
        return 0.5
    
    import math
    mean_interval = sum(intervals) / len(intervals)
    variance = sum((i - mean_interval) ** 2 for i in intervals) / len(intervals)
    std_dev = math.sqrt(variance)
    
    # Чем меньше стандартное отклонение, тем регулярнее
    regularity = max(0, min(1, 1 - (std_dev / max(mean_interval, 1))))
    return regularity


def _compute_mood_trend(mood_by_day: dict, current_day: str) -> str:
    """Вычисляет тренд настроения (улучшение/ухудшение/стабильно)"""
    days = sorted(mood_by_day.keys())
    if len(days) < 7:
        return 'insufficient_data'
    
    # Берём последние 7 дней
    last_7 = days[-7:]
    scores = [sum(mood_by_day[d]) / len(mood_by_day[d]) for d in last_7]
    
    if len(scores) < 2:
        return 'stable'
    
    # Линейная регрессия для определения тренда
    x = list(range(len(scores)))
    n = len(x)
    slope = (n * sum(x[i] * scores[i] for i in range(n)) - sum(x) * sum(scores)) / (n * sum(xi**2 for xi in x) - sum(x)**2)
    
    if slope > 0.03:
        return 'improving'
    elif slope < -0.03:
        return 'declining'
    return 'stable'


def _compute_emotion_trends(emotions_by_week: dict) -> dict:
    """Вычисляет тренды для каждой эмоции"""
    if len(emotions_by_week) < 2:
        return {}
    
    weeks = sorted(emotions_by_week.keys())
    recent_4 = weeks[-4:] if len(weeks) >= 4 else weeks
    previous_4 = weeks[-8:-4] if len(weeks) >= 8 else weeks[:len(recent_4)]
    
    trends = {}
    
    all_emotions = set()
    for week_data in emotions_by_week.values():
        all_emotions.update(week_data.keys())
    
    for emotion in all_emotions:
        recent_avg = sum(emotions_by_week[w].get(emotion, 0) for w in recent_4) / len(recent_4) if recent_4 else 0
        previous_avg = sum(emotions_by_week[w].get(emotion, 0) for w in previous_4) / len(previous_4) if previous_4 else 0
        
        if previous_avg == 0:
            trend = 'new' if recent_avg > 0 else 'stable'
        else:
            change = (recent_avg - previous_avg) / previous_avg
            if change > 0.2:
                trend = 'increasing'
            elif change < -0.2:
                trend = 'decreasing'
            else:
                trend = 'stable'
        
        trends[emotion] = {
            'current': round(recent_avg, 3),
            'previous': round(previous_avg, 3),
            'trend': trend
        }
    
    return trends


def _compute_topic_trend(topic_weeks: dict) -> str:
    """Вычисляет тренд темы (rising/stable/declining/new)"""
    if len(topic_weeks) < 2:
        return 'new' if topic_weeks else 'stable'
    
    weeks = sorted(topic_weeks.keys())
    recent = weeks[-2:]
    older = weeks[-4:-2] if len(weeks) >= 4 else weeks[:2]
    
    recent_avg = sum(topic_weeks[w] for w in recent) / len(recent)
    older_avg = sum(topic_weeks[w] for w in older) / len(older) if older else 0
    
    if older_avg == 0:
        return 'rising' if recent_avg > 0 else 'stable'
    
    ratio = recent_avg / older_avg
    if ratio > 1.5:
        return 'rising'
    elif ratio < 0.5:
        return 'declining'
    return 'stable'


def _hour_activity_distribution(analyses) -> dict:
    """Возвращает распределение активности по часам"""
    hours = [a.note.created_at.hour for a in analyses]
    total = len(hours)
    return {
        h: round(hours.count(h) / total * 100, 1)
        for h in range(24)
        if hours.count(h) > 0
    }


def _compute_sentiment_progress(analyses) -> dict:
    """Вычисляет прогресс в среднем тонусе записей"""
    if len(analyses) < 10:
        return {'has_trend': False}
    
    # Разбиваем на три периода
    total = len(analyses)
    first_period = list(analyses)[:total//3]
    last_period = list(analyses)[-total//3:]
    
    first_avg = sum(_sentiment_to_score(a.sentiment, a.sentiment_score) for a in first_period) / len(first_period)
    last_avg = sum(_sentiment_to_score(a.sentiment, a.sentiment_score) for a in last_period) / len(last_period)
    
    change = last_avg - first_avg
    return {
        'has_trend': True,
        'change': round(change * 100, 1),
        'direction': 'improving' if change > 0.05 else 'declining' if change < -0.05 else 'stable',
        'first_period_avg': round(first_avg, 2),
        'last_period_avg': round(last_avg, 2)
    }


def _compute_streak(user_id: int) -> int:
    """Вычисляет текущую серию дней с записями"""
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
    """Возвращает час с максимальной активностью"""
    hours = defaultdict(int)
    for a in analyses:
        hours[a.note.created_at.hour] += 1
    return max(hours, key=hours.get) if hours else 12

def get_traits_timeline(user_id: int) -> dict:
    """
    Строит помесячную историю психологических черт.
    Возвращает данные для графика динамики.
    
    Структура возврата:
    {
        'has_data': bool,
        'months': ['2025-11', '2025-12', '2026-01', ...],
        'traits': {
            'Открытость к новому': [0.4, 0.55, 0.6, ...],
            'Позитивность': [0.3, 0.45, 0.7, ...],
            ...
        }
    }
    """
    from ..models import NoteAnalysis
    import math
    from collections import defaultdict
 
    cache_key = f"traits_timeline_{user_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
 
    analyses = NoteAnalysis.objects.filter(
        note__user_id=user_id,
        note__is_deleted=False,
        is_analyzed=True,
    ).select_related('note').order_by('note__created_at')
 
    if analyses.count() < 3:
        result = {'has_data': False}
        cache.set(cache_key, result, PROFILE_CACHE_TTL)
        return result
 
    # Группируем по месяцам
    months_data = defaultdict(list)
    for a in analyses:
        month_key = a.note.created_at.strftime('%Y-%m')
        months_data[month_key].append(a)
 
    # Нужно минимум 2 месяца для динамики
    sorted_months = sorted(months_data.keys())
    if len(sorted_months) < 2:
        result = {'has_data': False}
        cache.set(cache_key, result, PROFILE_CACHE_TTL)
        return result
 
    traits_over_time = defaultdict(list)
 
    for month in sorted_months:
        month_analyses = months_data[month]
        total = len(month_analyses)
 
        # ── Открытость: разнообразие тем ──────────────────────────────
        all_topics = [t for a in month_analyses for t in a.topics]
        unique = len(set(all_topics))
        openness = min(1.0, unique / max(total * 2, 1))
        traits_over_time['Открытость'].append(round(openness, 3))
 
        # ── Позитивность ───────────────────────────────────────────────
        pos = sum(1 for a in month_analyses if a.sentiment == 'positive')
        positivity = round(pos / total, 3)
        traits_over_time['Позитивность'].append(positivity)
 
        # ── Рефлексивность: средняя длина записей ─────────────────────
        avg_words = sum(
            a.text_stats.get('word_count', 0) for a in month_analyses
        ) / total
        reflectivity = round(min(1.0, avg_words / 200), 3)
        traits_over_time['Рефлексивность'].append(reflectivity)
 
        # ── Эмоциональность: интенсивность эмоций ────────────────────
        avg_intensity = sum(
            max(a.emotions.values(), default=0) for a in month_analyses
        ) / total
        emotionality = round(min(1.0, avg_intensity), 3)
        traits_over_time['Эмоциональность'].append(emotionality)
 
        # ── Регулярность: заметок в этом месяце ──────────────────────
        # Нормируем: 30 заметок в месяц = 1.0
        regularity = round(min(1.0, total / 30), 3)
        traits_over_time['Регулярность'].append(regularity)
 
    result = {
        'has_data': True,
        'months': sorted_months,
        'traits': dict(traits_over_time),
    }
    cache.set(cache_key, result, PROFILE_CACHE_TTL)
    return result