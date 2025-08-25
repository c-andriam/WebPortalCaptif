from django.db import models
from django.conf import settings
import secrets
import string

class Device(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    mac_address = models.CharField(max_length=17, db_index=True)  # Format: AA:BB:CC:DD:EE:FF
    name = models.CharField(max_length=100)
    
    # Network info
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    
    # Status
    is_revoked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_device'
        unique_together = ['user', 'mac_address']
        indexes = [
            models.Index(fields=['mac_address']),
            models.Index(fields=['user', 'is_revoked']),
        ]

    def __str__(self):
        return f"{self.name} ({self.mac_address})"

class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        AUTHORIZED = 'AUTHORIZED', 'Authorized'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, null=True, blank=True)
    
    # Network identifiers
    mac_address = models.CharField(max_length=17)
    ip_address = models.GenericIPAddressField()
    
    # Session data
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Usage stats
    bytes_uploaded = models.BigIntegerField(default=0)
    bytes_downloaded = models.BigIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    
    # Session token for portal
    session_token = models.CharField(max_length=64, unique=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_session'
        indexes = [
            models.Index(fields=['mac_address', 'status']),
            models.Index(fields=['session_token']),
            models.Index(fields=['start_time', 'end_time']),
        ]

    def save(self, *args, **kwargs):
        if not self.session_token:
            self.session_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Session {self.mac_address} ({self.status})"

class Voucher(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        USED = 'USED', 'Used'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'

    code = models.CharField(max_length=8, unique=True)
    plan = models.ForeignKey('billing.Plan', on_delete=models.CASCADE)
    
    # Usage limits
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    
    # Validity
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    # Creation info
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_vouchers'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'access_voucher'
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['status', 'valid_from', 'valid_until']),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_code():
        """Generate unique 8-character alphanumeric code"""
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if not Voucher.objects.filter(code=code).exists():
                return code

    def __str__(self):
        return f"Voucher {self.code} ({self.status})"