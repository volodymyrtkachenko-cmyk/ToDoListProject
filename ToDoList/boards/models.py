from symtable import Class

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return self.user.username


class Category(models.Model):
    class Color(models.TextChoices):
        VIOLET_LIGHT = '#a78bfa', 'Світло-фіолетовий'
        VIOLET = '#8b5cf6', 'Фіолетовий'
        EMERALD = '#34d399', 'Смарагдовий'
        AMBER = '#fbbf24', 'Бурштиновий'
        ORANGE = '#f97316', 'Помаранчевий'
        RED = '#f87171', 'Червоний'
        FUCHSIA = '#e879f9', 'Фуксія'
        SKY = '#38bdf8', 'Блакитний'
        GREEN = '#4ade80', 'Зелений'
        YELLOW = '#facc15', 'Жовтий'
        PINK = '#f472b6', 'Рожевий'
        SLATE = '#94a3b8', 'Сірий'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=20, verbose_name='назва')
    color = models.CharField(max_length=7, choices=Color.choices, default=Color.VIOLET, verbose_name='колір')
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'категорія'
        verbose_name_plural = 'категорії'


@receiver(post_save, sender=User)
def create_default_categories(sender, instance, created, **kwargs):
    if created:
        Category.objects.create(
            user=instance,
            name='Всі завдання',
            color='#94a3b8',
            is_default=True,  # щоб не можна було видалити
        )
