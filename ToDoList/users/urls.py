from django.urls import path, include
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('activate/<str:uidb64>/<str:token>/', views.activate_view, name='activate'),
    path('password-reset/<str:uidb64>/<str:token>/', views.password_reset_confirm_view,
         name='password_reset_confirm'), ]
