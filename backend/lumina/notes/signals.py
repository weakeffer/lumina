# backend/lumina/notes/signals.py (версия БЕЗ django-model-utils)
"""
Сигналы для автоматического NLP-анализа и обновления статистики.
"""
import time
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from .models import Notes

# Кэш для предотвращения повторного анализа
_analysis_throttle_cache = {}


def _should_throttle_analysis(note_id: int) -> bool:
    """Предотвращает повторный запуск анализа для одной заметки в течение 5 секунд"""
    now = time.time()
    last_run = _analysis_throttle_cache.get(note_id, 0)

    if now - last_run < 5:
        return True

    _analysis_throttle_cache[note_id] = now

    # Ограничиваем размер кэша
    if len(_analysis_throttle_cache) > 1000:
        # Удаляем половину самых старых записей
        sorted_items = sorted(_analysis_throttle_cache.items(), key=lambda x: x[1])
        for k, _ in sorted_items[:500]:
            del _analysis_throttle_cache[k]

    return False


def _safe_launch_analysis(note_id: int):
    """Безопасный запуск NLP-анализа с проверками"""
    if _should_throttle_analysis(note_id):
        return

    try:
        from .nlp.service import analyze_note_async
        analyze_note_async(note_id)
    except Exception as e:
        import logging
        logging.getLogger('lumina.nlp').error(
            f"Ошибка запуска анализа заметки {note_id}: {e}", exc_info=True
        )


def _update_user_statistics(user_id: int):
    """Обновляет статистику и инвалидирует кэш профиля"""
    if not user_id:
        return

    try:
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)
        if hasattr(user, 'profile'):
            user.profile.update_stats()
    except Exception as e:
        import logging
        logging.getLogger('lumina.nlp').warning(
            f"Ошибка статистики пользователя {user_id}: {e}"
        )

    try:
        from .nlp.profile_service import invalidate_profile_cache
        invalidate_profile_cache(user_id)
    except Exception as e:
        import logging
        logging.getLogger('lumina.nlp').warning(
            f"Ошибка кэша профиля {user_id}: {e}"
        )

@receiver(post_save, sender=Notes)
def handle_note_save(sender, instance, created, **kwargs):
    """Автоматический запуск NLP-анализа при создании/обновлении заметки"""
    if instance.is_deleted:
        return

    should_analyze = False

    if created:
        should_analyze = True
    else:
        update_fields = kwargs.get('update_fields')
        if update_fields is None:
            # Полное сохранение — анализируем всегда
            should_analyze = True
        elif 'text' in update_fields or 'title' in update_fields:
            # Частичное обновление контента
            should_analyze = True

    _update_user_statistics(instance.user_id)

    if should_analyze:
        # Отложенный запуск после коммита транзакции
        transaction.on_commit(lambda: _safe_launch_analysis(instance.id))

@receiver(post_delete, sender=Notes)
def handle_note_delete(sender, instance, **kwargs):
    """Обновление статистики при удалении заметки"""
    _update_user_statistics(instance.user_id)