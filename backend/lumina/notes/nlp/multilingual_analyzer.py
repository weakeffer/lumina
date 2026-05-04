"""
Мультиязычный анализатор эмоций.

Задачи:
1. Определять язык текста (ru/en).
2. Для русского использовать существующий ruBERT-анализатор.
3. Для английского использовать отдельную дообученную модель.
"""

import gc
import hashlib
import logging
import os
import threading
import time
from collections import OrderedDict
from typing import Dict, Optional, Tuple

import torch
from django.conf import settings
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODELS_DIR = os.path.join(settings.BASE_DIR, "nlp_models")
logger = logging.getLogger("lumina.nlp")


class EnglishEmotionAnalyzer:
    """Анализатор эмоций для английского языка на базе fine-tuned модели."""

    MODEL_DIR_NAME = "english-emotions-boltuix"
    DEFAULT_BASE_MODEL = "distilbert-base-uncased"
    DEFAULT_LABELS = [
        "anger",
        "confusion",
        "desire",
        "disgust",
        "fear",
        "guilt",
        "happiness",
        "love",
        "neutral",
        "sadness",
        "sarcasm",
        "shame",
        "surprise",
    ]

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

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = os.path.join(MODELS_DIR, self.MODEL_DIR_NAME)

        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForSequenceClassification] = None
        self.labels = list(self.DEFAULT_LABELS)

        self._cache = OrderedDict()
        self._cache_timestamps = {}
        self._cache_max_size = 1000
        self._cache_ttl = 3600

        self._load_model()
        self._initialized = True

    def _load_model(self) -> None:
        """
        Загружает дообученную модель из nlp_models/english-emotions-boltuix.
        Если папки нет, загружает базовую модель как fallback.
        """
        try:
            if os.path.exists(self.model_path):
                logger.info("Загрузка английской модели эмоций из %s", self.model_path)
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
            else:
                logger.warning(
                    "Дообученная английская модель не найдена (%s). "
                    "Использую базовую модель %s как временный fallback.",
                    self.model_path,
                    self.DEFAULT_BASE_MODEL,
                )
                self.tokenizer = AutoTokenizer.from_pretrained(self.DEFAULT_BASE_MODEL)
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    self.DEFAULT_BASE_MODEL,
                    num_labels=len(self.labels),
                )

            if self.model.config.id2label:
                id2label = self.model.config.id2label
                self.labels = [id2label[i] for i in sorted(id2label.keys())]

            self.model.to(self.device)
            self.model.eval()

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception as exc:
            logger.error("Ошибка загрузки английской модели эмоций: %s", exc)
            raise

    @staticmethod
    def _cache_key(text: str) -> str:
        return hashlib.sha256(text[:500].encode("utf-8")).hexdigest()

    def predict(self, text: str) -> Dict[str, float]:
        """Возвращает вероятности эмоций для английского текста."""
        if not text or len(text.strip()) < 3:
            return {"neutral": 1.0}

        key = self._cache_key(text)
        now = time.time()
        if key in self._cache:
            ts = self._cache_timestamps.get(key, 0)
            if now - ts < self._cache_ttl:
                value = self._cache.pop(key)
                self._cache[key] = value
                return value
            self._cache.pop(key, None)
            self._cache_timestamps.pop(key, None)

        try:
            encoded = self.tokenizer(
                text[:1000],
                return_tensors="pt",
                truncation=True,
                max_length=256,
                padding=True,
            )
            encoded = {k: v.to(self.device) for k, v in encoded.items()}
        except Exception as exc:
            logger.error("Ошибка токенизации английского текста: %s", exc)
            return {"neutral": 1.0}

        try:
            with torch.no_grad():
                outputs = self.model(**encoded)
                probs = torch.softmax(outputs.logits, dim=1)[0]
        except Exception as exc:
            logger.error("Ошибка инференса английской модели: %s", exc)
            return {"neutral": 1.0}

        scores = {}
        for idx, label in enumerate(self.labels):
            if idx < len(probs):
                scores[label] = float(probs[idx])

        scores = dict(sorted(scores.items(), key=lambda kv: -kv[1]))
        self._cache[key] = scores
        self._cache_timestamps[key] = now

        while len(self._cache) > self._cache_max_size:
            oldest_key = next(iter(self._cache))
            self._cache.pop(oldest_key, None)
            self._cache_timestamps.pop(oldest_key, None)

        return scores

    def unload_model(self) -> None:
        """Явно освобождает память модели."""
        self.model = None
        self.tokenizer = None
        self._cache.clear()
        self._cache_timestamps.clear()
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


def detect_language(text: str) -> str:
    """
    Определяет язык текста: 'ru' или 'en'.
    Логика простая и быстрая: считаем долю кириллицы и латиницы.
    """
    if not text:
        return "ru"

    cyr = sum(1 for ch in text if "а" <= ch.lower() <= "я" or ch.lower() == "ё")
    lat = sum(1 for ch in text if "a" <= ch.lower() <= "z")

    if lat > cyr:
        return "en"
    return "ru"


def detect_emotions_multilingual(
    text: str,
    ru_analyzer,
    en_analyzer: Optional[EnglishEmotionAnalyzer] = None,
) -> Tuple[str, Dict[str, float]]:
    """
    Унифицированный вход:
    - Возвращает tuple: (язык, словарь эмоций).
    - Для ru возвращает русские названия эмоций (как и раньше).
    - Для en возвращает английские labels fine-tuned модели.
    """
    lang = detect_language(text)
    if lang == "en":
        analyzer = en_analyzer or EnglishEmotionAnalyzer()
        return "en", analyzer.predict(text)

    # Русский поток оставляем полностью прежним.
    return "ru", ru_analyzer.get_scores_ru(text)
