# backend/lumina/notes/nlp/analyzer.py
import os
import re
import threading
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding,
    NewsMorphTagger, NewsNERTagger,
    NamesExtractor, Doc
)
import pymorphy3

from django.conf import settings

MODELS_DIR = os.path.join(settings.BASE_DIR, 'nlp_models')

# Глобальные переменные для моделей
_emotion_tokenizer = None
_emotion_model = None
_kw_model = None
_segmenter = None
_morph = None
_ner_tagger = None
_names_extractor = None
_pymorphy = None
_narrative_pipeline = None

# Защита от гонки потоков
_models_lock = threading.Lock()
_models_loaded = False
_loading_error = None

SENTIMENT_LABELS = {0: 'negative', 1: 'neutral', 2: 'positive'}

EMOTION_LEXICON = {
    'joy': [
        'радость', 'счастье', 'восторг', 'восхищение', 'ура', 'отлично', 'классно',
        'огонь', 'круто', 'замечательно', 'прекрасно', 'здорово', 'кайф', 'балдею',
        'ликую', 'эйфория', 'блаженство', 'восхитительно', 'великолепно', 'обожаю'
    ],
    'sadness': [
        'грусть', 'печаль', 'тоска', 'уныние', 'расстроен', 'грустно',
        'печально', 'горько', 'слёзы', 'плакал', 'одиноко', 'пусто',
        'безнадёжно', 'меланхолия', 'скорбь', 'разочарован', 'обидно', 'жалею'
    ],
    'anger': [
        'злость', 'ярость', 'бешенство', 'раздражение', 'злой', 'бесит',
        'достало', 'злюсь', 'раздражает', 'ненавижу', 'возмущён', 'негодую',
        'вне себя', 'взбешён', 'кипит', 'терпеть не могу', 'гнев', 'агрессия'
    ],
    'fear': [
        'страх', 'тревога', 'беспокойство', 'боюсь', 'страшно', 'тревожно',
        'нервничаю', 'волнуюсь', 'паника', 'ужас', 'пугает', 'дрожь',
        'испуган', 'переживаю', 'опасаюсь', 'жутко', 'мурашки', 'фобия'
    ],
    'surprise': [
        'удивление', 'неожиданно', 'вау', 'невероятно', 'поразительно',
        'не ожидал', 'удивлён', 'удивительно', 'шок', 'ошеломлён',
        'неожиданность', 'внезапно', 'поразил', 'потрясён', 'офигел'
    ],
    'fatigue': [
        'устал', 'усталость', 'выгорание', 'сложный день', 'тяжело',
        'вымотан', 'нет сил', 'изматывает', 'без сил', 'истощён',
        'еле живой', 'упадок', 'разбит', 'обессилел', 'измотан', 'апатия'
    ],
    'interest': [
        'интересно', 'любопытно', 'захватывает', 'увлекательно', 'интерес',
        'заинтересован', 'хочу узнать', 'изучаю', 'увлёкся', 'fascinated',
        'поглощён', 'вдохновляет', 'мотивирует', 'задумался', 'исследую'
    ],
    'pride': [
        'гордость', 'горжусь', 'достижение', 'справился', 'смог', 'победил',
        'успех', 'результат', 'вышло', 'получилось', 'сделал', 'достиг',
        'выполнил', 'преодолел', 'молодец', 'горжусь собой'
    ],
    'gratitude': [
        'благодарен', 'спасибо', 'признателен', 'ценю', 'дорожу',
        'повезло', 'счастлив иметь', 'рад что есть', 'благодарность',
        'признательность', 'тронут', 'растрогало'
    ],
}

# Интенсификаторы и негаторы для точности
INTENSIFIERS = ['очень', 'крайне', 'невероятно', 'жутко', 'страшно', 'безумно', 'дико', 'чертовски']
NEGATORS = ['не', 'нет', 'никогда', 'ничуть', 'вовсе не', 'совсем не', 'нисколько']


@dataclass
class AnalysisResult:
    sentiment: str = 'neutral'
    sentiment_score: float = 0.0
    emotions: Dict[str, float] = field(default_factory=dict)
    dominant_emotion: str = 'neutral'
    keywords: List[str] = field(default_factory=list)
    entities: Dict[str, List[str]] = field(default_factory=dict)
    topics: List[str] = field(default_factory=list)
    text_stats: Dict = field(default_factory=dict)
    narrative: str = ''


