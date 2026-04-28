# backend/lumina/notes/nlp/analyzer.py
"""
Контекстно-взвешенный NLP-анализатор для русского языка.

Ключевые улучшения:
1. Понимание временных переходов («но», «зато», «сейчас», «теперь»)
2. Взвешенное усреднение — более поздние части текста имеют больший вес
3. Сегментация текста на смысловые блоки с учётом контрастных союзов
4. Надёжный стоп-список для русского языка
5. Раздельный анализ каждого сегмента с последующей агрегацией
"""

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
import time
import logging

from django.conf import settings
from .neural_emotion_analyzer import detect_emotions_neural, map_neural_to_legacy_emotions
from .neural_emotion_analyzer import get_emotion_analyzer, NeuralEmotionAnalyzer

MODELS_DIR = os.path.join(settings.BASE_DIR, 'nlp_models')

# ── Глобальные переменные моделей ─────────────────────────────────────────
_emotion_tokenizer = None
_emotion_model = None
_kw_model = None
_segmenter = None
_morph = None
_ner_tagger = None
_names_extractor = None
_pymorphy = None

_models_lock = threading.Lock()
_models_loaded = False
_loading_error = None

logger = logging.getLogger('lumina.nlp')

SENTIMENT_LABELS = {0: 'negative', 1: 'neutral', 2: 'positive'}
MAX_SEGMENTATION_TIME = 2.0

# ── Стоп-слова для русского языка ─────────────────────────────────────────
RUSSIAN_STOP_WORDS = {
    'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как',
    'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к',
    'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'её', 'мне', 'было',
    'вот', 'от', 'меня', 'ещё', 'нет', 'о', 'из', 'ему', 'теперь',
    'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни',
    'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам',
    'сказал', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может',
    'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя',
    'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз',
    'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'этого',
    'того', 'том', 'этом', 'мой', 'твой', 'свой', 'наш', 'ваш', 'этот',
    'эта', 'это', 'эти', 'тот', 'та', 'те', 'такой', 'такая', 'такое',
    'очень', 'здесь', 'между', 'через', 'про', 'над', 'при', 'об', 'из-за',
}

# ── Контрастные коннекторы (сигнализируют о смене тона) ───────────────────
CONTRAST_CONNECTORS = {
    # Сильный контраст — финальная часть важнее
    'но': 1.8,
    'зато': 2.0,
    'однако': 1.8,
    'хотя': 1.6,
    'несмотря': 1.5,
    'тем не менее': 1.7,
    'всё равно': 1.5,
    'при этом': 1.4,
    'впрочем': 1.5,
    'всё же': 1.6,
    # Временной переход к лучшему
    'сейчас': 1.9,
    'теперь': 1.9,
    'уже': 1.4,
    'наконец': 1.7,
    'в итоге': 1.8,
    'в конце': 1.7,
    'потом': 1.3,
    'после': 1.3,
    'позже': 1.4,
    # Усилители положительного
    'зато сейчас': 2.5,
    'но сейчас': 2.3,
    'а сейчас': 2.2,
    'а теперь': 2.2,
    # Уступительные
    'правда': 0.9,
    'конечно': 1.0,
}

# ── Усилители и негаторы ──────────────────────────────────────────────────
INTENSIFIERS = {
    'очень': 1.5, 'крайне': 1.7, 'невероятно': 1.8, 'жутко': 1.6,
    'страшно': 1.4, 'безумно': 1.7, 'дико': 1.6, 'чертовски': 1.5,
    'абсолютно': 1.5, 'совершенно': 1.4, 'просто': 1.2, 'реально': 1.2,
    'действительно': 1.3, 'огонь': 2.0, 'бомба': 1.8, 'шикарно': 1.8,
}

NEGATORS = {
    'не': -1.0, 'нет': -1.0, 'никогда': -1.2, 'ничуть': -1.0,
    'вовсе не': -1.3, 'совсем не': -1.2, 'нисколько': -1.0,
    'ни': -0.8, 'без': -0.5, 'никак': -1.0, 'невозможно': -1.1,
}

