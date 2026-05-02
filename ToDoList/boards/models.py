from os import name

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver




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
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'категорія'
        verbose_name_plural = 'категорії'
        ordering = ['order']
        constraints = [
            models.UniqueConstraint(fields=['user', 'color'], name='unique_user_color'),
            models.UniqueConstraint(
                fields=['user', 'is_default'],
                condition=models.Q(is_default=True),
                name='unique_user_default_category',
            ),
        ]


class Task(models.Model):
    class Priority(models.IntegerChoices):
        LOW = 1, 'Низький'
        MEDIUM = 2, 'Середній'
        HIGH = 3, 'Високий'

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='tasks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255, verbose_name='назва')
    description = models.TextField(blank=True, verbose_name='опис')
    priority = models.IntegerField(choices=Priority.choices, default=Priority.MEDIUM)
    order = models.PositiveIntegerField(default=0)
    is_done = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True, verbose_name='дедлайн')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.due_date and not self.is_done and self.due_date < timezone.now().date()

    class Meta:
        verbose_name = 'завдання'
        verbose_name_plural = 'завдання'
        ordering = ['order', '-created_at']


@receiver(post_save, sender=User)
def create_default_category(sender, instance, created, **kwargs):
    if created:
        Category.objects.create(
            user=instance,
            name='Всі',
            color=Category.Color.SLATE,
            is_default=True,
            order=0,
        )

        Category.objects.create(
            user=instance,
            name='Перша ктегорія',
            color=Category.Color.ORANGE,
            is_default=False,
            order=1,
        )
