from django.db import models
from django.contrib.auth.models import User

class Notes(models.Model):
    title = models.CharField(
        max_length= 50,
        default="Заметка"
    )

    text = models.TextField(
        verbose_name= "Введите заметку",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now= True
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notes'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Заметка'
        verbose_name_plural = 'Заметки'

    def __str__ (self):
        return f"{self.title} пользователь: {self.user.username}"