# ── Эмоциональный лексикон ────────────────────────────────────────────────
EMOTION_LEXICON: Dict[str, List[str]] = {
    'joy': [
        'радость', 'счастье', 'восторг', 'восхищение', 'ура', 'отлично', 'классно',
        'огонь', 'круто', 'замечательно', 'прекрасно', 'здорово', 'кайф', 'балдею',
        'ликую', 'эйфория', 'блаженство', 'восхитительно', 'великолепно', 'обожаю',
        'хорошо', 'хорошее', 'хороший', 'рад', 'рада', 'рады', 'отличный', 'отличное',
        'супер', 'шикарно', 'бомба', 'топ', 'лучше', 'лучший', 'лучшая', 'нравится',
        'понравилось', 'понравился', 'кайфово', 'кайфанул', 'оценил', 'оценила',
        'доволен', 'довольна', 'доволен', 'позитив', 'позитивный', 'драйв', 'вдохновение',
        'вдохновлён', 'вдохновлена', 'мотивация', 'мотивирован', 'энергия', 'бодрость',
    ],
    'sadness': [
        'грусть', 'печаль', 'тоска', 'уныние', 'расстроен', 'грустно',
        'печально', 'горько', 'слёзы', 'плакал', 'одиноко', 'пусто',
        'безнадёжно', 'меланхолия', 'скорбь', 'разочарован', 'обидно', 'жалею',
        'плохо', 'плохой', 'плохая', 'плохое', 'тяжело', 'тяжёло', 'грустный',
        'горько', 'боль', 'больно', 'тоскливо', 'уныние', 'безнадёга', 'уныло',
    ],
    'anger': [
        'злость', 'ярость', 'бешенство', 'раздражение', 'злой', 'бесит',
        'достало', 'злюсь', 'раздражает', 'ненавижу', 'возмущён', 'негодую',
        'вне себя', 'взбешён', 'кипит', 'терпеть не могу', 'гнев', 'агрессия',
        'бесит', 'раздражает', 'злит', 'раздражение', 'злоба', 'ненависть',
    ],
    'fear': [
        'страх', 'тревога', 'беспокойство', 'боюсь', 'страшно', 'тревожно',
        'нервничаю', 'волнуюсь', 'паника', 'ужас', 'пугает', 'дрожь',
        'испуган', 'переживаю', 'опасаюсь', 'жутко', 'мурашки', 'фобия',
        'нервы', 'нервный', 'нервная', 'тревожный', 'тревожная', 'беспокой',
    ],
    'surprise': [
        'удивление', 'неожиданно', 'вау', 'невероятно', 'поразительно',
        'не ожидал', 'удивлён', 'удивительно', 'шок', 'ошеломлён',
        'неожиданность', 'внезапно', 'поразил', 'потрясён', 'офигел',
        'вообще', 'реально', 'серьёзно', 'правда', 'вот это да',
    ],
    'fatigue': [
        'устал', 'усталость', 'выгорание', 'сложный день', 'тяжело',
        'вымотан', 'нет сил', 'изматывает', 'без сил', 'истощён',
        'еле живой', 'упадок', 'разбит', 'обессилел', 'измотан', 'апатия',
        'лень', 'не хочется', 'нет желания', 'нет мотивации', 'упадок сил',
    ],
    'interest': [
        'интересно', 'любопытно', 'захватывает', 'увлекательно', 'интерес',
        'заинтересован', 'хочу узнать', 'изучаю', 'увлёкся', 'fascinated',
        'поглощён', 'вдохновляет', 'мотивирует', 'задумался', 'исследую',
        'интересный', 'интересная', 'интересное', 'крутой', 'крутая', 'крутое',
        'огонь', 'бомба', 'топ', 'зачёт', 'жесть', 'ого', 'wow',
    ],
    'pride': [
        'гордость', 'горжусь', 'достижение', 'справился', 'смог', 'победил',
        'успех', 'результат', 'вышло', 'получилось', 'сделал', 'достиг',
        'выполнил', 'преодолел', 'молодец', 'горжусь собой', 'сделала', 'достигла',
        'смогла', 'победила', 'справилась', 'рад за себя', 'рада за себя',
    ],
    'gratitude': [
        'благодарен', 'спасибо', 'признателен', 'ценю', 'дорожу',
        'повезло', 'счастлив иметь', 'рад что есть', 'благодарность',
        'признательность', 'тронут', 'растрогало', 'благодарю', 'благодарна',
        'ценю', 'ценить', 'дорожить', 'lucky', 'везёт',
    ],
}


@dataclass
class TextSegment:
    """Смысловой сегмент текста с метаданными"""
    text: str
    weight: float = 1.0          # Вес сегмента при агрегации
    is_contrast: bool = False     # Является ли переходным (после «но», «сейчас»)
    connector: str = ''           # Союз/слово, с которого начался переход


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
    segments_count: int = 1       # Сколько смысловых сегментов было найдено
    has_contrast: bool = False    # Есть ли контрастный переход в тексте


# ── Загрузка моделей ──────────────────────────────────────────────────────

