from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Notes

@receiver([post_save, post_delete], sender=Notes)
def update_user_stats(sender, instance, **kwargs):
    if instance.user_id:
        try:
            instance.user.profile.update_stats()
        except:
            pass