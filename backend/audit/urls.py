"""
URL configuration for audit app.
"""
from django.urls import path
from . import views

app_name = 'audit'

urlpatterns = [
    # Audit logs (SuperAdmin only)
    path('logs/', views.AuditLogListView.as_view(), name='audit_logs'),
    path('logs/<int:pk>/', views.AuditLogDetailView.as_view(), name='audit_log_detail'),
    path('stats/', views.AuditStatsView.as_view(), name='audit_stats'),
    path('export/', views.AuditExportView.as_view(), name='audit_export'),
    path('integrity-check/', views.IntegrityCheckView.as_view(), name='integrity_check'),
]