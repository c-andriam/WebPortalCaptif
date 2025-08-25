"""
Custom password validators for enhanced security.
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class CustomPasswordValidator:
    """
    Custom password validator with enhanced security requirements.
    """
    
    def validate(self, password, user=None):
        """Validate password against security requirements."""
        errors = []
        
        # Check for at least one uppercase letter
        if not re.search(r'[A-Z]', password):
            errors.append(_('Password must contain at least one uppercase letter.'))
        
        # Check for at least one lowercase letter
        if not re.search(r'[a-z]', password):
            errors.append(_('Password must contain at least one lowercase letter.'))
        
        # Check for at least one digit
        if not re.search(r'\d', password):
            errors.append(_('Password must contain at least one digit.'))
        
        # Check for at least one special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append(_('Password must contain at least one special character.'))
        
        # Check for common patterns
        if re.search(r'(.)\1{2,}', password):
            errors.append(_('Password cannot contain repeated characters.'))
        
        # Check for sequential characters
        if self._has_sequential_chars(password):
            errors.append(_('Password cannot contain sequential characters.'))
        
        # Check against user information if provided
        if user:
            user_info = [
                user.email.split('@')[0] if user.email else '',
                user.first_name,
                user.last_name,
                user.username,
            ]
            
            for info in user_info:
                if info and len(info) > 2 and info.lower() in password.lower():
                    errors.append(_('Password cannot contain personal information.'))
                    break
        
        if errors:
            raise ValidationError(errors)
    
    def _has_sequential_chars(self, password):
        """Check for sequential characters (abc, 123, etc.)."""
        password_lower = password.lower()
        
        # Check for sequential letters
        for i in range(len(password_lower) - 2):
            if (ord(password_lower[i+1]) == ord(password_lower[i]) + 1 and
                ord(password_lower[i+2]) == ord(password_lower[i]) + 2):
                return True
        
        # Check for sequential numbers
        for i in range(len(password) - 2):
            if (password[i:i+3].isdigit() and
                int(password[i+1]) == int(password[i]) + 1 and
                int(password[i+2]) == int(password[i]) + 2):
                return True
        
        return False
    
    def get_help_text(self):
        """Return help text for password requirements."""
        return _(
            "Your password must contain at least one uppercase letter, "
            "one lowercase letter, one digit, and one special character. "
            "It cannot contain repeated or sequential characters, or "
            "personal information."
        )


class PasswordHistoryValidator:
    """
    Validator to prevent password reuse.
    """
    
    def __init__(self, history_count=5):
        self.history_count = history_count
    
    def validate(self, password, user=None):
        """Check password against history."""
        if user and hasattr(user, 'password_history'):
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if password_hash in user.password_history:
                raise ValidationError(
                    _('You cannot reuse any of your last %(count)d passwords.') % {
                        'count': self.history_count
                    }
                )
    
    def get_help_text(self):
        """Return help text."""
        return _(
            "Your password cannot be the same as any of your last "
            "%(count)d passwords."
        ) % {'count': self.history_count}