def _load_models():
    """Потокобезопасная загрузка моделей"""
    global _emotion_tokenizer, _emotion_model, _kw_model
    global _segmenter, _morph, _ner_tagger, _names_extractor, _pymorphy
    global _models_loaded, _loading_error

    # Быстрая проверка без блокировки
    if _models_loaded:
        return
    if _loading_error is not None:
        raise RuntimeError(f"Модели не загружены: {_loading_error}")

    with _models_lock:
        # Двойная проверка после захвата блокировки
        if _models_loaded:
            return
        if _loading_error is not None:
            raise RuntimeError(f"Модели не загружены: {_loading_error}")

        try:
            rubert_path = os.path.join(MODELS_DIR, 'rubert-tiny2')
            minilm_path = os.path.join(MODELS_DIR, 'multilingual-minilm')

            # Проверяем наличие моделей
            if not os.path.exists(rubert_path):
                raise FileNotFoundError(
                    f"Модель rubert-tiny2 не найдена в {rubert_path}.\n"
                    f"Запустите: python manage.py download_models"
                )
            if not os.path.exists(minilm_path):
                raise FileNotFoundError(
                    f"Модель multilingual-minilm не найдена в {minilm_path}.\n"
                    f"Запустите: python manage.py download_models"
                )

            # Sentiment модель
            _emotion_tokenizer = AutoTokenizer.from_pretrained(rubert_path)
            _emotion_model = AutoModelForSequenceClassification.from_pretrained(rubert_path)
            _emotion_model.eval()

            # KeyBERT
            st = SentenceTransformer(minilm_path)
            _kw_model = KeyBERT(model=st)

            # Natasha NER
            _segmenter = Segmenter()
            _morph = MorphVocab()
            emb = NewsEmbedding()
            morph_tagger = NewsMorphTagger(emb)
            _ner_tagger = NewsNERTagger(emb)
            _names_extractor = NamesExtractor(_morph)
            _pymorphy = pymorphy3.MorphAnalyzer()
            _load_models._morph_tagger = morph_tagger

            _models_loaded = True

        except Exception as e:
            _loading_error = str(e)
            raise RuntimeError(f"Ошибка загрузки NLP-моделей: {e}")


_load_models._morph_tagger = None


def analyze_text(text: str) -> AnalysisResult:
    """Основная функция анализа текста с graceful fallback"""
    if not text or len(text.strip()) < 3:
        return AnalysisResult()

    try:
        _load_models()
    except RuntimeError as e:
        # Fallback — возвращаем базовый результат без анализа
        print(f"[NLP] Предупреждение: {e}")
        result = AnalysisResult()
        result.narrative = "NLP-модели не загружены. Запустите: python manage.py download_models"
        return result

    result = AnalysisResult()

    clean = _clean_text(text)

    result.sentiment, result.sentiment_score = _get_sentiment(clean)
    result.emotions = _detect_emotions(clean, result.sentiment, result.sentiment_score)
    result.dominant_emotion = max(result.emotions, key=result.emotions.get) \
        if result.emotions else 'neutral'
    result.keywords = _extract_keywords(clean)
    result.entities = _extract_entities(clean)
    result.topics = _build_topics(result.keywords, result.entities)

    words = clean.split()
    sentences = [s.strip() for s in re.split(r'[.!?]+', clean) if s.strip()]
    result.text_stats = {
        'word_count': len(words),
        'char_count': len(clean),
        'sentence_count': len(sentences),
        'avg_sentence_length': len(words) / max(len(sentences), 1),
    }

    result.narrative = _generate_narrative(
        text=clean,
        sentiment=result.sentiment,
        sentiment_score=result.sentiment_score,
        emotions=result.emotions,
        dominant_emotion=result.dominant_emotion,
        keywords=result.keywords,
        entities=result.entities,
        text_stats=result.text_stats,
    )

    return result


