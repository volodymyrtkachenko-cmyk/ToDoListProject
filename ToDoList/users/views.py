from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.db.models import Q
from django.views.decorators.cache import never_cache


@never_cache
def register_view(request):
    if request.user.is_authenticated:
        return redirect('main')

    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        if User.objects.filter(Q(username__icontains=username) | Q(email__icontains=email)).exists():
            return render(request, 'users/login_register.html',
                          {'mode': 'register', 'error': "Аккаунт з таким email або імʼям вже існує!",
                           'title': 'Реєстрація'})

        user = User.objects.create_user(username, email, password)
        login(request, user)
        return redirect('main')

    return render(request, 'users/login_register.html', {'mode': 'register', 'title': 'Реєстрація'})


@never_cache
def login_view(request):
    if request.user.is_authenticated:
        return redirect('main')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = User.objects.get(email=email)

            if user.check_password(password):
                login(request, user)
                return redirect('main')
            else:
                return render(request, 'users/login_register.html',
                              {'mode': 'login', 'error': 'email або пароль не вірний', 'title': 'Вхід'})

        except User.DoesNotExist:
            return render(request, 'users/login_register.html',
                          {'mode': 'login', 'error': 'email або пароль не вірний', 'title': 'Вхід'})

    return render(request, 'users/login_register.html', {'mode': 'login', 'title': 'Вхід'})


@login_required
def logout_view(request):
    logout(request)
    return redirect('home')