def _load_models():
    global _emotion_tokenizer, _emotion_model, _kw_model
    global _segmenter, _morph, _ner_tagger, _names_extractor, _pymorphy
    global _models_loaded, _loading_error

    if _models_loaded:
        return
    if _loading_error is not None:
        raise RuntimeError(f"Модели не загружены: {_loading_error}")

    with _models_lock:
        if _models_loaded:
            return
        if _loading_error is not None:
            raise RuntimeError(f"Модели не загружены: {_loading_error}")

        try:
            rubert_path = os.path.join(MODELS_DIR, 'rubert-tiny2-base')
            minilm_path = os.path.join(MODELS_DIR, 'multilingual-minilm')

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

            _emotion_tokenizer = AutoTokenizer.from_pretrained(rubert_path)
            _emotion_model = AutoModelForSequenceClassification.from_pretrained(rubert_path)
            _emotion_model.eval()

            st = SentenceTransformer(minilm_path)
            _kw_model = KeyBERT(model=st)

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


# ── Сегментация текста ────────────────────────────────────────────────────

def _split_into_segments_safe(text: str) -> List[TextSegment]:
    """
    Безопасная сегментация текста с защитой от ReDoS.
    Если сегментация занимает больше MAX_SEGMENTATION_TIME — 
    возвращает весь текст как один сегмент.
    """
    if not text:
        return [TextSegment(text='', weight=1.0)]
    
    start_time = time.time()
    
    try:
        # Используем простой сплит по предложениям вместо сложных регулярок
        # Это защищает от ReDoS на длинных текстах без знаков препинания
        normalized = text.strip()
        
        # Простая сегментация по знакам препинания и переводам строк
        # Ограничиваем длину текста для безопасности
        if len(normalized) > 5000:
            normalized = normalized[:5000]
            logger.warning(f"Текст обрезан до 5000 символов для безопасной сегментации")
        
        # Разбиваем на предложения
        sentences = []
        current = []
        
        for char in normalized:
            current.append(char)
            # Проверяем таймаут каждые 100 символов
            if len(current) % 100 == 0:
                if time.time() - start_time > MAX_SEGMENTATION_TIME:
                    logger.warning("Таймаут сегментации — возвращаем текст как один сегмент")
                    return [TextSegment(text=normalized[:1000], weight=1.0)]
            
            if char in '.!?\n':
                sentence = ''.join(current).strip()
                if sentence:
                    sentences.append(sentence)
                current = []
        
        # Последнее предложение
        if current:
            sentence = ''.join(current).strip()
            if sentence:
                sentences.append(sentence)
        
        if not sentences:
            return [TextSegment(text=normalized, weight=1.0)]
        
        # Группируем предложения в сегменты по коннекторам
        segments = []
        current_parts = []
        base_weight = 1.0
        current_connector = ''
        
        for i, sentence in enumerate(sentences):
            # Проверяем таймаут для каждого предложения
            if time.time() - start_time > MAX_SEGMENTATION_TIME:
                logger.warning("Таймаут при группировке сегментов")
                break
            
            sentence_lower = sentence.lower()
            
            # Ищем коннекторы только в начале предложения (быстрее)
            found_connector = None
            found_weight = 1.0
            
            for connector, weight in CONTRAST_CONNECTORS.items():
                if sentence_lower.startswith(connector) or \
                   sentence_lower.startswith(connector + ',') or \
                   sentence_lower.startswith(connector + ' '):
                    found_connector = connector
                    found_weight = weight
                    break
            
            if found_connector and current_parts:
                segments.append(TextSegment(
                    text=' '.join(current_parts),
                    weight=base_weight,
                    is_contrast=(i > 0),
                    connector=current_connector
                ))
                current_parts = [sentence]
                base_weight = found_weight
                current_connector = found_connector
            else:
                current_parts.append(sentence)
        
        # Последний сегмент
        if current_parts:
            segments.append(TextSegment(
                text=' '.join(current_parts),
                weight=base_weight,
                is_contrast=(len(segments) > 0),
                connector=current_connector
            ))
        
        if not segments:
            return [TextSegment(text=normalized[:1000], weight=1.0)]
        
        # Применяем временное взвешивание
        if len(segments) > 1:
            n = len(segments)
            for i, seg in enumerate(segments):
                positional_boost = 1.0 + (i / (n - 1)) * 0.5
                seg.weight *= positional_boost
        
        logger.debug(f"Сегментация завершена за {time.time() - start_time:.3f}с: {len(segments)} сегментов")
        return segments
    
    except Exception as e:
        logger.error(f"Ошибка сегментации: {e}")
        return [TextSegment(text=text[:500], weight=1.0)]


# ── Анализ тональности сегмента ──────────────────────────────────────────