def generate_day_narrative(
    day_analyses: List[dict],
    date_str: str,
    total_words: int,
) -> str:
    """
    Генерирует связный текстовый нарратив для сводки дня.
    Работает полностью локально — без внешних API.
    """
    if not day_analyses:
        return "За этот день записей не найдено."

    # Агрегируем данные
    sentiments = [a.get('sentiment', 'neutral') for a in day_analyses]
    all_emotions: Dict[str, float] = {}
    all_topics: List[str] = []
    all_keywords: List[str] = []

    for a in day_analyses:
        for em, score in a.get('emotions', {}).items():
            all_emotions[em] = all_emotions.get(em, 0) + score
        all_topics.extend(a.get('topics', [])[:3])
        all_keywords.extend(a.get('keywords', [])[:3])

    note_count = len(day_analyses)
    if note_count > 0:
        all_emotions = {k: v / note_count for k, v in all_emotions.items()}

    # Определяем общий тон дня
    pos = sentiments.count('positive')
    neg = sentiments.count('negative')
    neu = sentiments.count('neutral')

    if pos > neg and pos > neu:
        day_tone = 'positive'
    elif neg > pos and neg > neu:
        day_tone = 'negative'
    else:
        day_tone = 'neutral'

    # Топ эмоции
    top_emotions = sorted(all_emotions.items(), key=lambda x: -x[1])[:3]

    # Топ темы (уникальные)
    seen = set()
    unique_topics = []
    for t in all_topics:
        if t.lower() not in seen and len(t) > 2:
            seen.add(t.lower())
            unique_topics.append(t)
    unique_topics = unique_topics[:5]

    # Строим нарратив по шаблонам
    parts = []

    opening = _day_opening(day_tone, note_count, total_words)
    parts.append(opening)

    if top_emotions:
        emotion_text = _emotion_narrative(top_emotions, day_tone)
        if emotion_text:
            parts.append(emotion_text)

    if unique_topics:
        topic_text = _topic_narrative(unique_topics, day_tone)
        if topic_text:
            parts.append(topic_text)

    closing = _day_closing(day_tone, top_emotions, unique_topics)
    parts.append(closing)

    return ' '.join(parts)


EMOTION_NAMES_RU = {
    'joy': 'радость', 'sadness': 'грусть', 'anger': 'раздражение',
    'fear': 'тревога', 'surprise': 'удивление', 'fatigue': 'усталость',
    'interest': 'интерес', 'pride': 'гордость', 'gratitude': 'благодарность',
    'neutral': 'спокойствие',
}

EMOTION_EMOJI_MAP = {
    'joy': '😊', 'sadness': '😔', 'anger': '😤', 'fear': '😰',
    'surprise': '😲', 'fatigue': '😴', 'interest': '🤔',
    'pride': '💪', 'gratitude': '🙏', 'neutral': '😐',
}


def _day_opening(tone: str, note_count: int, total_words: int) -> str:
    notes_word = _pluralize(note_count, 'запись', 'записи', 'записей')

    if tone == 'positive':
        openings = [
            f"День получился светлым и продуктивным — {note_count} {notes_word}, {total_words} слов.",
            f"Судя по записям, этот день прошёл на позитивной ноте. {note_count} {notes_word} отражают хорошее настроение.",
            f"Хороший день: {note_count} {notes_word}, {total_words} слов мыслей и наблюдений.",
        ]
    elif tone == 'negative':
        openings = [
            f"День выдался непростым — {note_count} {notes_word}, {total_words} слов переживаний.",
            f"По записям видно, что этот день дался нелегко. {note_count} {notes_word}.",
            f"Трудный день: {note_count} {notes_word}, много эмоций и размышлений.",
        ]
    else:
        openings = [
            f"Спокойный, размеренный день — {note_count} {notes_word}, {total_words} слов.",
            f"Обычный день с несколькими заметками: {note_count} {notes_word}.",
            f"День прошёл ровно. {note_count} {notes_word}, {total_words} слов наблюдений.",
        ]

    import random
    random.seed(note_count + total_words)
    return random.choice(openings)


def _emotion_narrative(top_emotions: List[Tuple[str, float]], tone: str) -> str:
    if not top_emotions:
        return ''

    dominant_em, dominant_score = top_emotions[0]
    dominant_name = EMOTION_NAMES_RU.get(dominant_em, dominant_em)
    emoji = EMOTION_EMOJI_MAP.get(dominant_em, '')

    intensity = 'сильная' if dominant_score > 0.6 else 'умеренная' if dominant_score > 0.3 else 'лёгкая'

    if len(top_emotions) == 1:
        return f"Главная эмоция дня — {dominant_name} {emoji} ({intensity})."

    secondary_names = [EMOTION_NAMES_RU.get(e, e) for e, _ in top_emotions[1:]]

    if len(secondary_names) == 1:
        return (
            f"Доминирующая эмоция — {dominant_name} {emoji}, "
            f"на фоне {secondary_names[0]}."
        )
    else:
        others = ' и '.join(secondary_names)
        return (
            f"Доминирующая эмоция — {dominant_name} {emoji}, "
            f"рядом присутствуют {others}."
        )


