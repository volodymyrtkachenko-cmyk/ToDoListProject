from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib import messages
from django.db.models import Q
from django.views.decorators.cache import never_cache
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site


@never_cache
def register_view(request):
    if request.user.is_authenticated:
        return redirect('main')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        if not username or not email or not password:
            return render(request, 'users/login_register.html',
                          {'mode': 'register', 'error': "Всі поля є обов'язковими!",
                           'title': 'Реєстрація'})

        if User.objects.filter(Q(username__iexact=username) | Q(email__iexact=email)).exists():
            return render(request, 'users/login_register.html',
                          {'mode': 'register', 'error': "Акаунт з таким email або імʼям вже існує!",
                           'title': 'Реєстрація'})
        if len(password) < 8:
            return render(request, 'users/login_register.html',
                          {'mode': 'register', 'error': 'Пароль має бути не менше 8 символів.', 'title': 'Реєстрація'})

        user = User.objects.create_user(username=username, email=email, password=password)
        user = User.objects.create_user(username=username, email=email, password=password)
        user.is_active = False
        user.save()

        current_site = get_current_site(request)
        mail_subject = 'Активація вашого акаунту'
        message = render_to_string('users/acc_active_email.html', {  # Цей шаблон створимо на наступному кроці
            'user': user,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': default_token_generator.make_token(user),
        })
        email_message = EmailMessage(mail_subject, message, to=[email])
        email_message.send()

        return render(request, 'users/login_register.html',
                      {'mode': 'login', 'error': 'Акаунт створено! Перевірте пошту для активації.', 'title': 'Вхід'})

    return render(request, 'users/login_register.html', {'mode': 'register', 'title': 'Реєстрація'})


@never_cache
def login_view(request):
    if request.user.is_authenticated:
        return redirect('main')

    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')

        if not email or not password:
            return render(request, 'users/login_register.html',
                          {'mode': 'login', 'error': 'Будь ласка, введіть email та пароль',
                           'title': 'Вхід'})

        try:
            user = User.objects.get(email=email)

            if not user.is_active:
                return render(request, 'users/login_register.html',
                              {'mode': 'login', 'error': 'Спочатку підтвердіть вашу пошту!', 'title': 'Вхід'})

            authenticated_user = authenticate(request, username=user.username, password=password)
            if authenticated_user is not None:
                login(request, authenticated_user)
                return redirect('main')
            else:
                return render(request, 'users/login_register.html',
                              {'mode': 'login', 'error': 'email або пароль не вірний', 'title': 'Вхід'})



        except (User.DoesNotExist, User.MultipleObjectsReturned):
            return render(request, 'users/login_register.html',
                          {'mode': 'login', 'error': 'email або пароль не вірний', 'title': 'Вхід'})

    return render(request, 'users/login_register.html', {'mode': 'login', 'title': 'Вхід'})


@login_required
def logout_view(request):
    logout(request)
    return redirect('home')


def activate_view(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except(TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return render(request, 'users/login_register.html',
                      {'mode': 'login', 'success': 'Пошту підтверджено! Тепер ви можете увійти.', 'title': 'Вхід'})
    else:
        return render(request, 'users/login_register.html',
                      {'mode': 'login', 'error': 'Посилання для активації недійсне або застаріле.', 'title': 'Вхід'})



@login_required
def password_reset_confirm_view(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or user != request.user or not default_token_generator.check_token(user, token):
        messages.error(request, 'Посилання недійсне або застаріло.')
        return redirect('profile')

    if request.method == 'POST':
        new_password1 = request.POST.get('new_password1', '')
        new_password2 = request.POST.get('new_password2', '')

        if not new_password1 or not new_password2:
            return render(request, 'users/password_reset_confirm.html',
                          {'valid_link': True, 'error': 'Заповніть обидва поля.', 'title': 'Новий пароль'})

        if new_password1 != new_password2:
            return render(request, 'users/password_reset_confirm.html',
                          {'valid_link': True, 'error': 'Паролі не збігаються.', 'title': 'Новий пароль'})

        if len(new_password1) < 8:
            return render(request, 'users/password_reset_confirm.html',
                          {'valid_link': True, 'error': 'Пароль має бути не менше 8 символів.',
                           'title': 'Новий пароль'})

        user.set_password(new_password1)
        user.save()
        update_session_auth_hash(request, user)

        messages.success(request, 'Пароль успішно змінено!')
        return redirect('profile')

    return render(request, 'users/password_reset_confirm.html',
                  {'valid_link': True, 'title': 'Новий пароль'})
