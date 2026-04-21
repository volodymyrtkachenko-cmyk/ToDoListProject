from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required()
def main(request):
    return render(request, 'boards/main.html')


def about(request):
    return render(request, 'boards/about.html')