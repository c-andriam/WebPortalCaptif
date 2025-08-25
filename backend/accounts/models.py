from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from cryptography.fernet import Fernet
import secrets

class User(AbstractUser):
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

    email = models.EmailField(unique=True)
    phone = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(r'^\+?1?\d{9,15}$')]
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SUBSCRIBER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_VALIDATION)
    
    # MFA
    mfa_secret = models.CharField(max_length=200, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    
    # Metadata
    email_verified = models.BooleanField(default=False)
    last_password_change = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role', 'status']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(role__in=['SUPERADMIN', 'ADMIN', 'SUBSCRIBER', 'GUEST']),
                name='valid_role'
            )
        ]

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role in [self.Role.ADMIN, self.Role.SUPERADMIN]

    @property
    def is_superadmin(self):
        return self.role == self.Role.SUPERADMIN

    def generate_mfa_secret(self):
        """Generate and store encrypted MFA secret"""
        if not self.mfa_secret:
            secret = secrets.token_hex(32)
            # In production, use proper encryption with settings-based key
            key = Fernet.generate_key()
            f = Fernet(key)
            self.mfa_secret = f.encrypt(secret.encode()).decode()
            self.save()
        return self.mfa_secret