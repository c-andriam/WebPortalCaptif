from django.db import models
from django.conf import settings

class Event(models.Model):
    class EventType(models.TextChoices):
        USER_REGISTRATION = 'USER_REGISTRATION', 'User Registration'
        USER_VALIDATION = 'USER_VALIDATION', 'User Validation'
        QUOTA_WARNING = 'QUOTA_WARNING', 'Quota Warning'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'
        ADMIN_ACTION = 'ADMIN_ACTION', 'Admin Action'
        SYSTEM_CONFIG = 'SYSTEM_CONFIG', 'System Configuration'
        VOUCHER_USED = 'VOUCHER_USED', 'Voucher Used'

    class Audience(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
        SUPERADMIN = 'SUPERADMIN', 'Super Admin'
        ALL = 'ALL', 'All'

    event_type = models.CharField(max_length=30, choices=EventType.choices)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    
    # Content
    title = models.CharField(max_length=200)
    message = models.TextField()
    payload = models.JSONField(default=dict)  # Additional data
    
    # Targeting
    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.USER)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications_event'
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['event_type', 'created_at']),
            models.Index(fields=['audience', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.event_type})"