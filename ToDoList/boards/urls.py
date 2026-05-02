from django.urls import path
from . import views

urlpatterns = [
    path('main/', views.main, name='main'),
    path('archive/', views.archive, name='archive'),
    path('profile/', views.profile, name='profile'),
    path('contact/', views.contacts_boards, name='contacts_boards'),
    path('about/', views.about_boards, name='about_boards'),
    path('create_category/', views.create_category, name='create_category'),
    path('delete_category/<int:pk>', views.delete_category, name='delete_category'),
    path('categories/reorder/', views.reorder_categories, name='reorder_categories'),
    path('create_task/', views.create_task, name='create_task'),
    path('edit-task/', views.edit_task, name='edit_task'),
]
