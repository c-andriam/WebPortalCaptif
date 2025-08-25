from django.db import models
from django.conf import settings

class SystemConfig(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    
    # Change tracking
    last_modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    last_modified_at = models.DateTimeField(auto_now=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'portal_systemconfig'

    def __str__(self):
        return f"{self.key}: {self.value[:50]}"

class CaptiveBinding(models.Model):
    class Source(models.TextChoices):
        OPENNDS = 'OPENNDS', 'OpenNDS'
        COOVACHILLI = 'COOVACHILLI', 'CoovaChilli'
        MANUAL = 'MANUAL', 'Manual'

    mac_address = models.CharField(max_length=17)
    ip_address = models.GenericIPAddressField()
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session = models.ForeignKey('access.Session', on_delete=models.CASCADE, null=True, blank=True)
    
    # Authorization details
    authorized_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    
    # Redirect URL after auth
    redirect_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'portal_captivebinding'
        indexes = [
            models.Index(fields=['mac_address', 'authorized_at']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"{self.mac_address} -> {self.ip_address}"