# backend/lumina/notes/nlp/neural_emotion_analyzer.py
"""
Нейросетевой анализатор эмоций на основе ruBERT-tiny2.
Заменяет лексиконный подход (EMOTION_LEXICON) на настоящую нейросеть.
"""

import os
import threading
import torch
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import OrderedDict
import hashlib
from django.conf import settings
import gc
import time
import logging

from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from .multilingual_analyzer import (
    EnglishEmotionAnalyzer,
    detect_emotions_multilingual,
    detect_language,
)

MODELS_DIR = os.path.join(settings.BASE_DIR, 'nlp_models')
logger = logging.getLogger('lumina.nlp')

# ============================================================
# НАСТРОЙКА МОДЕЛЕЙ
# ============================================================

# Вариант 1: Aniemore (7 эмоций) — самый точный для базовых эмоций
# Вариант 2: Seara (28 эмоций) — максимально детальный
# Вариант 3: CEDR (6 эмоций) — хороший баланс

EMOTION_MODEL_CONFIG = {
    # Рекомендую начать с этого — отличное качество, простой
    'aniemore': {
        'name': 'Aniemore/rubert-tiny2-russian-emotion-detection',
        'num_labels': 7,
        'labels': ['neutral', 'happiness', 'sadness', 'enthusiasm', 'fear', 'anger', 'disgust'],
        'labels_ru': ['нейтрально', 'радость', 'грусть', 'энтузиазм', 'страх', 'гнев', 'отвращение'],
        'emojis': ['😐', '😊', '😔', '🤩', '😨', '😠', '🤢']
    },
    # Расширенная версия — имеет смычку с твоим EMOTION_LEXICON
    'seara': {
        'name': 'seara/rubert-tiny2-russian-emotion-detection-ru-go-emotions',
        'num_labels': 28,
        'labels': [
            'admiration', 'amusement', 'anger', 'annoyance', 'approval', 'caring',
            'confusion', 'curiosity', 'desire', 'disappointment', 'disapproval',
            'disgust', 'embarrassment', 'excitement', 'fear', 'gratitude', 'grief',
            'joy', 'love', 'nervousness', 'optimism', 'pride', 'realization',
            'relief', 'remorse', 'sadness', 'surprise', 'neutral'
        ],
        'labels_ru': [
            'восхищение', 'веселье', 'злость', 'раздражение', 'одобрение', 'забота',
            'непонимание', 'любопытство', 'желание', 'разочарование', 'неодобрение',
            'отвращение', 'смущение', 'возбуждение', 'страх', 'благодарность', 'горе',
            'радость', 'любовь', 'нервозность', 'оптимизм', 'гордость', 'осознание',
            'облегчение', 'раскаяние', 'грусть', 'удивление', 'нейтрально'
        ],
        'emojis': ['👏', '😄', '😠', '😤', '👍', '🤗', '🤔', '🤨', '💭', '😞', '👎',
                   '🤢', '😳', '🤩', '😨', '🙏', '😢', '😊', '❤️', '😰', '🌟', '🦁',
                   '💡', '😌', '😔', '😢', '😲', '😐']
    },
    # Самый лёгкий и быстрый вариант
    'cedr': {
        'name': 'cointegrated/rubert-tiny2-cedr-emotion-detection',
        'num_labels': 6,
        'labels': ['joy', 'sadness', 'surprise', 'fear', 'anger', 'no_emotion'],
        'labels_ru': ['радость', 'грусть', 'удивление', 'страх', 'гнев', 'без эмоций'],
        'emojis': ['😊', '😔', '😲', '😨', '😠', '😐']
    }
}

# Выбери модель (по умолчанию aniemore)
DEFAULT_MODEL_KEY = 'aniemore'

