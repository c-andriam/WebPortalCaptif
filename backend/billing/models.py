from django.db import models
from django.conf import settings
from decimal import Decimal

class Plan(models.Model):
    class PlanType(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly Subscription'
        WEEKLY = 'WEEKLY', 'Weekly Subscription'
        TEMPORARY = 'TEMPORARY', 'Temporary Access'

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    plan_type = models.CharField(max_length=20, choices=PlanType.choices)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='EUR')
    
    # Quotas
    max_devices = models.PositiveIntegerField(default=1)
    data_quota_gb = models.PositiveIntegerField(default=1)  # in GB
    time_quota_hours = models.PositiveIntegerField(default=24)  # in hours
    
    # Status
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)  # visible to users
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_plan'
        ordering = ['plan_type', 'price']

    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()})"

class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Validation'
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        CANCELLED = 'CANCELLED', 'Cancelled'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    
    # Dates
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Billing
    auto_renew = models.BooleanField(default=False)
    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='validated_subscriptions'
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'billing_subscription'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"