def _analyze_segment_sentiment(text: str) -> Tuple[str, float]:
    """
    Анализирует тональность одного сегмента текста.
    Использует нейросеть эмоций как основу, лексикон как дополнение.
    """
    if not text or len(text.strip()) < 3:
        return 'neutral', 0.5
    
    try:
        analyzer = get_emotion_analyzer()
        if isinstance(analyzer, NeuralEmotionAnalyzer):
            scores = analyzer.get_scores_ru(text)
            
            # Считаем позитивный и негативный суммарный скор
            positive_emotions = {'радость', 'энтузиазм', 'гордость', 'благодарность'}
            negative_emotions = {'грусть', 'гнев', 'страх', 'отвращение', 'раздражение'}
            
            pos_score = sum(scores.get(e, 0) for e in positive_emotions)
            neg_score = sum(scores.get(e, 0) for e in negative_emotions)
            
            # Добавляем лексиконный анализ для усиления
            lexicon_boost = _lexicon_sentiment_boost(text)
            pos_score += lexicon_boost.get('positive', 0)
            neg_score += lexicon_boost.get('negative', 0)
            
            total = pos_score + neg_score
            if total < 0.1:
                return 'neutral', 0.5
            
            if pos_score > neg_score * 1.3:
                return 'positive', min(1.0, pos_score / max(total, 0.01))
            elif neg_score > pos_score * 1.3:
                return 'negative', min(1.0, neg_score / max(total, 0.01))
            else:
                return 'neutral', 0.5
    except Exception as e:
        print(f"[NLP] Ошибка нейросетевого анализа сегмента: {e}")
    
    # Фаллбек — лексиконный анализ
    return _fallback_lexicon_sentiment(text)


def _lexicon_sentiment_boost(text: str) -> Dict[str, float]:
    """Лексиконный буст для поддержки нейросети"""
    text_lower = text.lower()
    words = text_lower.split()
    
    pos_boost = 0.0
    neg_boost = 0.0
    
    positive_words = set(EMOTION_LEXICON.get('joy', []) + 
                        EMOTION_LEXICON.get('pride', []) +
                        EMOTION_LEXICON.get('gratitude', []))
    negative_words = set(EMOTION_LEXICON.get('sadness', []) +
                        EMOTION_LEXICON.get('anger', []) +
                        EMOTION_LEXICON.get('fear', []) +
                        EMOTION_LEXICON.get('fatigue', []))
    
    for i, word in enumerate(words):
        # Проверяем негаторы перед словом
        negated = False
        if i > 0 and words[i-1] in NEGATORS:
            negated = True
        
        # Интенсификатор
        intensity = 1.0
        if i > 0 and words[i-1] in INTENSIFIERS:
            intensity = INTENSIFIERS[words[i-1]]
        
        if word in positive_words:
            if negated:
                neg_boost += 0.15 * intensity
            else:
                pos_boost += 0.15 * intensity
        elif word in negative_words:
            if negated:
                pos_boost += 0.1 * intensity
            else:
                neg_boost += 0.15 * intensity
    
    return {'positive': pos_boost, 'negative': neg_boost}


def _fallback_lexicon_sentiment(text: str) -> Tuple[str, float]:
    """Резервный лексиконный анализ тональности"""
    boost = _lexicon_sentiment_boost(text)
    pos = boost.get('positive', 0)
    neg = boost.get('negative', 0)
    
    if pos > neg * 1.2:
        return 'positive', min(0.8, pos)
    elif neg > pos * 1.2:
        return 'negative', min(0.8, neg)
    return 'neutral', 0.5


# ── Основной анализ эмоций сегмента ──────────────────────────────────────

def _analyze_segment_emotions(text: str) -> Dict[str, float]:
    """Анализ эмоций одного сегмента"""
    try:
        neural_scores = detect_emotions_neural(text)
        mapped = map_neural_to_legacy_emotions(neural_scores)
    except Exception:
        mapped = {}
    
    # Усиливаем лексиконом
    lexicon_boost = _lexicon_emotion_boost(text)
    
    result = dict(mapped)
    for emotion, boost in lexicon_boost.items():
        result[emotion] = result.get(emotion, 0) + boost
    
    # Нормализуем
    total = sum(result.values()) or 1.0
    result = {k: v / total for k, v in result.items()}
    
    # Фильтруем числовые значения
    result = {k: v for k, v in result.items() 
              if isinstance(v, (int, float)) and not k.startswith('_')}
    
    return dict(sorted(result.items(), key=lambda x: -x[1])[:8])


def _lexicon_emotion_boost(text: str) -> Dict[str, float]:
    """Лексиконный буст для эмоций"""
    text_lower = text.lower()
    words = text_lower.split()
    boosts: Dict[str, float] = {}
    
    for i, word in enumerate(words):
        negated = i > 0 and words[i-1] in NEGATORS
        intensity = 1.0
        if i > 0 and words[i-1] in INTENSIFIERS:
            intensity = INTENSIFIERS[words[i-1]]
        
        for emotion, keywords in EMOTION_LEXICON.items():
            if word in keywords:
                if negated:
                    # При отрицании — противоположная эмоция
                    opposite = {'joy': 'sadness', 'sadness': 'joy',
                               'anger': 'neutral', 'fear': 'neutral'}.get(emotion, 'neutral')
                    boosts[opposite] = boosts.get(opposite, 0) + 0.08 * intensity
                else:
                    boosts[emotion] = boosts.get(emotion, 0) + 0.12 * intensity
    
    return boosts


