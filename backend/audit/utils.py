"""
Utility functions for audit logging.
"""
import uuid
from django.utils import timezone
from .models import AuditLog


def create_audit_log(actor=None, action=None, target_type=None, target_id=None,
                     target_repr=None, metadata=None, changes=None, ip_address=None,
                     user_agent=None, request_id=None):
    """
    Create an audit log entry.
    
    Args:
        actor: User who performed the action (can be None for system actions)
        action: Action performed (from AuditLog.Action choices)
        target_type: Type of object affected (model name)
        target_id: ID of the affected object
        target_repr: String representation of the affected object
        metadata: Additional metadata about the action
        changes: Before/after changes for update actions
        ip_address: IP address of the request
        user_agent: User agent string
        request_id: Unique request identifier
    
    Returns:
        AuditLog: Created audit log entry
    """
    return AuditLog.objects.create_log(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_repr=target_repr,
        metadata=metadata,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id or uuid.uuid4()
    )


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def audit_model_changes(instance, action, actor=None, request=None, metadata=None):
    """
    Audit model changes with before/after comparison.
    
    Args:
        instance: Model instance being changed
        action: Action being performed ('CREATE', 'UPDATE', 'DELETE')
        actor: User performing the action
        request: HTTP request object
        metadata: Additional metadata
    """
    changes = {}
    
    if action == 'UPDATE' and hasattr(instance, '_original_values'):
        # Compare original values with current values
        for field in instance._meta.fields:
            field_name = field.name
            if field_name in instance._original_values:
                old_value = instance._original_values[field_name]
                new_value = getattr(instance, field_name)
                
                if old_value != new_value:
                    changes[field_name] = {
                        'before': str(old_value) if old_value is not None else None,
                        'after': str(new_value) if new_value is not None else None
                    }
    
    # Extract request information
    ip_address = None
    user_agent = None
    request_id = None
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        request_id = getattr(request, 'audit_context', {}).get('request_id')
    
    return create_audit_log(
        actor=actor,
        action=action,
        target_type=instance.__class__.__name__,
        target_id=str(instance.pk) if instance.pk else '',
        target_repr=str(instance),
        metadata=metadata or {},
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id
    )


class AuditMixin:
    """
    Mixin to add audit logging to model operations.
    """
    
    def save(self, *args, **kwargs):
        """Override save to capture changes."""
        is_new = self.pk is None
        
        # Capture original values for updates
        if not is_new:
            original = self.__class__.objects.get(pk=self.pk)
            self._original_values = {}
            for field in self._meta.fields:
                self._original_values[field.name] = getattr(original, field.name)
        
        # Save the instance
        super().save(*args, **kwargs)
        
        # Create audit log
        action = 'CREATE' if is_new else 'UPDATE'
        audit_model_changes(
            instance=self,
            action=action,
            actor=getattr(self, '_audit_actor', None),
            request=getattr(self, '_audit_request', None),
            metadata=getattr(self, '_audit_metadata', None)
        )
    
    def delete(self, *args, **kwargs):
        """Override delete to create audit log."""
        # Create audit log before deletion
        audit_model_changes(
            instance=self,
            action='DELETE',
            actor=getattr(self, '_audit_actor', None),
            request=getattr(self, '_audit_request', None),
            metadata=getattr(self, '_audit_metadata', None)
        )
        
        # Delete the instance
        super().delete(*args, **kwargs)
    
    def set_audit_context(self, actor=None, request=None, metadata=None):
        """Set audit context for the next operation."""
        self._audit_actor = actor
        self._audit_request = request
        self._audit_metadata = metadata


def audit_login_attempt(user, success, ip_address=None, user_agent=None, 
                       metadata=None, request_id=None):
    """
    Audit login attempts (both successful and failed).
    
    Args:
        user: User attempting to login (can be None for failed attempts)
        success: Boolean indicating if login was successful
        ip_address: IP address of the attempt
        user_agent: User agent string
        metadata: Additional metadata (e.g., failure reason)
        request_id: Unique request identifier
    """
    action = 'LOGIN' if success else 'LOGIN_FAILED'
    
    return create_audit_log(
        actor=user if success else None,
        action=action,
        target_type='User',
        target_id=str(user.id) if user else '',
        target_repr=user.email if user else metadata.get('attempted_email', ''),
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent,
        request_id=request_id
    )


def audit_session_activity(session, action, actor=None, metadata=None):
    """
    Audit session-related activities.
    
    Args:
        session: Session object
        action: Action performed ('SESSION_START', 'SESSION_END', etc.)
        actor: User performing the action
        metadata: Additional metadata
    """
    return create_audit_log(
        actor=actor or session.user,
        action=action,
        target_type='Session',
        target_id=str(session.id),
        target_repr=f"Session {session.mac_address}",
        metadata=metadata or {},
        ip_address=session.ip_address
    )


def audit_quota_violation(user, quota_type, usage, limit, session=None):
    """
    Audit quota violations.
    
    Args:
        user: User who exceeded quota
        quota_type: Type of quota ('data', 'time', 'devices')
        usage: Current usage
        limit: Quota limit
        session: Related session (if applicable)
    """
    metadata = {
        'quota_type': quota_type,
        'usage': usage,
        'limit': limit,
        'usage_percent': (usage / limit * 100) if limit > 0 else 0
    }
    
    if session:
        metadata['session_id'] = str(session.id)
        metadata['mac_address'] = session.mac_address
    
    return create_audit_log(
        actor=user,
        action='QUOTA_EXCEEDED',
        target_type='User',
        target_id=str(user.id),
        target_repr=user.email,
        metadata=metadata
    )


def audit_admin_action(admin_user, action, target_user, metadata=None, 
                      ip_address=None, user_agent=None):
    """
    Audit administrative actions on users.
    
    Args:
        admin_user: Administrator performing the action
        action: Action performed ('VALIDATE', 'SUSPEND', etc.)
        target_user: User being acted upon
        metadata: Additional metadata (e.g., reason)
        ip_address: IP address of the admin
        user_agent: User agent string
    """
    return create_audit_log(
        actor=admin_user,
        action=action,
        target_type='User',
        target_id=str(target_user.id),
        target_repr=target_user.email,
        metadata=metadata or {},
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_config_change(admin_user, config_key, old_value, new_value, 
                       ip_address=None, user_agent=None, reason=None):
    """
    Audit system configuration changes.
    
    Args:
        admin_user: Administrator making the change
        config_key: Configuration key being changed
        old_value: Previous value
        new_value: New value
        ip_address: IP address of the admin
        user_agent: User agent string
        reason: Reason for the change
    """
    changes = {
        config_key: {
            'before': str(old_value) if old_value is not None else None,
            'after': str(new_value) if new_value is not None else None
        }
    }
    
    metadata = {'config_key': config_key}
    if reason:
        metadata['reason'] = reason
    
    return create_audit_log(
        actor=admin_user,
        action='CONFIG_CHANGE',
        target_type='SystemConfig',
        target_id=config_key,
        target_repr=f"Config: {config_key}",
        metadata=metadata,
        changes=changes,
        ip_address=ip_address,
        user_agent=user_agent
    )