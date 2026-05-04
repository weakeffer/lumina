"""
Скрипт дообучения английской модели эмоций на датасете:
boltuix/emotions-dataset

Запуск:
python backend/lumina/notes/nlp/finetune_english.py
"""

import json
import logging
import os
import inspect
from dataclasses import dataclass
from typing import Dict

import numpy as np
import torch
from datasets import DatasetDict, load_dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lumina.nlp.finetune_en")


@dataclass
class FineTuneConfig:
    """Конфигурация дообучения."""

    dataset_name: str = "boltuix/emotions-dataset"
    text_column: str = "Sentence"
    label_column: str = "Label"
    base_model_name: str = "distilbert-base-uncased"
    output_dir: str = "nlp_models/english-emotions-boltuix"
    test_size: float = 0.1
    val_size_from_train: float = 0.1
    max_length: int = 256
    epochs: int = 4
    learning_rate: float = 2e-5
    train_batch_size: int = 16
    eval_batch_size: int = 32
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    seed: int = 42


def _prepare_splits(config: FineTuneConfig) -> DatasetDict:
    """
    Загружает исходный датасет и строит train/validation/test.
    В исходном датасете один split, поэтому делим вручную.
    """
    logger.info("Загрузка датасета %s...", config.dataset_name)
    raw = load_dataset(config.dataset_name)
    if "train" not in raw:
        raise RuntimeError("В датасете нет split 'train', дообучение невозможно.")

    train_ds = raw["train"]
    missing_cols = [c for c in [config.text_column, config.label_column] if c not in train_ds.column_names]
    if missing_cols:
        raise RuntimeError(f"В датасете отсутствуют колонки: {missing_cols}")

    # Преобразуем Label (строки) в ClassLabel для стратифицированного split.
    train_ds = train_ds.class_encode_column(config.label_column)

    test_valid = train_ds.train_test_split(
        test_size=config.test_size,
        seed=config.seed,
        stratify_by_column=config.label_column,
    )
    train_valid = test_valid["train"].train_test_split(
        test_size=config.val_size_from_train,
        seed=config.seed,
        stratify_by_column=config.label_column,
    )

    splits = DatasetDict(
        {
            "train": train_valid["train"],
            "validation": train_valid["test"],
            "test": test_valid["test"],
        }
    )

    logger.info(
        "Размеры split'ов: train=%s, validation=%s, test=%s",
        len(splits["train"]),
        len(splits["validation"]),
        len(splits["test"]),
    )
    return splits


def _build_metrics_fn(id2label: Dict[int, str]):
    """Возвращает функцию метрик для Trainer."""

    label_names = [id2label[i] for i in sorted(id2label)]

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        predictions = np.argmax(logits, axis=-1)

        accuracy = float((predictions == labels).mean())

        # Macro-F1 без внешних библиотек (чтобы не тянуть sklearn обязательно).
        f1_scores = []
        for class_id in range(len(label_names)):
            tp = int(((predictions == class_id) & (labels == class_id)).sum())
            fp = int(((predictions == class_id) & (labels != class_id)).sum())
            fn = int(((predictions != class_id) & (labels == class_id)).sum())

            precision = tp / (tp + fp) if tp + fp > 0 else 0.0
            recall = tp / (tp + fn) if tp + fn > 0 else 0.0
            if precision + recall == 0:
                f1 = 0.0
            else:
                f1 = 2 * precision * recall / (precision + recall)
            f1_scores.append(f1)

        macro_f1 = float(np.mean(f1_scores))
        return {"accuracy": accuracy, "macro_f1": macro_f1}

    return compute_metrics


def _build_training_arguments(config: FineTuneConfig) -> TrainingArguments:
    """
    Строит TrainingArguments с учетом разных версий transformers.
    В некоторых версиях отличаются имена аргументов или часть параметров отсутствует.
    """
    signature = inspect.signature(TrainingArguments.__init__)
    supported = set(signature.parameters.keys())

    kwargs = {
        "output_dir": config.output_dir,
        "learning_rate": config.learning_rate,
        "per_device_train_batch_size": config.train_batch_size,
        "per_device_eval_batch_size": config.eval_batch_size,
        "num_train_epochs": config.epochs,
        "weight_decay": config.weight_decay,
        "logging_steps": 100,
        "load_best_model_at_end": True,
        "metric_for_best_model": "macro_f1",
        "greater_is_better": True,
        "save_total_limit": 2,
        "fp16": torch.cuda.is_available(),
        "seed": config.seed,
    }

    # Совместимость по названию стратегий оценки.
    if "eval_strategy" in supported:
        kwargs["eval_strategy"] = "epoch"
    elif "evaluation_strategy" in supported:
        kwargs["evaluation_strategy"] = "epoch"

    if "save_strategy" in supported:
        kwargs["save_strategy"] = "epoch"

    # Опциональные параметры (есть не во всех версиях).
    if "overwrite_output_dir" in supported:
        kwargs["overwrite_output_dir"] = True
    if "warmup_ratio" in supported:
        kwargs["warmup_ratio"] = config.warmup_ratio
    if "report_to" in supported:
        kwargs["report_to"] = []

    # Отбрасываем параметры, которых нет в текущей версии.
    kwargs = {k: v for k, v in kwargs.items() if k in supported}
    return TrainingArguments(**kwargs)