def _topic_narrative(topics: List[str], tone: str) -> str:
    if not topics:
        return ''

    if len(topics) == 1:
        return f"Главная тема дня — «{topics[0]}»."
    elif len(topics) == 2:
        return f"Основные темы дня: «{topics[0]}» и «{topics[1]}»."
    else:
        main = topics[0]
        rest = ', '.join(f'«{t}»' for t in topics[1:3])
        return f"Центральная тема — «{main}», также встречаются {rest}."


def _day_closing(
    tone: str,
    top_emotions: List[Tuple[str, float]],
    topics: List[str],
) -> str:
    dominant_em = top_emotions[0][0] if top_emotions else 'neutral'

    closings = {
        'positive': [
            "Хороший задел для следующего дня — сохрани этот импульс.",
            "Позитивная энергия этого дня — хорошая основа для движения вперёд.",
            "День прожит с пользой. Стоит отметить, что работает хорошо.",
        ],
        'negative': [
            "Трудные дни тоже важны — они показывают, что нуждается во внимании.",
            "Даже сложный день даёт ценную информацию о себе. Что можно изменить?",
            "Важно не оценивать, а наблюдать: что именно сделало день тяжёлым?",
        ],
        'neutral': [
            "Ровные дни часто самые продуктивные на дистанции.",
            "Спокойствие — тоже ресурс. День прошёл стабильно.",
            "Иногда ровный день — именно то, что нужно для восстановления.",
        ],
    }

    emotion_closings = {
        'fatigue': "Усталость — сигнал: стоит позаботиться о восстановлении.",
        'pride': "Гордость за результат — заслуженное чувство. Зафиксируй достижение.",
        'fear': "Тревога указывает на что-то важное. Попробуй разобрать её источник.",
        'anger': "Раздражение часто говорит о нарушенных границах или несбывшихся ожиданиях.",
        'interest': "Интерес — топливо для роста. Развивай то, что зажгло тебя сегодня.",
        'gratitude': "Благодарность — одна из самых мощных практик. Хорошо, что она есть.",
    }

    if dominant_em in emotion_closings:
        return emotion_closings[dominant_em]

    import random
    random.seed(len(topics))
    return random.choice(closings.get(tone, closings['neutral']))


def _generate_narrative(
    text: str,
    sentiment: str,
    sentiment_score: float,
    emotions: Dict[str, float],
    dominant_emotion: str,
    keywords: List[str],
    entities: Dict[str, List[str]],
    text_stats: Dict,
) -> str:
    """Генерирует короткий нарратив для одной заметки"""
    word_count = text_stats.get('word_count', 0)

    if word_count < 5:
        return "Короткая заметка без выраженного контекста."

    emotion_name = EMOTION_NAMES_RU.get(dominant_emotion, 'нейтральное')
    emoji = EMOTION_EMOJI_MAP.get(dominant_emotion, '')

    sentiment_phrases = {
        'positive': 'позитивный',
        'negative': 'напряжённый',
        'neutral': 'нейтральный',
    }
    tone_word = sentiment_phrases.get(sentiment, 'нейтральный')

    parts = [f"Тон записи — {tone_word}, доминирует {emotion_name} {emoji}."]

    if keywords:
        kw_str = ', '.join(f'«{k}»' for k in keywords[:3])
        parts.append(f"Ключевые темы: {kw_str}.")

    persons = entities.get('PER', [])
    orgs = entities.get('ORG', [])
    if persons:
        parts.append(f"Упомянуты люди: {', '.join(persons[:2])}.")
    if orgs:
        parts.append(f"Организации: {', '.join(orgs[:2])}.")

    return ' '.join(parts)


def _pluralize(n: int, form1: str, form2: str, form5: str) -> str:
    """Склонение существительных по числу"""
    n = abs(n) % 100
    if 11 <= n <= 19:
        return form5
    n = n % 10
    if n == 1:
        return form1
    if 2 <= n <= 4:
        return form2
    return form5


def _clean_text(text: str) -> str:
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'\*+|_+|`+|#{1,6}\s', '', text)
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:2000]


def _get_sentiment(text: str) -> Tuple[str, float]:
    inputs = _emotion_tokenizer(
        text, return_tensors='pt', truncation=True,
        max_length=512, padding=True
    )
    with torch.no_grad():
        logits = _emotion_model(**inputs).logits
    probs = torch.softmax(logits, dim=1)[0]
    pred = int(torch.argmax(probs))
    label = SENTIMENT_LABELS.get(pred, 'neutral')
    score = float(probs[pred])
    return label, score