class NeuralEmotionAnalyzer:
    """
    Нейросетевой анализатор эмоций с защитой от утечек памяти.
    
    Улучшения:
    - TTL для кэша (1 час)
    - Автоматическая очистка кэша каждые 100 запросов
    - Явная очистка GPU кэша PyTorch
    - Метрики использования
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.model_key = DEFAULT_MODEL_KEY
        self.config = EMOTION_MODEL_CONFIG[self.model_key]
        self.model_name = self.config['name']
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.tokenizer = None
        self.model = None
        
        # Кэш с TTL
        self._cache = OrderedDict()
        self._cache_timestamps = {}
        self._cache_max_size = 1000
        self._cache_ttl = 3600  # 1 час
        
        # Счетчики для периодической очистки
        self._request_count = 0
        self._cache_hits = 0
        self._cache_misses = 0
        self._last_cleanup_time = time.time()
        self._cleanup_interval = 300  # очистка каждые 5 минут
        
        self._load_model()
        self._initialized = True
    
    def _load_model(self):
        """Загружает модель с HuggingFace или из локальной папки"""
        model_path = os.path.join(MODELS_DIR, "aniemore-emotions")
        
        try:
            if os.path.exists(model_path):
                logger.info(f"Загрузка модели эмоций из {model_path}")
                self.tokenizer = AutoTokenizer.from_pretrained(model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            else:
                logger.info(f"Загрузка модели эмоций {self.model_name} из сети...")
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            
            self.model.to(self.device)
            self.model.eval()
            
            # Очищаем кэш PyTorch после загрузки
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info(f"Модель эмоций загружена на {self.device}")
        except Exception as e:
            logger.error(f"Ошибка загрузки модели эмоций: {e}")
            raise
    
    def _get_cache_key(self, text: str) -> str:
        """Генерирует ключ кэша (SHA256 вместо MD5)"""
        return hashlib.sha256(text[:500].encode()).hexdigest()
    
    def predict(self, text: str) -> Dict[str, float]:
        """
        Предсказывает эмоции с кэшированием и TTL.
        """
        if not text or len(text.strip()) < 3:
            return {'neutral': 1.0}
        
        self._request_count += 1
        
        # Периодическая очистка кэша
        self._maybe_cleanup_cache()
        
        # Проверяем кэш
        cache_key = self._get_cache_key(text)
        if cache_key in self._cache:
            timestamp = self._cache_timestamps.get(cache_key, 0)
            if time.time() - timestamp < self._cache_ttl:
                # Перемещаем в конец (LRU)
                value = self._cache.pop(cache_key)
                self._cache[cache_key] = value
                self._cache_hits += 1
                return value
            else:
                # TTL истек — удаляем
                del self._cache[cache_key]
                del self._cache_timestamps[cache_key]
        
        self._cache_misses += 1
        
        # Токенизация с ограничением длины
        try:
            inputs = self.tokenizer(
                text[:1000],  # Ограничиваем длину текста для токенизации
                return_tensors='pt',
                truncation=True,
                max_length=512,
                padding=True
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
        except Exception as e:
            logger.error(f"Ошибка токенизации: {e}")
            return {'neutral': 1.0}
        
        # Инференс
        try:
            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=1)
        except Exception as e:
            logger.error(f"Ошибка инференса: {e}")
            return {'neutral': 1.0}
        
        # Формируем результат
        scores = {
            label: float(probs[0][i])
            for i, label in enumerate(self.config['labels'])
        }
        scores = dict(sorted(scores.items(), key=lambda x: -x[1]))
        
        # Кэшируем
        self._cache[cache_key] = scores
        self._cache_timestamps[cache_key] = time.time()
        
        # Ограничиваем размер кэша
        while len(self._cache) > self._cache_max_size:
            # Удаляем самые старые записи
            oldest_key = next(iter(self._cache))
            del self._cache[oldest_key]
            self._cache_timestamps.pop(oldest_key, None)
        
        return scores
    
    def _maybe_cleanup_cache(self):
        """Периодическая очистка кэша и GPU памяти"""
        now = time.time()
        
        # Очистка каждые 5 минут или каждые 500 запросов
        if (now - self._last_cleanup_time > self._cleanup_interval or 
            self._request_count % 500 == 0):
            
            # Удаляем просроченные записи кэша
            expired_keys = [
                k for k, ts in self._cache_timestamps.items()
                if now - ts > self._cache_ttl
            ]
            for k in expired_keys:
                self._cache.pop(k, None)
                self._cache_timestamps.pop(k, None)
            
            if expired_keys:
                logger.debug(f"Очищено {len(expired_keys)} просроченных записей кэша эмоций")
            
            # Очищаем кэш PyTorch GPU
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            # Логируем статистику кэша
            total_requests = self._cache_hits + self._cache_misses
            if total_requests > 0:
                hit_rate = self._cache_hits / total_requests * 100
                logger.debug(
                    f"Статистика кэша эмоций: "
                    f"размер={len(self._cache)}/{self._cache_max_size}, "
                    f"hit_rate={hit_rate:.1f}%"
                )
            
            self._last_cleanup_time = now
            self._cache_hits = 0
            self._cache_misses = 0
    
    def get_metrics(self) -> dict:
        """Возвращает метрики использования"""
        return {
            'cache_size': len(self._cache),
            'cache_max_size': self._cache_max_size,
            'cache_ttl': self._cache_ttl,
            'device': str(self.device),
            'model_name': self.model_name,
            'total_requests': self._request_count,
        }
    
    def unload_model(self):
        """Явная выгрузка модели из памяти"""
        logger.info("Выгрузка модели эмоций из памяти")
        self.model = None
        self.tokenizer = None
        self._cache.clear()
        self._cache_timestamps.clear()
        
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    
    def predict_batch(self, texts: List[str]) -> List[Dict[str, float]]:
        """Пакетное предсказание для нескольких текстов"""
        if not texts:
            return []
        return [self.predict(text) for text in texts]
    
    def get_dominant_emotion(self, text: str) -> Tuple[str, float]:
        """Возвращает доминирующую эмоцию и её score"""
        scores = self.predict(text)
        dominant = max(scores.items(), key=lambda x: x[1])
        return dominant[0], dominant[1]
    
    def get_dominant_emotion_ru(self, text: str) -> Tuple[str, float, str]:
        """Возвращает (русское_название, score, emoji)"""
        eng_label, score = self.get_dominant_emotion(text)
        
        label_to_ru = {}
        for i, eng in enumerate(self.config['labels']):
            if i < len(self.config['labels_ru']):
                label_to_ru[eng] = self.config['labels_ru'][i]
            else:
                label_to_ru[eng] = eng
        
        ru_label = label_to_ru.get(eng_label, eng_label)
        
        emoji = '😐'
        for i, eng in enumerate(self.config['labels']):
            if eng == eng_label and i < len(self.config['emojis']):
                emoji = self.config['emojis'][i]
                break
        
        return ru_label, score, emoji
    
    def get_scores_ru(self, text: str) -> Dict[str, float]:
        """Возвращает эмоции с русскими названиями"""
        eng_scores = self.predict(text)
        
        label_to_ru = {}
        for i, eng in enumerate(self.config['labels']):
            if i < len(self.config['labels_ru']):
                label_to_ru[eng] = self.config['labels_ru'][i]
            else:
                label_to_ru[eng] = eng
        
        return {label_to_ru[eng]: score for eng, score in eng_scores.items()}

# ============================================================
# ФАЛЛБЕК: лексиконный анализатор (если нейросеть не доступна)
# ============================================================

# Базовый словарь эмоций для fallback
FALLBACK_EMOTION_LEXICON = {
    'радость': ['радость', 'счастье', 'восторг', 'отлично', 'классно', 'круто', 'огонь', 'хорошо', 'прекрасно'],
    'грусть': ['грусть', 'печаль', 'тоска', 'расстроен', 'грустно', 'жаль'],
    'злость': ['злость', 'ярость', 'бешенство', 'раздражение', 'бесит', 'достало'],
    'страх': ['страх', 'тревога', 'боюсь', 'страшно', 'тревожно', 'нервничаю'],
    'удивление': ['удивление', 'неожиданно', 'вау', 'поразительно'],
    'усталость': ['устал', 'усталость', 'выгорание', 'тяжело', 'вымотан'],
    'интерес': ['интересно', 'любопытно', 'захватывает', 'увлекательно'],
    'спокойствие': ['нормально', 'спокойно', 'ровно', 'уютно', 'хорошее']
}


class LexiconEmotionAnalyzer:
    """Фаллбек-анализатор на основе словаря (если нейросеть недоступна)"""
    
    def predict(self, text: str) -> Dict[str, float]:
        text_lower = text.lower()
        scores = {}
        
        for emotion, keywords in FALLBACK_EMOTION_LEXICON.items():
            hits = 0
            for kw in keywords:
                if kw in text_lower:
                    hits += 1
            if hits > 0:
                scores[emotion] = min(1.0, hits * 0.2)
        
        if not scores:
            scores['нейтрально'] = 0.8
        
        return scores
    
    def get_dominant_emotion(self, text: str) -> Tuple[str, float]:
        scores = self.predict(text)
        dominant = max(scores.items(), key=lambda x: x[1])
        return dominant[0], dominant[1]


# ============================================================
# ЕДИНЫЙ ИНТЕРФЕЙС
# ============================================================

_neural_analyzer = None
_english_analyzer = None
_lexicon_analyzer = LexiconEmotionAnalyzer()
_use_neural = True


def get_emotion_analyzer():
    """Возвращает доступный анализатор эмоций"""
    global _neural_analyzer, _use_neural
    
    if _use_neural:
        try:
            if _neural_analyzer is None:
                _neural_analyzer = NeuralEmotionAnalyzer()
            # Проверяем, что модель действительно загружена
            if _neural_analyzer.model is not None:
                return _neural_analyzer
            else:
                _use_neural = False
        except Exception as e:
            print(f"[EmotionAnalyzer] Нейросеть недоступна: {e}. Использую лексикон.")
            _use_neural = False
    
    return _lexicon_analyzer


def get_english_emotion_analyzer():
    """Возвращает английский анализатор (или None при ошибке)."""
    global _english_analyzer
    if _english_analyzer is None:
        try:
            _english_analyzer = EnglishEmotionAnalyzer()
        except Exception as e:
            logger.warning(f"[EmotionAnalyzer] Английская модель недоступна: {e}")
            _english_analyzer = None
    return _english_analyzer


def detect_emotions_neural(text: str) -> Dict[str, float]:
    """
    Определяет эмоции с помощью нейросети.
    Возвращает словарь эмоция -> вероятность.
    """
    analyzer = get_emotion_analyzer()

    if isinstance(analyzer, NeuralEmotionAnalyzer):
        en_analyzer = get_english_emotion_analyzer()
        _, scores = detect_emotions_multilingual(text, analyzer, en_analyzer)
        return scores

    # Фаллбек на старый лексикон (русский)
    return analyzer.predict(text)


def get_dominant_emotion_neural(text: str) -> Tuple[str, float, str]:
    """
    Возвращает (название_эмоции, score, emoji)
    """
    analyzer = get_emotion_analyzer()

    if isinstance(analyzer, NeuralEmotionAnalyzer):
        lang = detect_language(text)
        if lang == "en":
            scores = detect_emotions_neural(text)
            if not scores:
                return "neutral", 1.0, "😐"
            dominant_emotion, score = max(scores.items(), key=lambda x: x[1])
            emoji_map = {
                "happiness": "😊",
                "love": "❤️",
                "sadness": "😔",
                "anger": "😠",
                "fear": "😨",
                "surprise": "😲",
                "neutral": "😐",
                "disgust": "🤢",
                "confusion": "🤔",
                "desire": "💭",
                "guilt": "😟",
                "sarcasm": "🙃",
                "shame": "😳",
            }
            return dominant_emotion, score, emoji_map.get(dominant_emotion, "😐")
        return analyzer.get_dominant_emotion_ru(text)

    emotion, score = analyzer.get_dominant_emotion(text)
    emoji_map = {
        'радость': '😊', 'грусть': '😔', 'злость': '😠', 'страх': '😨',
        'удивление': '😲', 'усталость': '😴', 'интерес': '🤔', 'спокойствие': '😐',
        'нейтрально': '😐'
    }
    return emotion, score, emoji_map.get(emotion, '😐')


# Для обратной совместимости с analyzer.py
def map_neural_to_legacy_emotions(neural_scores: Dict[str, float]) -> Dict[str, float]:
    """
    Маппит эмоции из нейросети в старый формат (joy, sadness, anger, etc.)
    """
    legacy = {}
    
    # Маппинг правил (можно расширять)
    mapping = {
        # Русские метки
        'радость': 'joy',
        'счастье': 'joy',
        'энтузиазм': 'joy',
        'грусть': 'sadness',
        'горе': 'sadness',
        'злость': 'anger',
        'гнев': 'anger',
        'раздражение': 'anger',
        'страх': 'fear',
        'тревога': 'fear',
        'удивление': 'surprise',
        'усталость': 'fatigue',
        'интерес': 'interest',
        'любопытство': 'interest',
        'гордость': 'pride',
        'благодарность': 'gratitude',
        'спокойствие': 'neutral',
        'нейтрально': 'neutral',
        # Английские метки (boltuix/emotions-dataset)
        'happiness': 'joy',
        'love': 'gratitude',
        'sadness': 'sadness',
        'anger': 'anger',
        'fear': 'fear',
        'surprise': 'surprise',
        'neutral': 'neutral',
        'desire': 'interest',
        'confusion': 'interest',
        'disgust': 'anger',
        'guilt': 'sadness',
        'shame': 'sadness',
        'sarcasm': 'anger',
    }
    
    for neural_emotion, score in neural_scores.items():
        legacy_emotion = mapping.get(neural_emotion)
        if legacy_emotion:
            if legacy_emotion not in legacy:
                legacy[legacy_emotion] = 0
            legacy[legacy_emotion] = max(legacy[legacy_emotion], score)
    
    # Нормализуем, чтобы сумма была ~1
    total = sum(legacy.values())
    if total > 0:
        legacy = {k: v / total for k, v in legacy.items()}
    
    if not legacy:
        legacy['neutral'] = 1.0
    
    return legacy


def get_emotion_debug_info(text: str) -> Dict[str, object]:
    """
    Отладочная информация по маршрутизации эмоций.
    Нужна для быстрого понимания, какая модель реально используется.
    """
    lang = detect_language(text)
    analyzer = get_emotion_analyzer()
    analyzer_type = type(analyzer).__name__

    english_model_path = os.path.join(MODELS_DIR, "english-emotions-boltuix")
    english_model_path_exists = os.path.exists(english_model_path)

    english_loaded = False
    english_error = None
    if lang == "en":
        try:
            en_analyzer = get_english_emotion_analyzer()
            english_loaded = bool(en_analyzer and en_analyzer.model is not None)
        except Exception as e:
            english_error = str(e)[:200]

    return {
        "detected_language": lang,
        "main_analyzer_type": analyzer_type,
        "english_model_path": english_model_path,
        "english_model_path_exists": english_model_path_exists,
        "english_model_loaded": english_loaded,
        "english_model_error": english_error,
    }