def _build_trainer(
    model,
    args: TrainingArguments,
    train_dataset,
    eval_dataset,
    tokenizer,
    data_collator,
    compute_metrics,
) -> Trainer:
    """
    Создает Trainer с учетом разных версий transformers.
    В новых версиях обычно есть tokenizer/processing_class, в старых — может не быть.
    """
    signature = inspect.signature(Trainer.__init__)
    supported = set(signature.parameters.keys())

    kwargs = {
        "model": model,
        "args": args,
        "train_dataset": train_dataset,
        "eval_dataset": eval_dataset,
        "data_collator": data_collator,
        "compute_metrics": compute_metrics,
    }

    if "tokenizer" in supported:
        kwargs["tokenizer"] = tokenizer
    elif "processing_class" in supported:
        kwargs["processing_class"] = tokenizer

    return Trainer(**kwargs)


def main():
    config = FineTuneConfig()

    try:
        os.makedirs(config.output_dir, exist_ok=True)

        splits = _prepare_splits(config)
        label_feature = splits["train"].features[config.label_column]
        label_names = label_feature.names
        id2label = {i: name for i, name in enumerate(label_names)}
        label2id = {name: i for i, name in id2label.items()}

        logger.info("Эмоции датасета: %s", label_names)

        tokenizer = AutoTokenizer.from_pretrained(config.base_model_name)

        def preprocess(batch):
            return tokenizer(
                batch[config.text_column],
                truncation=True,
                max_length=config.max_length,
            )

        tokenized_splits = splits.map(preprocess, batched=True)
        tokenized_splits = tokenized_splits.rename_column(config.label_column, "labels")
        tokenized_splits = tokenized_splits.remove_columns(
            [c for c in tokenized_splits["train"].column_names if c not in ["input_ids", "attention_mask", "labels"]]
        )

        model = AutoModelForSequenceClassification.from_pretrained(
            config.base_model_name,
            num_labels=len(label_names),
            id2label=id2label,
            label2id=label2id,
        )

        args = _build_training_arguments(config)

        trainer = _build_trainer(
            model=model,
            args=args,
            train_dataset=tokenized_splits["train"],
            eval_dataset=tokenized_splits["validation"],
            tokenizer=tokenizer,
            data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
            compute_metrics=_build_metrics_fn(id2label),
        )

        logger.info("Старт обучения...")
        trainer.train()

        logger.info("Оценка на validation...")
        val_metrics = trainer.evaluate(tokenized_splits["validation"])
        logger.info("Validation метрики: %s", val_metrics)

        logger.info("Оценка на test...")
        test_metrics = trainer.evaluate(tokenized_splits["test"], metric_key_prefix="test")
        logger.info("Test метрики: %s", test_metrics)

        logger.info("Сохранение модели и токенайзера в %s", config.output_dir)
        trainer.save_model(config.output_dir)
        tokenizer.save_pretrained(config.output_dir)

        metadata_path = os.path.join(config.output_dir, "training_metadata.json")
        metadata = {
            "dataset_name": config.dataset_name,
            "base_model_name": config.base_model_name,
            "label_names": label_names,
            "sizes": {k: len(v) for k, v in splits.items()},
            "validation_metrics": val_metrics,
            "test_metrics": test_metrics,
        }
        with open(metadata_path, "w", encoding="utf-8") as fh:
            json.dump(metadata, fh, ensure_ascii=False, indent=2)

        logger.info("Дообучение завершено успешно.")
        logger.info("Метафайл обучения: %s", metadata_path)

    except Exception as exc:
        logger.exception("Ошибка во время дообучения: %s", exc)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
