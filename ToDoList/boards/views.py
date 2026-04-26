from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required

from .models import Category


def delete_category(request, pk):
    category = get_object_or_404(Category,pk=pk,user=request.user)
    if request.method == 'POST':
        category.delete()
    return redirect('main')


@login_required
def create_category(request):
    if request.method == "POST":
        name = request.POST.get("name")
        color = request.POST.get("color")
        Category.objects.create(name=name, color=color, user=request.user)
        return redirect('main')


@login_required
def main(request):
    categories = request.user.categories.all()
    used_colors = categories.values_list("color", flat=True)
    available_colors = []
    for color in Category.Color.values:
        if color not in used_colors:
            available_colors.append(color)
    return render(request, 'boards/main.html',
                  {'title': 'Головна', 'categories': categories, 'available_colors': available_colors}, )


@login_required
def archive(request):
    return render(request, 'boards/archive.html', {'title': 'Архів'})


@login_required
def profile(request, ):
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "update_info":
            user = request.user
            first_name = request.POST.get("first_name")
            last_name = request.POST.get("last_name")
            if first_name and last_name:
                user.first_name = first_name
                user.last_name = last_name
                user.save()
                messages.success(request, 'Інформація змінено успішно')
                return redirect('profile')
            elif first_name:
                user.first_name = first_name
                user.save()
                messages.success(request, 'Інформація змінено успішно')
                return redirect('profile')
            elif last_name:
                user.last_name = last_name
                user.save()
                messages.success(request, 'Інформація змінено успішно')
                return redirect('profile')


        elif action == "change_password":
            user = request.user
            user_password = request.POST.get("user_password")
            new_password1 = request.POST.get("new_password1")
            new_password2 = request.POST.get("new_password2")
            if not request.user.check_password(user_password):
                messages.error(request, 'Поточний пароль не вірний!')
                return redirect('profile')
            elif user_password == new_password2:
                messages.error(request, 'Поточний пароль не має співпадати з новим!')
                return redirect('profile')
            elif new_password1 != new_password2:
                messages.error(request, 'Паролі мають співпадати!')
                return redirect('profile')
            elif new_password1 == new_password2:
                user.set_password(new_password1)
                user.save()
                update_session_auth_hash(request, user)
                messages.success(request, 'Пароль успішно змінено!')
                return redirect('profile')
            else:
                messages.error(request, 'Щось пішло не так')
        elif action == "update_avatar":
            print("FILES:", request.FILES)
            avatar = request.FILES.get("avatar")
            if avatar:
                request.user.profile.avatar = avatar
                request.user.profile.save()
                messages.success(request, 'Фото змінено!')
                return redirect('profile')
            else:
                messages.error(request, 'Фото не вибрано')
                return redirect('profile')

    return render(request, 'boards/profile.html', {'title': "Профіль"})


@login_required
def contacts_boards(request):
    return render(request, 'boards/contacts.html', {'title': 'Контакти'})


@login_required
def about_boards(request):
    return render(request, 'boards/about.html', {'title': 'Про нас'})
