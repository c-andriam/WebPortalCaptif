from django.db import models
from django.conf import settings
import hashlib
import json

class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        VALIDATE = 'VALIDATE', 'Validate'
        REVOKE = 'REVOKE', 'Revoke'
        CONFIG_CHANGE = 'CONFIG_CHANGE', 'Configuration Change'

    # Actor (who performed the action)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    actor_role = models.CharField(max_length=20, blank=True)  # Role snapshot
    
    # Action details
    action = models.CharField(max_length=20, choices=Action.choices)
    target_type = models.CharField(max_length=50)  # Model name
    target_id = models.CharField(max_length=50, blank=True)  # Object ID
    
    # Metadata
    metadata = models.JSONField(default=dict)  # Additional context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Integrity
    content_hash = models.CharField(max_length=64, blank=True)  # SHA-256 hash
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_auditlog'
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
        ]
        # Append-only table - no updates allowed
        default_permissions = ('add', 'view')

    def save(self, *args, **kwargs):
        if not self.content_hash:
            content = json.dumps({
                'actor': self.actor_id,
                'action': self.action,
                'target_type': self.target_type,
                'target_id': self.target_id,
                'metadata': self.metadata,
                'timestamp': self.timestamp.isoformat() if self.timestamp else None
            }, sort_keys=True)
            self.content_hash = hashlib.sha256(content.encode()).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        actor_info = f"{self.actor.email}" if self.actor else "System"
        return f"{actor_info} {self.action} {self.target_type}#{self.target_id}"