# ── Агрегация сегментов ───────────────────────────────────────────────────

def _aggregate_segments(
    segments: List[TextSegment],
    sentiment_results: List[Tuple[str, float]],
    emotion_results: List[Dict[str, float]]
) -> Tuple[str, float, Dict[str, float]]:
    """
    Взвешенная агрегация результатов по всем сегментам.
    
    Логика: сегменты после контрастных коннекторов («но», «сейчас») 
    имеют больший вес, потому что они отражают ТЕКУЩЕЕ состояние.
    """
    if not segments:
        return 'neutral', 0.5, {'neutral': 1.0}
    
    total_weight = sum(s.weight for s in segments)
    
    # Взвешенная тональность
    pos_weight = sum(
        seg.weight for seg, (sent, _) in zip(segments, sentiment_results) 
        if sent == 'positive'
    )
    neg_weight = sum(
        seg.weight for seg, (sent, _) in zip(segments, sentiment_results) 
        if sent == 'negative'
    )
    neu_weight = sum(
        seg.weight for seg, (sent, _) in zip(segments, sentiment_results) 
        if sent == 'neutral'
    )
    
    # Определяем итоговую тональность
    if pos_weight > neg_weight and pos_weight > neu_weight:
        final_sentiment = 'positive'
        final_score = pos_weight / total_weight
    elif neg_weight > pos_weight and neg_weight > neu_weight:
        final_sentiment = 'negative'
        final_score = neg_weight / total_weight
    else:
        final_sentiment = 'neutral'
        final_score = 0.5
    
    # Взвешенные эмоции
    aggregated_emotions: Dict[str, float] = {}
    for seg, emotions in zip(segments, emotion_results):
        for emotion, score in emotions.items():
            aggregated_emotions[emotion] = aggregated_emotions.get(emotion, 0) + score * seg.weight
    
    # Нормализуем
    total_em = sum(aggregated_emotions.values()) or 1.0
    aggregated_emotions = {k: v / total_em for k, v in aggregated_emotions.items()}
    
    return final_sentiment, final_score, aggregated_emotions


# ── Основная функция анализа ──────────────────────────────────────────────

