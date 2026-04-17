from django.shortcuts import render

# Create your views here.
def home(request):
    return render(request, 'start_pages/home.html')


def contacts(request):
    return render(request, 'start_pages/contacts.html')


def about(request):
    return render(request, 'start_pages/about.html')