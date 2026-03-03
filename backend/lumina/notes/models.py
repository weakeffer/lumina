from django.db import models
from django.contrib.auth.models import User
import os

class NoteGroup(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name="Название группы"
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name="Описание"
    )
    color = models.CharField(
        max_length=20,
        default='indigo',
        verbose_name="Цвет группы"
    )
    icon = models.CharField(
        max_length=50,
        default='Folder',
        verbose_name="Иконка"
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='note_groups'
    )
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Группа заметок'
        verbose_name_plural = 'Группы заметок'
        unique_together = ['name', 'user']

    def __str__(self):
        return f"{self.name} - {self.user.username}"

class Notes(models.Model):
    title = models.CharField(
        max_length=50,
        default="Заметка"
    )
    text = models.TextField(
        verbose_name="Введите заметку",
    )
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="В корзине"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Дата удаления"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    images = models.JSONField(
        default=list,
        blank=True,
        verbose_name="Изображения"
    )
    group = models.ForeignKey(
        NoteGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notes',
        verbose_name="Группа"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Заметка'
        verbose_name_plural = 'Заметки'

    def __str__(self):
        return f"{self.title} пользователь: {self.user.username}"

    def add_image(self, image_url, image_id=None, filename=None):
        if not self.images:
            self.images = []
        
        image_data = {
            'url': image_url,
            'added_at': len(self.images)
        }
        
        if image_id:
            image_data['id'] = image_id
        if filename:
            image_data['filename'] = filename
            
        self.images.append(image_data)
        self.save(update_fields=['images'])
        
    def remove_image(self, image_url_or_id):
        if not self.images:
            return False
            
        original_count = len(self.images)
        if isinstance(image_url_or_id, (int, str)) and str(image_url_or_id).isdigit():
            image_id = int(image_url_or_id)
            self.images = [img for img in self.images if img.get('id') != image_id]
        else:
            self.images = [img for img in self.images if img.get('url') != image_url_or_id]
        
        if len(self.images) != original_count:
            self.save(update_fields=['images'])
            return True
        return False

    def get_images(self):
        return self.images if self.images else []

    def has_images(self):
        return bool(self.images)

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)