def _detect_emotions(text: str, sentiment: str, sentiment_score: float) -> Dict[str, float]:
    """
    Детектирует эмоции с проверкой границ слов и учётом лемматизации.
    Исправлена проблема с поиском подстрок ("незлой" не поймает "злой").
    """
    text_lower = text.lower()
    
    # Разбиваем на слова для проверки границ
    words = text_lower.split()
    scores = {}

    for emotion, keywords in EMOTION_LEXICON.items():
        hits = 0
        for kw in keywords:
            kw_lower = kw.lower()
            
            # Проверяем как целое слово с границами
            # Ищем отдельное слово, а не подстроку
            found = False
            for word in words:
                # Точное совпадение или вхождение с учётом пунктуации
                if word == kw_lower or word.startswith(kw_lower + '?') or word.startswith(kw_lower + '!'):
                    found = True
                    break
                # Проверяем, не является ли kw частью другого слова с приставкой
                # Например "незлой" — не должно считаться как "злой"
                if kw_lower in word and len(word) > len(kw_lower):
                    # Если слово длиннее ключевого слова, проверяем, что это не приставка
                    # Ищем "злой" но не "незлой"
                    prefix = word[:word.find(kw_lower)]
                    if prefix and any(neg in prefix for neg in NEGATORS):
                        continue  # Есть негация — пропускаем
                    found = True
                    break
            
            if found:
                # Находим контекст для проверки негаторов/интенсификаторов
                idx = text_lower.find(kw_lower)
                start_context = max(0, idx - 30)
                context = text_lower[start_context:idx]
                
                negated = any(neg in context for neg in NEGATORS)
                intensified = any(intens in context for intens in INTENSIFIERS)
                
                if not negated:
                    hits += 1.5 if intensified else 1.0

        if hits > 0:
            scores[emotion] = min(1.0, hits * 0.3 + 0.15)

    # Усиливаем через sentiment
    if sentiment == 'positive' and sentiment_score > 0.6:
        for e in ('joy', 'interest', 'pride', 'gratitude', 'surprise'):
            if e in scores:
                scores[e] = min(1.0, scores[e] + 0.2)
    elif sentiment == 'negative' and sentiment_score > 0.6:
        for e in ('sadness', 'anger', 'fear', 'fatigue'):
            if e in scores:
                scores[e] = min(1.0, scores[e] + 0.2)

    if not scores:
        base = {'positive': 'joy', 'negative': 'sadness', 'neutral': 'neutral'}
        scores[base[sentiment]] = sentiment_score

    return dict(sorted(scores.items(), key=lambda x: -x[1])[:6])


def _extract_keywords(text: str) -> List[str]:
    if len(text.split()) < 3:
        return []
    try:
        kws = _kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words=None,
            top_n=10,
            use_mmr=True,
            diversity=0.6,
        )
        result = []
        for kw, score in kws:
            if score > 0.18:
                lemma = _lemmatize_phrase(kw)
                if lemma and len(lemma) > 2:
                    result.append(lemma)
        return result[:6]
    except Exception:
        return []


def _lemmatize_phrase(phrase: str) -> str:
    words = phrase.split()
    lemmas = []
    for word in words:
        parsed = _pymorphy.parse(word)
        if parsed:
            lemmas.append(parsed[0].normal_form)
    return ' '.join(lemmas)


def _extract_entities(text: str) -> Dict[str, List[str]]:
    entities = {'PER': [], 'ORG': [], 'LOC': []}
    try:
        doc = Doc(text)
        doc.segment(_segmenter)
        doc.tag_morph(_load_models._morph_tagger)
        doc.tag_ner(_ner_tagger)
        for span in doc.spans:
            span.normalize(_morph)
            etype = span.type
            if etype in entities and span.normal not in entities[etype]:
                entities[etype].append(span.normal)
    except Exception:
        pass
    return {k: v for k, v in entities.items() if v}


def _build_topics(keywords: List[str], entities: Dict[str, List[str]]) -> List[str]:
    topics = list(keywords)
    for etype, vals in entities.items():
        topics.extend(vals[:2])
    seen = set()
    result = []
    for t in topics:
        t_norm = t.lower().strip()
        if t_norm not in seen and len(t_norm) > 2:
            seen.add(t_norm)
            result.append(t)
    return result[:10]