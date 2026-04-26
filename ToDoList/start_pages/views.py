from django.contrib.auth.models import User
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.contrib import messages


def home(request):
    if request.user.is_authenticated:
        return redirect('main')
    return render(request, 'start_pages/home.html', {'title': "Головна"})


def contacts(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        topic = request.POST.get('topic')
        message = request.POST.get('message')
        full_message = f'Імʼя: {name}\nПошта: {email}\nТема: {topic}\nПовідомлення: {message}'

        send_mail(
            subject=f'Нове запитання від {name}',
            message=full_message,
            from_email='smtp.gmail.com',
            recipient_list=['vova38338@gmail.com']
        )
        if request.user.is_authenticated:
            messages.success(request, 'Повідомлення відправленно успішно!')
            return redirect('contacts_boards')
        else:
            messages.success(request, 'Повідомлення відправленно успішно!')
            return redirect('home')
    return render(request, 'start_pages/contacts.html', {'title': "Контакти"})


def about(request):
    return render(request, 'start_pages/about.html', {'title': "Про нас"})