def analyze_text(text: str) -> AnalysisResult:
    """
    Основная функция анализа с защитой от сбоев отдельных компонентов.
    Каждый шаг изолирован — если один компонент падает, остальные продолжают работу.
    """
    if not text or len(text.strip()) < 3:
        return AnalysisResult()

    result = AnalysisResult()
    
    # Пытаемся загрузить модели (если не загружены — работаем в ограниченном режиме)
    models_available = True
    try:
        _load_models()
    except RuntimeError as e:
        print(f"[NLP] Предупреждение: {e}")
        result.narrative = "NLP-модели не загружены. Запустите: python manage.py download_models"
        models_available = False

    clean = _clean_text(text)
    
    # ── 1. Сегментация (не зависит от моделей) ────────────────────────────
    try:
        segments = _split_into_segments_safe(clean)
    except Exception as e:
        print(f"[NLP] Ошибка сегментации: {e}")
        segments = [TextSegment(text=clean, weight=1.0)]
    
    result.segments_count = len(segments)
    result.has_contrast = any(s.is_contrast for s in segments)
    
    # ── 2. Анализ тональности и эмоций (каждый сегмент изолирован) ────────
    sentiment_results = []
    emotion_results = []
    
    for seg in segments:
        if not seg.text.strip():
            sentiment_results.append(('neutral', 0.5))
            emotion_results.append({'neutral': 1.0})
            continue
        
        # Анализ тональности с fallback
        try:
            sent, score = _analyze_segment_sentiment(seg.text)
        except Exception as e:
            print(f"[NLP] Ошибка анализа тональности: {e}")
            sent, score = 'neutral', 0.5
        
        # Анализ эмоций с fallback
        try:
            emotions = _analyze_segment_emotions(seg.text)
        except Exception as e:
            print(f"[NLP] Ошибка анализа эмоций: {e}")
            emotions = {'neutral': 1.0}
        
        sentiment_results.append((sent, score))
        emotion_results.append(emotions)
    
    # ── 3. Агрегация (чистая математика, не падает) ───────────────────────
    try:
        final_sentiment, final_score, final_emotions = _aggregate_segments(
            segments, sentiment_results, emotion_results
        )
    except Exception as e:
        print(f"[NLP] Ошибка агрегации: {e}")
        final_sentiment, final_score = 'neutral', 0.5
        final_emotions = {'neutral': 1.0}
    
    result.sentiment = final_sentiment
    result.sentiment_score = final_score
    result.emotions = final_emotions
    result.dominant_emotion = max(final_emotions, key=final_emotions.get) if final_emotions else 'neutral'
    
    # ── 4. Ключевые слова (с fallback) ────────────────────────────────────
    if models_available:
        try:
            result.keywords = _extract_keywords(clean)
        except Exception as e:
            print(f"[NLP] Ошибка извлечения ключевых слов: {e}")
            result.keywords = []
    else:
        result.keywords = []
    
    # ── 5. NER (может отказать независимо) ────────────────────────────────
    if models_available:
        try:
            result.entities = _extract_entities(clean)
        except Exception as e:
            print(f"[NLP] Ошибка извлечения сущностей: {e}")
            result.entities = {}
    else:
        result.entities = {}
    
    # ── 6. Темы (на основе keywords, работает даже если NER упал) ─────────
    try:
        result.topics = _build_topics(result.keywords, result.entities)
    except Exception as e:
        print(f"[NLP] Ошибка построения тем: {e}")
        result.topics = result.keywords[:5] if result.keywords else []
    
    # ── 7. Статистика текста ──────────────────────────────────────────────
    try:
        words = clean.split()
        sentences_list = [s.strip() for s in re.split(r'[.!?]+', clean) if s.strip()]
        result.text_stats = {
            'word_count': len(words),
            'char_count': len(clean),
            'sentence_count': len(sentences_list),
            'avg_sentence_length': len(words) / max(len(sentences_list), 1),
            'segments_count': len(segments),
            'has_contrast': result.has_contrast,
            'models_available': models_available,
        }
    except Exception as e:
        print(f"[NLP] Ошибка статистики: {e}")
        result.text_stats = {'word_count': len(clean.split()), 'error': str(e)}
    
    # ── 8. Нарратив ──────────────────────────────────────────────────────
    try:
        result.narrative = _generate_narrative(
            text=clean,
            sentiment=result.sentiment,
            sentiment_score=result.sentiment_score,
            emotions=result.emotions,
            dominant_emotion=result.dominant_emotion,
            keywords=result.keywords,
            entities=result.entities,
            text_stats=result.text_stats,
            segments=segments,
            sentiment_results=sentiment_results,
        )
    except Exception as e:
        print(f"[NLP] Ошибка генерации нарратива: {e}")
        result.narrative = f"Заметка проанализирована. Основная эмоция: {result.dominant_emotion}."
    
    return result

# ── Извлечение ключевых слов ──────────────────────────────────────────────

def _extract_keywords(text: str) -> List[str]:
    """Извлекает ключевые слова с фильтрацией стоп-слов"""
    if len(text.split()) < 3:
        return []
    try:
        kws = _kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words=list(RUSSIAN_STOP_WORDS),
            top_n=15,
            use_mmr=True,
            diversity=0.7,
        )
        result = []
        for kw, score in kws:
            if score > 0.18:
                lemma = _lemmatize_phrase(kw)
                # Фильтруем стоп-слова после лемматизации
                if (lemma and len(lemma) > 2 and 
                    lemma not in RUSSIAN_STOP_WORDS and
                    not all(w in RUSSIAN_STOP_WORDS for w in lemma.split())):
                    result.append(lemma)
        return result[:7]
    except Exception:
        return []


def _lemmatize_phrase(phrase: str) -> str:
    words = phrase.split()
    lemmas = []
    for word in words:
        if word in RUSSIAN_STOP_WORDS:
            continue
        parsed = _pymorphy.parse(word)
        if parsed:
            lemma = parsed[0].normal_form
            if lemma not in RUSSIAN_STOP_WORDS and len(lemma) > 2:
                lemmas.append(lemma)
    return ' '.join(lemmas)


# ── NER ───────────────────────────────────────────────────────────────────

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
        if t_norm not in seen and len(t_norm) > 2 and t_norm not in RUSSIAN_STOP_WORDS:
            seen.add(t_norm)
            result.append(t)
    return result[:10]


# ── Очистка текста ────────────────────────────────────────────────────────

def _clean_text(text: str) -> str:
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    text = re.sub(r'\*+|_+|`+|#{1,6}\s', '', text)
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:3000]  # Увеличили лимит для лучшего контекста


# ── Генерация нарратива ───────────────────────────────────────────────────

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


