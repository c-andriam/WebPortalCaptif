from django.urls import path
from . import views

urlpatterns = [
    path('authorize/', views.authorize, name='portal_authorize'),
    path('login/', views.portal_login, name='portal_login'),
]