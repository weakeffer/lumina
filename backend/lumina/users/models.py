from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.validators import FileExtensionValidator

class Profile(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,
        related_name='profile'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True, 
        blank=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'gif'])],
        verbose_name="Аватар"
    )
    bio = models.TextField(
        max_length=500,
        blank=True,
        verbose_name="О себе"
    )
    telegram = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Telegram"
    )
    github = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="GitHub"
    )
    website = models.URLField(
        blank=True,
        verbose_name="Сайт"
    )
    
    theme_preference = models.CharField(
        max_length=20,
        default='light',
        choices=[
            ('light', 'Светлая'),
            ('dark', 'Тёмная'),
            ('sepia', 'Сепия'),
            ('ocean', 'Океан'),
            ('forest', 'Лес'),
        ],
        verbose_name="Тема оформления"
    )
    email_notifications = models.BooleanField(
        default=True,
        verbose_name="Email уведомления"
    )
    auto_save_interval = models.IntegerField(
        default=1,
        verbose_name="Интервал автосохранения (сек)"
    )

    total_notes = models.IntegerField(default=0)
    total_words = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'

    def __str__(self):
        return f"Профиль {self.user.username}"

    @property
    def avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return None

    def update_stats(self):
        from notes.models import Notes
        notes = Notes.objects.filter(user=self.user, is_deleted=False)
        self.total_notes = notes.count()
        
        total_words = 0
        for note in notes:
            if note.text:
                total_words += len(note.text.split())
        self.total_words = total_words
        self.save(update_fields=['total_notes', 'total_words'])

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)