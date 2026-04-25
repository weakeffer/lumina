from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0007_noteanalysis'),
    ]

    operations = [
        migrations.AddField(
            model_name='noteanalysis',
            name='narrative',
            field=models.TextField(
                default='',
                blank=True,
                verbose_name='Нарратив',
                help_text='Текстовое описание заметки, сгенерированное локально',
            ),
        ),
    ]