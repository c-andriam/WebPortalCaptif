"""
Audit logging models for immutable audit trail.
"""
import uuid
import hashlib
import json
from django.db import models
from django.conf import settings
from django.utils import timezone


class AuditLog(models.Model):
    """
    Immutable audit log for tracking all sensitive actions.
    """
    
    class Action(models.TextChoices):
        # User actions
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        LOGIN_FAILED = 'LOGIN_FAILED', 'Login Failed'
        
        # Account management
        VALIDATE = 'VALIDATE', 'Validate'
        REVOKE = 'REVOKE', 'Revoke'
        SUSPEND = 'SUSPEND', 'Suspend'
        REACTIVATE = 'REACTIVATE', 'Reactivate'
        
        # Security actions
        PASSWORD_CHANGE = 'PASSWORD_CHANGE', 'Password Change'
        PASSWORD_RESET = 'PASSWORD_RESET', 'Password Reset'
        PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST', 'Password Reset Request'
        EMAIL_VERIFY = 'EMAIL_VERIFY', 'Email Verify'
        MFA_ENABLE = 'MFA_ENABLE', '2FA Enable'
        MFA_DISABLE = 'MFA_DISABLE', '2FA Disable'
        MFA_BACKUP_CODES_REGENERATE = 'MFA_BACKUP_CODES_REGENERATE', '2FA Backup Codes Regenerate'
        
        # Session management
        SESSION_START = 'SESSION_START', 'Session Start'
        SESSION_END = 'SESSION_END', 'Session End'
        SESSION_REVOKE = 'SESSION_REVOKE', 'Session Revoke'
        SESSION_TIMEOUT = 'SESSION_TIMEOUT', 'Session Timeout'
        
        # Portal actions
        PORTAL_LOGIN = 'PORTAL_LOGIN', 'Portal Login'
        PORTAL_LOGOUT = 'PORTAL_LOGOUT', 'Portal Logout'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'
        
        # Voucher actions
        VOUCHER_CREATE = 'VOUCHER_CREATE', 'Voucher Create'
        VOUCHER_USE = 'VOUCHER_USE', 'Voucher Use'
        VOUCHER_REVOKE = 'VOUCHER_REVOKE', 'Voucher Revoke'
        
        # System actions
        CONFIG_CHANGE = 'CONFIG_CHANGE', 'Configuration Change'
        SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE', 'System Maintenance'

    # Actor (who performed the action)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    actor_email = models.CharField(max_length=254, blank=True)  # Snapshot
    actor_role = models.CharField(max_length=20, blank=True)    # Snapshot
    
    # Action details
    action = models.CharField(max_length=30, choices=Action.choices)
    target_type = models.CharField(max_length=50)  # Model name
    target_id = models.CharField(max_length=50, blank=True)
    target_repr = models.TextField(blank=True)     # String representation
    
    # Change details
    metadata = models.JSONField(default=dict)
    changes = models.JSONField(default=dict)       # Before/after for updates
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.UUIDField(null=True, blank=True)
    
    # Integrity
    content_hash = models.CharField(max_length=64, blank=True)  # SHA-256
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_auditlog'
        # Only allow add and view permissions - no change or delete
        default_permissions = ('add', 'view')
        indexes = [
            models.Index(fields=['actor', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]

    def __str__(self):
        actor_info = self.actor_email if self.actor_email else "System"
        return f"{actor_info} {self.action} {self.target_type}#{self.target_id}"

    def save(self, *args, **kwargs):
        """Override save to calculate content hash for integrity."""
        if not self.content_hash:
            # Create content hash for integrity verification
            content = json.dumps({
                'actor_id': self.actor_id,
                'actor_email': self.actor_email,
                'actor_role': self.actor_role,
                'action': self.action,
                'target_type': self.target_type,
                'target_id': self.target_id,
                'target_repr': self.target_repr,
                'metadata': self.metadata,
                'changes': self.changes,
                'ip_address': str(self.ip_address) if self.ip_address else '',
                'user_agent': self.user_agent,
                'request_id': str(self.request_id) if self.request_id else '',
                'timestamp': self.timestamp.isoformat() if self.timestamp else timezone.now().isoformat()
            }, sort_keys=True)
            
            self.content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        super().save(*args, **kwargs)

    def verify_integrity(self):
        """Verify the integrity of this audit log entry."""
        content = json.dumps({
            'actor_id': self.actor_id,
            'actor_email': self.actor_email,
            'actor_role': self.actor_role,
            'action': self.action,
            'target_type': self.target_type,
            'target_id': self.target_id,
            'target_repr': self.target_repr,
            'metadata': self.metadata,
            'changes': self.changes,
            'ip_address': str(self.ip_address) if self.ip_address else '',
            'user_agent': self.user_agent,
            'request_id': str(self.request_id) if self.request_id else '',
            'timestamp': self.timestamp.isoformat()
        }, sort_keys=True)
        
        calculated_hash = hashlib.sha256(content.encode()).hexdigest()
        return calculated_hash == self.content_hash


# Prevent modifications to audit logs
def prevent_audit_modifications():
    """Create database rules to prevent audit log modifications."""
    from django.db import connection
    
    with connection.cursor() as cursor:
        # Rule to prevent updates
        cursor.execute("""
            CREATE OR REPLACE RULE audit_no_update AS 
            ON UPDATE TO audit_auditlog 
            DO INSTEAD NOTHING;
        """)
        
        # Rule to prevent deletions
        cursor.execute("""
            CREATE OR REPLACE RULE audit_no_delete AS 
            ON DELETE TO audit_auditlog 
            DO INSTEAD NOTHING;
        """)


class AuditLogManager(models.Manager):
    """Custom manager for audit logs with integrity checks."""
    
    def create_log(self, actor=None, action=None, target_type=None, target_id=None, 
                   target_repr=None, metadata=None, changes=None, ip_address=None, 
                   user_agent=None, request_id=None):
        """Create audit log entry with proper data capture."""
        
        # Capture actor information
        actor_email = ''
        actor_role = ''
        if actor:
            actor_email = actor.email
            actor_role = actor.role
        
        # Create audit log
        audit_log = self.create(
            actor=actor,
            actor_email=actor_email,
            actor_role=actor_role,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else '',
            target_repr=str(target_repr) if target_repr else '',
            metadata=metadata or {},
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent or '',
            request_id=request_id
        )
        
        return audit_log
    
    def verify_integrity_batch(self, queryset=None):
        """Verify integrity of multiple audit log entries."""
        if queryset is None:
            queryset = self.all()
        
        results = {
            'total': 0,
            'valid': 0,
            'invalid': 0,
            'invalid_entries': []
        }
        
        for log in queryset:
            results['total'] += 1
            if log.verify_integrity():
                results['valid'] += 1
            else:
                results['invalid'] += 1
                results['invalid_entries'].append({
                    'id': log.id,
                    'timestamp': log.timestamp,
                    'action': log.action,
                    'actor': log.actor_email
                })
        
        return results


# Attach custom manager
AuditLog.objects = AuditLogManager()


class AuditLogArchive(models.Model):
    """
    Archive table for old audit logs (for performance).
    """
    
    # Same fields as AuditLog but for archived entries
    original_id = models.BigIntegerField()
    actor_email = models.CharField(max_length=254, blank=True)
    actor_role = models.CharField(max_length=20, blank=True)
    action = models.CharField(max_length=30)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=50, blank=True)
    target_repr = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.UUIDField(null=True, blank=True)
    content_hash = models.CharField(max_length=64)
    timestamp = models.DateTimeField()
    archived_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_auditlog_archive'
        default_permissions = ('add', 'view')  # No change or delete
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['target_type', 'target_id']),
        ]

    def __str__(self):
        return f"Archived: {self.actor_email} {self.action} {self.target_type}#{self.target_id}"