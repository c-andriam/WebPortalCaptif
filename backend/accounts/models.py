"""
User accounts and authentication models.
"""
import uuid
import secrets
import hashlib
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
from django.conf import settings
from cryptography.fernet import Fernet


class User(AbstractUser):
    """Extended user model with role-based access control."""
    
    class Role(models.TextChoices):
        SUPERADMIN = 'SUPERADMIN', 'Super Administrator'
        ADMIN = 'ADMIN', 'Administrator'
        SUBSCRIBER = 'SUBSCRIBER', 'Subscriber'
        GUEST = 'GUEST', 'Guest'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PENDING_VALIDATION = 'PENDING_VALIDATION', 'Pending Validation'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        REVOKED = 'REVOKED', 'Revoked'

    # Core fields
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$', 'Invalid phone number format')]
    )
    
    # Role and status
    role = models.CharField(
        max_length=20, 
        choices=Role.choices, 
        default=Role.SUBSCRIBER
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.PENDING_VALIDATION
    )
    
    # 2FA and security
    mfa_secret = models.CharField(max_length=200, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_backup_codes = models.JSONField(default=list)
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True)
    email_verification_expires = models.DateTimeField(null=True, blank=True)
    
    # Password security
    password_history = models.JSONField(default=list)  # Last 5 password hashes
    last_password_change = models.DateTimeField(auto_now_add=True)
    password_reset_token = models.CharField(max_length=64, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    
    # Login security
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role', 'status']),
            models.Index(fields=['uuid']),
            models.Index(fields=['email_verification_token']),
            models.Index(fields=['password_reset_token']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(role__in=['SUPERADMIN', 'ADMIN', 'SUBSCRIBER', 'GUEST']),
                name='valid_role'
            ),
            models.CheckConstraint(
                check=models.Q(status__in=['ACTIVE', 'PENDING_VALIDATION', 'SUSPENDED', 'REVOKED']),
                name='valid_status'
            )
        ]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin(self):
        """Check if user has admin privileges."""
        return self.role in [self.Role.ADMIN, self.Role.SUPERADMIN]

    @property
    def is_superadmin(self):
        """Check if user is super administrator."""
        return self.role == self.Role.SUPERADMIN

    @property
    def is_locked(self):
        """Check if account is temporarily locked."""
        if self.locked_until:
            return timezone.now() < self.locked_until
        return False

    def generate_email_verification_token(self):
        """Generate email verification token."""
        self.email_verification_token = secrets.token_urlsafe(32)
        self.email_verification_expires = timezone.now() + timezone.timedelta(
            seconds=settings.PORTAL_CONFIG['EMAIL_VERIFICATION_TIMEOUT']
        )
        self.save(update_fields=['email_verification_token', 'email_verification_expires'])
        return self.email_verification_token

    def verify_email(self, token):
        """Verify email with token."""
        if (self.email_verification_token == token and 
            self.email_verification_expires and
            timezone.now() < self.email_verification_expires):
            self.email_verified = True
            self.email_verification_token = ''
            self.email_verification_expires = None
            self.save(update_fields=['email_verified', 'email_verification_token', 'email_verification_expires'])
            return True
        return False

    def generate_password_reset_token(self):
        """Generate password reset token."""
        self.password_reset_token = secrets.token_urlsafe(32)
        self.password_reset_expires = timezone.now() + timezone.timedelta(
            seconds=settings.PORTAL_CONFIG['PASSWORD_RESET_TIMEOUT']
        )
        self.save(update_fields=['password_reset_token', 'password_reset_expires'])
        return self.password_reset_token

    def reset_password(self, token, new_password):
        """Reset password with token."""
        if (self.password_reset_token == token and 
            self.password_reset_expires and
            timezone.now() < self.password_reset_expires):
            
            # Check password history
            password_hash = hashlib.sha256(new_password.encode()).hexdigest()
            if password_hash in self.password_history:
                raise ValueError("Cannot reuse recent passwords")
            
            # Update password
            self.set_password(new_password)
            
            # Update password history
            self.password_history.append(password_hash)
            if len(self.password_history) > 5:
                self.password_history = self.password_history[-5:]
            
            # Clear reset token
            self.password_reset_token = ''
            self.password_reset_expires = None
            self.last_password_change = timezone.now()
            
            self.save(update_fields=[
                'password', 'password_history', 'password_reset_token', 
                'password_reset_expires', 'last_password_change'
            ])
            return True
        return False

    def generate_mfa_secret(self):
        """Generate and store encrypted MFA secret."""
        if not self.mfa_secret:
            secret = secrets.token_hex(32)
            # In production, use proper encryption with settings-based key
            key = Fernet.generate_key()
            f = Fernet(key)
            self.mfa_secret = f.encrypt(secret.encode()).decode()
            self.save(update_fields=['mfa_secret'])
        return self.mfa_secret

    def generate_backup_codes(self):
        """Generate MFA backup codes."""
        codes = [secrets.token_hex(4).upper() for _ in range(settings.TOTP_CONFIG['BACKUP_CODES_COUNT'])]
        # Hash codes before storing
        self.mfa_backup_codes = [hashlib.sha256(code.encode()).hexdigest() for code in codes]
        self.save(update_fields=['mfa_backup_codes'])
        return codes  # Return unhashed codes for display

    def use_backup_code(self, code):
        """Use MFA backup code."""
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        if code_hash in self.mfa_backup_codes:
            self.mfa_backup_codes.remove(code_hash)
            self.save(update_fields=['mfa_backup_codes'])
            return True
        return False

    def lock_account(self, duration_seconds=None):
        """Lock account temporarily."""
        if duration_seconds is None:
            duration_seconds = settings.PORTAL_CONFIG['LOCKOUT_DURATION']
        
        self.locked_until = timezone.now() + timezone.timedelta(seconds=duration_seconds)
        self.save(update_fields=['locked_until'])

    def unlock_account(self):
        """Unlock account."""
        self.locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['locked_until', 'failed_login_attempts'])

    def increment_failed_login(self):
        """Increment failed login attempts."""
        self.failed_login_attempts += 1
        
        # Lock account after max attempts
        if self.failed_login_attempts >= settings.PORTAL_CONFIG['MAX_LOGIN_ATTEMPTS']:
            self.lock_account()
        
        self.save(update_fields=['failed_login_attempts'])

    def reset_failed_login(self):
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])


class UserSession(models.Model):
    """User session tracking for JWT tokens."""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    refresh_token_hash = models.CharField(max_length=64)
    
    # Session info
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    device_info = models.JSONField(default=dict)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    # Status
    is_active = models.BooleanField(default=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'accounts_user_session'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_id']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Session {self.session_id} for {self.user.email}"

    def revoke(self):
        """Revoke session."""
        self.is_active = False
        self.revoked_at = timezone.now()
        self.save(update_fields=['is_active', 'revoked_at'])

    @property
    def is_expired(self):
        """Check if session is expired."""
        return timezone.now() > self.expires_at

    def extend_session(self, duration_seconds=None):
        """Extend session expiration."""
        if duration_seconds is None:
            duration_seconds = settings.JWT_CONFIG['REFRESH_TOKEN_LIFETIME']
        
        self.expires_at = timezone.now() + timezone.timedelta(seconds=duration_seconds)
        self.last_activity = timezone.now()
        self.save(update_fields=['expires_at', 'last_activity'])