def _generate_narrative(
    text: str,
    sentiment: str,
    sentiment_score: float,
    emotions: Dict[str, float],
    dominant_emotion: str,
    keywords: List[str],
    entities: Dict[str, List[str]],
    text_stats: Dict,
    segments: List[TextSegment] = None,
    sentiment_results: List[Tuple[str, float]] = None,
) -> str:
    """Генерирует связный нарратив с учётом контрастных переходов"""
    word_count = text_stats.get('word_count', 0)
    has_contrast = text_stats.get('has_contrast', False)

    if word_count < 5:
        return "Короткая заметка без выраженного контекста."

    emotion_name = EMOTION_NAMES_RU.get(dominant_emotion, 'нейтральное')
    emoji = EMOTION_EMOJI_MAP.get(dominant_emotion, '')

    # Учитываем контрастный переход в нарративе
    if has_contrast and segments and sentiment_results and len(segments) > 1:
        first_sent = sentiment_results[0][0] if sentiment_results else 'neutral'
        last_sent = sentiment_results[-1][0] if sentiment_results else 'neutral'
        
        if first_sent == 'negative' and last_sent == 'positive':
            intro = "Запись отражает эмоциональный переход: начинаясь на тяжёлой ноте, она завершается на позитиве."
        elif first_sent == 'positive' and last_sent == 'negative':
            intro = "Запись начинается хорошо, но затем тональность меняется на более сложную."
        elif first_sent != last_sent:
            intro = "В тексте прослеживается смена эмоционального фона."
        else:
            intro = _default_intro(sentiment)
    else:
        intro = _default_intro(sentiment)

    parts = [intro]

    # Доминирующая эмоция
    if dominant_emotion != 'neutral' and emotions:
        top_score = emotions.get(dominant_emotion, 0)
        intensity_word = (
            'явно ощущается' if top_score > 0.5 else
            'прослеживается' if top_score > 0.25 else
            'слегка заметна'
        )
        parts.append(f"В итоге {intensity_word} {emotion_name} {emoji}.")

    # Вторичные эмоции
    secondary = [(e, s) for e, s in emotions.items() if e != dominant_emotion and s > 0.15]
    if secondary:
        names = [EMOTION_NAMES_RU.get(e, e) for e, _ in secondary[:2]]
        parts.append(f"Дополнительно присутствуют: {', '.join(names)}.")

    # Ключевые темы
    if keywords:
        kw_str = ', '.join(f'«{k}»' for k in keywords[:3])
        parts.append(f"Ключевые темы: {kw_str}.")

    # Упомянутые люди и организации
    persons = entities.get('PER', [])
    orgs = entities.get('ORG', [])
    if persons:
        parts.append(f"Упомянуты: {', '.join(persons[:2])}.")
    if orgs:
        parts.append(f"Фигурируют: {', '.join(orgs[:2])}.")

    # Инсайт
    insights = {
        'fatigue': "Возможно, стоит замедлиться и дать себе отдых.",
        'joy': "Это состояние стоит запомнить — что именно его вызвало?",
        'anger': "Что стоит за раздражением — неоправданные ожидания или нарушенные границы?",
        'fear': "Страх часто указывает на что-то важное. О чём беспокоит эта ситуация?",
        'interest': "Любопытство — хороший сигнал. Куда ведёт этот интерес?",
        'sadness': "Грусть — тоже часть опыта. Что эта запись говорит о потребностях?",
        'pride': "Достижение зафиксировано. Важно признавать собственные успехи.",
        'gratitude': "Благодарность в тексте — редкое и ценное качество.",
    }
    if dominant_emotion in insights and word_count > 15:
        parts.append(insights[dominant_emotion])

    return ' '.join(parts)


def _default_intro(sentiment: str) -> str:
    """Стандартное вступление по тональности"""
    import random
    phrases = {
        'positive': [
            "Запись написана в позитивном ключе.",
            "Текст пронизан положительным настроем.",
            "Запись отражает хорошее расположение духа.",
        ],
        'negative': [
            "Запись несёт напряжённый эмоциональный фон.",
            "Текст написан в трудный момент.",
            "Запись отражает непростой период.",
        ],
        'neutral': [
            "Запись написана спокойно и взвешенно.",
            "Текст носит фактический характер.",
            "Запись отличается нейтральным тоном.",
        ],
    }
    options = phrases.get(sentiment, phrases['neutral'])
    random.seed(len(sentiment))
    return random.choice(options)


# ── Генерация сводки дня ──────────────────────────────────────────────────

