import json
from datetime import datetime
from django.utils import timezone
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.db.models import Count, Q
from .models import Category, Task


def get_available_colors(user):
    used_colors = set(user.categories.values_list("color", flat=True))
    return list(set(Category.Color.values) - used_colors)


@login_required
def main(request):
    categories = request.user.categories.annotate(
        task_count=Count('tasks', filter=Q(tasks__is_archived=False))
    ).order_by('order')
    available_colors = get_available_colors(request.user)
    form_categories = categories.filter(is_default=False)
    tasks = request.user.tasks.filter(is_archived=False).order_by('-priority')

    tasks_list = []
    pri_map = {1: 'low', 2: 'med', 3: 'high'}

    for t in tasks:
        tasks_list.append({
            'id': t.id,
            'title': t.title,
            'description': t.description,
            'date': t.due_date.strftime('%Y-%m-%d') if t.due_date else None,
            'priority': pri_map.get(t.priority, 'med'),
            'category_name': t.category.name,
            'category_id': t.category.id,
            'category_color': t.category.color,
            'is_done': t.is_done,
            'is_overdue': t.is_overdue,
        })

    context = {
        'title': 'Головна',
        'categories': categories,
        'available_colors': available_colors,
        'form_categories': form_categories,
        'tasks_json': tasks_list,
    }
    return render(request, 'boards/main.html', context)


@login_required
def create_task(request):
    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description", "")
        priority = request.POST.get("priority")
        category_id = request.POST.get("category")
        due_date_raw = request.POST.get("due_date")

        if not all([title, priority, category_id]):
            messages.error(request, 'Будь ласка, заповніть всі обов\'язкові поля.')
            return redirect('main')

        due_date = None
        if due_date_raw:
            try:
                due_date = datetime.strptime(due_date_raw, '%Y-%m-%d').date()
                if due_date < timezone.now().date():
                    messages.error(request, 'Дедлайн не відповідає вимогам!')
                    return redirect('main')
            except ValueError:
                messages.error(request, 'Невірний формат дати!')
                return redirect('main')

        category = request.user.categories.filter(id=category_id).first()
        if not category:
            messages.error(request, 'Обрана категорія не існує або вам не належить.')
            return redirect('main')

        try:
            Task.objects.create(
                title=title,
                description=description,
                priority=priority,
                category=category,
                due_date=due_date,
                user=request.user
            )
            messages.success(request, 'Завдання успішно створено!')
        except Exception as e:
            messages.error(request, f'Помилка при збереженні: {e}')
            return redirect('main')

    return redirect('main')


@login_required
def edit_task(request):
    if request.method == "POST":
        task_id = request.POST.get("task_id")
        action = request.POST.get("action")
        task = get_object_or_404(Task, id=task_id, user=request.user)

        if action == "done":
            task.is_done = True
            task.is_archived = True
            task.save()
            messages.success(request, 'Завдання відмічено як виконане!')
            return redirect('main')

        title = request.POST.get("title")
        description = request.POST.get("description")
        priority = request.POST.get("priority")
        category_id = request.POST.get("category")
        due_date_raw = request.POST.get("due_date")

        if title:
            task.title = title

        task.description = description

        if priority:
            task.priority = priority

        if category_id:
            category = request.user.categories.filter(id=category_id).first()
            if category:
                task.category = category

        if due_date_raw:
            try:
                selected_date = datetime.strptime(due_date_raw, '%Y-%m-%d').date()
                today = timezone.now().date()

                if selected_date < today:
                    messages.error(request, 'Дедлайн не може бути раніше сьогоднішнього дня!')
                    return redirect('main')

                task.due_date = selected_date

            except ValueError:
                messages.error(request, 'Невірний формат дати дедлайна!')
                return redirect('main')

        task.save()
        messages.success(request, 'Завдання успішно оновлено!')

    return redirect('main')


@login_required
def delete_category(request, pk):
    category = get_object_or_404(Category, pk=pk, user=request.user)
    if request.method == 'POST':
        category.delete()
        messages.success(request, 'Категорію видалено')
    return redirect('main')


@login_required
def create_category(request):
    available_colors = get_available_colors(request.user)

    if not available_colors:
        messages.error(request, 'Кольори для категорій скінчились')
        return redirect('main')

    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        color = request.POST.get("color")

        if not name or color not in available_colors:
            messages.error(request, 'Невірні дані')
            return redirect('main')

        Category.objects.create(name=name, color=color, user=request.user)
        messages.success(request, 'Категорію успішно додано!')
        return redirect('main')
    return redirect('main')


@login_required
@require_POST
def reorder_categories(request):
    data = json.loads(request.body)
    for item in data['order']:
        request.user.categories.filter(pk=item['id']).update(order=item['order'])
    return JsonResponse({'status': 'ok'})


@login_required
def archive(request):
    return render(request, 'boards/archive.html', {'title': 'Архів'})


@login_required
def profile(request):
    if request.method != "POST":
        return render(request, 'boards/profile.html', {'title': 'Профіль'})

    action = request.POST.get("action")

    if action == "update_info":
        user = request.user
        updated = False
        for field in ("first_name", "last_name"):
            value = request.POST.get(field, "").strip()
            if value:
                setattr(user, field, value)
                updated = True
        if updated:
            user.save()
            messages.success(request, 'Інформацію змінено успішно')
        else:
            messages.error(request, 'Не передано жодного поля')

    elif action == "change_password":
        user = request.user
        user_password = request.POST.get("user_password")
        new_password1 = request.POST.get("new_password1")
        new_password2 = request.POST.get("new_password2")

        if not user.check_password(user_password):
            messages.error(request, 'Поточний пароль не вірний!')
        elif user_password == new_password1:
            messages.error(request, 'Новий пароль не має співпадати з поточним!')
        elif new_password1 != new_password2:
            messages.error(request, 'Паролі не співпадають!')
        else:
            user.set_password(new_password1)
            user.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Пароль успішно змінено!')

    elif action == "update_avatar":
        avatar = request.FILES.get("avatar")
        if avatar:
            request.user.profile.avatar = avatar
            request.user.profile.save()
            messages.success(request, 'Фото змінено!')
        else:
            messages.error(request, 'Фото не вибрано')

    return redirect('profile')


@login_required
def contacts_boards(request):
    return render(request, 'boards/contacts.html', {'title': 'Контакти'})


@login_required
def about_boards(request):
    return render(request, 'boards/about.html', {'title': 'Про нас'})
