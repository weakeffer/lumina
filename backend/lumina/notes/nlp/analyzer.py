import os
import re
from typing import Dict, List, Optional
from dataclasses import dataclass, field

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from natasha import (
    Segmenter, MorphVocab, NewsEmbedding,
    NewsMorphTagger, NewsSyntaxParser, NewsNERTagger,
    NamesExtractor, Doc
)
import pymorphy3

from django.conf import settings

MODELS_DIR = os.path.join(settings.BASE_DIR, 'nlp_models')

_emotion_tokenizer = None
_emotion_model = None
_kw_model = None
_segmenter = None
_morph = None
_ner_tagger = None
_names_extractor = None
_pymorphy = None


def _load_models():
    global _emotion_tokenizer, _emotion_model, _kw_model
    global _segmenter, _morph, _ner_tagger, _names_extractor, _pymorphy

    if _emotion_model is not None:
        return  # уже загружено

    rubert_path = os.path.join(MODELS_DIR, 'rubert-tiny2')
    minilm_path = os.path.join(MODELS_DIR, 'multilingual-minilm')

    # Эмоциональная модель
    _emotion_tokenizer = AutoTokenizer.from_pretrained(rubert_path)
    _emotion_model = AutoModelForSequenceClassification.from_pretrained(rubert_path)
    _emotion_model.eval()

    # KeyBERT с многоязычным энкодером
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

    # Храним tagger-и для обработки документов
    _load_models._morph_tagger = morph_tagger


_load_models._morph_tagger = None

# ── Метки эмоций (rubert-tiny2 обучен на sentiment; мы дополним heuristics) ──
SENTIMENT_LABELS = {0: 'negative', 1: 'neutral', 2: 'positive'}

# Эмоциональные словари для русского (дополняют нейросеть)
EMOTION_LEXICON = {
    'joy': ['радость', 'счастье', 'восторг', 'восхищение', 'ура', 'отлично', 'классно',
            'огонь', 'круто', 'замечательно', 'прекрасно', 'здорово'],
    'sadness': ['грусть', 'печаль', 'тоска', 'уныние', 'расстроен', 'грустно',
                'печально', 'горько', 'слёзы', 'плакал'],
    'anger': ['злость', 'ярость', 'бешенство', 'раздражение', 'злой', 'бесит',
              'достало', 'злюсь', 'раздражает', 'ненавижу'],
    'fear': ['страх', 'тревога', 'беспокойство', 'боюсь', 'страшно', 'тревожно',
             'нервничаю', 'волнуюсь', 'паника'],
    'surprise': ['удивление', 'неожиданно', 'вау', 'невероятно', 'поразительно',
                 'не ожидал', 'удивлён', 'удивительно'],
    'fatigue': ['устал', 'усталость', 'выгорание', 'сложный день', 'тяжело',
                'вымотан', 'нет сил', 'изматывает'],
    'interest': ['интересно', 'любопытно', 'захватывает', 'увлекательно', 'интерес',
                 'заинтересован', 'хочу узнать', 'изучаю'],
}

@dataclass
class AnalysisResult:
    sentiment: str = 'neutral'           # positive / neutral / negative
    sentiment_score: float = 0.0         # 0-1
    emotions: Dict[str, float] = field(default_factory=dict)   # {emotion: score}
    dominant_emotion: str = 'neutral'
    keywords: List[str] = field(default_factory=list)           # ключевые фразы
    entities: Dict[str, List[str]] = field(default_factory=dict) # {тип: [значения]}
    topics: List[str] = field(default_factory=list)             # автотеги
    text_stats: Dict = field(default_factory=dict)


def analyze_text(text: str) -> AnalysisResult:
    if not text or len(text.strip()) < 3:
        return AnalysisResult()

    _load_models()
    result = AnalysisResult()

    # 1. Нормализация
    clean = _clean_text(text)

    # 2. Sentiment через rubert-tiny2
    result.sentiment, result.sentiment_score = _get_sentiment(clean)

    # 3. Эмоции через лексикон + sentiment
    result.emotions = _detect_emotions(clean, result.sentiment, result.sentiment_score)
    result.dominant_emotion = max(result.emotions, key=result.emotions.get) \
        if result.emotions else 'neutral'

    # 4. Ключевые слова через KeyBERT
    result.keywords = _extract_keywords(clean)

    # 5. Именованные сущности через Natasha
    result.entities = _extract_entities(clean)

    # 6. Автотеги (объединяем keywords + entities)
    result.topics = _build_topics(result.keywords, result.entities)

    # 7. Базовая статистика
    words = clean.split()
    result.text_stats = {
        'word_count': len(words),
        'char_count': len(clean),
        'sentence_count': len(re.split(r'[.!?]+', clean)),
    }

    return result



def _clean_text(text: str) -> str:
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)   # убираем md-изображения
    text = re.sub(r'\*+|_+|`+|#{1,6}\s', '', text)  # убираем md-разметку
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text[:2000]  # ограничиваем длину


def _get_sentiment(text: str):
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
    text_lower = text.lower()
    scores = {}

    for emotion, keywords in EMOTION_LEXICON.items():
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > 0:
            scores[emotion] = min(1.0, hits * 0.4 + 0.2)

    # Усиливаем через sentiment
    if sentiment == 'positive' and sentiment_score > 0.6:
        for e in ('joy', 'interest', 'surprise'):
            if e in scores:
                scores[e] = min(1.0, scores[e] + 0.2)
    elif sentiment == 'negative' and sentiment_score > 0.6:
        for e in ('sadness', 'anger', 'fear', 'fatigue'):
            if e in scores:
                scores[e] = min(1.0, scores[e] + 0.2)

    # Если ничего не найдено, добавляем базовую эмоцию из sentiment
    if not scores:
        base = {'positive': 'joy', 'negative': 'sadness', 'neutral': 'neutral'}
        scores[base[sentiment]] = sentiment_score

    return dict(sorted(scores.items(), key=lambda x: -x[1])[:5])


def _extract_keywords(text: str) -> List[str]:
    if len(text.split()) < 3:
        return []
    try:
        kws = _kw_model.extract_keywords(
            text,
            keyphrase_ngram_range=(1, 2),
            stop_words=None,
            top_n=8,
            use_mmr=True,
            diversity=0.5
        )
        # Лемматизируем через pymorphy
        result = []
        for kw, score in kws:
            if score > 0.2:
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
    # Добавляем сущности как топики
    for etype, vals in entities.items():
        topics.extend(vals[:2])
    # Убираем дубли, сохраняем порядок
    seen = set()
    result = []
    for t in topics:
        t_norm = t.lower().strip()
        if t_norm not in seen and len(t_norm) > 2:
            seen.add(t_norm)
            result.append(t)
    return result[:10]