def generate_day_narrative(
    day_analyses: List[dict],
    date_str: str,
    total_words: int,
) -> str:
    """
    Генерирует нарратив для сводки дня.
    Учитывает временную динамику в течение дня.
    """
    if not day_analyses:
        return "За этот день записей не найдено."

    sentiments = [a.get('sentiment', 'neutral') for a in day_analyses]
    all_emotions: Dict[str, float] = {}
    all_topics: List[str] = []
    
    for a in day_analyses:
        for em, score in a.get('emotions', {}).items():
            all_emotions[em] = all_emotions.get(em, 0) + score
        all_topics.extend(a.get('topics', [])[:3])

    note_count = len(day_analyses)
    if note_count > 0:
        all_emotions = {k: v / note_count for k, v in all_emotions.items()}

    pos = sentiments.count('positive')
    neg = sentiments.count('negative')
    neu = sentiments.count('neutral')

    # Анализируем динамику дня: менялось ли настроение?
    has_mood_shift = len(set(sentiments)) > 1
    first_mood = sentiments[0] if sentiments else 'neutral'
    last_mood = sentiments[-1] if sentiments else 'neutral'
    
    if pos > neg and pos > neu:
        day_tone = 'positive'
    elif neg > pos and neg > neu:
        day_tone = 'negative'
    else:
        day_tone = 'neutral'

    dominant_emotion = max(all_emotions, key=all_emotions.get) if all_emotions else 'neutral'
    top_emotions = sorted(all_emotions.items(), key=lambda x: -x[1])[:3]

    seen = set()
    unique_topics = []
    for t in all_topics:
        if t.lower() not in seen and len(t) > 2 and t.lower() not in RUSSIAN_STOP_WORDS:
            seen.add(t.lower())
            unique_topics.append(t)
    unique_topics = unique_topics[:5]

    parts = []
    
    # Учитываем смену настроения в течение дня
    if has_mood_shift and first_mood != last_mood:
        if first_mood == 'negative' and last_mood == 'positive':
            parts.append(f"День начался трудно, но завершился на позитивной ноте. {note_count} записей, {total_words} слов.")
        elif first_mood == 'positive' and last_mood == 'negative':
            parts.append(f"День начался хорошо, но к концу тональность изменилась. {note_count} записей.")
        else:
            parts.append(_day_opening(day_tone, note_count, total_words))
    else:
        parts.append(_day_opening(day_tone, note_count, total_words))

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


def _day_opening(tone: str, note_count: int, total_words: int) -> str:
    notes_word = _pluralize(note_count, 'запись', 'записи', 'записей')
    import random
    
    if tone == 'positive':
        openings = [
            f"День получился светлым — {note_count} {notes_word}, {total_words} слов.",
            f"Судя по записям, этот день прошёл на позитивной ноте. {note_count} {notes_word}.",
        ]
    elif tone == 'negative':
        openings = [
            f"День выдался непростым — {note_count} {notes_word}, {total_words} слов переживаний.",
            f"По записям видно, что этот день дался нелегко. {note_count} {notes_word}.",
        ]
    else:
        openings = [
            f"Спокойный, размеренный день — {note_count} {notes_word}, {total_words} слов.",
            f"Обычный день с несколькими заметками: {note_count} {notes_word}.",
        ]

    random.seed(note_count + total_words)
    return random.choice(openings)


def _emotion_narrative(top_emotions, tone):
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
        return f"Доминирующая эмоция — {dominant_name} {emoji}, на фоне {secondary_names[0]}."
    return f"Доминирующая эмоция — {dominant_name} {emoji}, рядом присутствуют {' и '.join(secondary_names)}."


def _topic_narrative(topics, tone):
    if not topics:
        return ''
    if len(topics) == 1:
        return f"Главная тема дня — «{topics[0]}»."
    elif len(topics) == 2:
        return f"Основные темы дня: «{topics[0]}» и «{topics[1]}»."
    else:
        rest = ', '.join(f'«{t}»' for t in topics[1:3])
        return f"Центральная тема — «{topics[0]}», также встречаются {rest}."


def _day_closing(tone, top_emotions, topics):
    dominant_em = top_emotions[0][0] if top_emotions else 'neutral'
    emotion_closings = {
        'fatigue': "Усталость — сигнал: стоит позаботиться о восстановлении.",
        'pride': "Гордость за результат — заслуженное чувство.",
        'fear': "Тревога указывает на что-то важное. Попробуй разобрать её источник.",
        'anger': "Раздражение часто говорит о нарушенных границах или несбывшихся ожиданиях.",
        'interest': "Интерес — топливо для роста. Развивай то, что зажгло тебя сегодня.",
        'gratitude': "Благодарность — одна из самых мощных практик.",
    }
    if dominant_em in emotion_closings:
        return emotion_closings[dominant_em]
    
    import random
    closings = {
        'positive': ["Позитивная энергия этого дня — хорошая основа для движения вперёд."],
        'negative': ["Трудные дни тоже важны — они показывают, что нуждается во внимании."],
        'neutral': ["Ровные дни часто самые продуктивные на дистанции."],
    }
    random.seed(len(topics))
    return random.choice(closings.get(tone, closings['neutral']))


def _pluralize(n: int, form1: str, form2: str, form5: str) -> str:
    n = abs(n) % 100
    if 11 <= n <= 19:
        return form5
    n = n % 10
    if n == 1:
        return form1
    if 2 <= n <= 4:
        return form2
    return form5