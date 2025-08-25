"""
Serializers for user accounts and authentication.
"""
import pyotp
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from .models import User, UserSession
from .authentication import JWTTokenGenerator


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""
    
    class Meta:
        model = User
        fields = [
            'id', 'uuid', 'email', 'username', 'first_name', 'last_name', 
            'phone', 'role', 'status', 'email_verified', 'mfa_enabled',
            'last_login', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'uuid', 'role', 'status', 'email_verified', 'mfa_enabled',
            'last_login', 'created_at', 'updated_at'
        ]


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(max_length=6, required=False, allow_blank=True)
    remember_me = serializers.BooleanField(default=False)
    
    def validate(self, attrs):
        """Validate login credentials."""
        email = attrs.get('email')
        password = attrs.get('password')
        totp_code = attrs.get('totp_code')
        
        if not email or not password:
            raise ValidationError('Email and password are required.')
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        if not user:
            raise ValidationError('Invalid credentials.')
        
        # Check account status
        if user.status != User.Status.ACTIVE:
            if user.status == User.Status.PENDING_VALIDATION:
                raise ValidationError('Account is pending validation by an administrator.')
            elif user.status == User.Status.SUSPENDED:
                raise ValidationError('Account has been suspended.')
            else:
                raise ValidationError('Account is not active.')
        
        # Check if account is locked
        if user.is_locked:
            raise ValidationError('Account is temporarily locked due to multiple failed login attempts.')
        
        # Check 2FA if enabled
        if user.mfa_enabled:
            if not totp_code:
                raise ValidationError('2FA code is required.')
            
            # Verify TOTP code
            totp = pyotp.TOTP(user.mfa_secret)
            if not totp.verify(totp_code, valid_window=1):
                # Try backup codes
                if not user.use_backup_code(totp_code):
                    user.increment_failed_login()
                    raise ValidationError('Invalid 2FA code.')
        
        # Reset failed login attempts on successful login
        user.reset_failed_login()
        
        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True)
    terms_accepted = serializers.BooleanField(write_only=True)
    privacy_accepted = serializers.BooleanField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name', 'phone',
            'password', 'password_confirm', 'terms_accepted', 'privacy_accepted'
        ]
    
    def validate_email(self, value):
        """Validate email uniqueness."""
        if User.objects.filter(email=value).exists():
            raise ValidationError('A user with this email already exists.')
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness."""
        if User.objects.filter(username=value).exists():
            raise ValidationError('A user with this username already exists.')
        return value
    
    def validate(self, attrs):
        """Validate registration data."""
        # Check password confirmation
        if attrs['password'] != attrs['password_confirm']:
            raise ValidationError({'password_confirm': 'Passwords do not match.'})
        
        # Check terms acceptance
        if not attrs.get('terms_accepted'):
            raise ValidationError({'terms_accepted': 'You must accept the terms of service.'})
        
        if not attrs.get('privacy_accepted'):
            raise ValidationError({'privacy_accepted': 'You must accept the privacy policy.'})
        
        # Validate password
        try:
            validate_password(attrs['password'])
        except DjangoValidationError as e:
            raise ValidationError({'password': e.messages})
        
        return attrs
    
    def create(self, validated_data):
        """Create new user."""
        # Remove non-model fields
        validated_data.pop('password_confirm')
        validated_data.pop('terms_accepted')
        validated_data.pop('privacy_accepted')
        
        # Create user
        user = User.objects.create_user(**validated_data)
        
        # Generate email verification token
        user.generate_email_verification_token()
        
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=12)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        """Validate current password."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise ValidationError('Current password is incorrect.')
        return value
    
    def validate(self, attrs):
        """Validate password change data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise ValidationError({'new_password_confirm': 'Passwords do not match.'})
        
        # Validate new password
        try:
            validate_password(attrs['new_password'], user=self.context['request'].user)
        except DjangoValidationError as e:
            raise ValidationError({'new_password': e.messages})
        
        return attrs
    
    def save(self):
        """Change user password."""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        
        # Update password history
        import hashlib
        password_hash = hashlib.sha256(self.validated_data['new_password'].encode()).hexdigest()
        user.password_history.append(password_hash)
        if len(user.password_history) > 5:
            user.password_history = user.password_history[-5:]
        
        user.last_password_change = timezone.now()
        user.save(update_fields=['password', 'password_history', 'last_password_change'])


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password request."""
    
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists."""
        try:
            user = User.objects.get(email=value, status=User.Status.ACTIVE)
            self.user = user
        except User.DoesNotExist:
            # Don't reveal if email exists or not
            pass
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for password reset."""
    
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=12)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate password reset data."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise ValidationError({'new_password_confirm': 'Passwords do not match.'})
        
        # Find user by token
        try:
            user = User.objects.get(
                password_reset_token=attrs['token'],
                password_reset_expires__gt=timezone.now()
            )
            self.user = user
        except User.DoesNotExist:
            raise ValidationError({'token': 'Invalid or expired reset token.'})
        
        # Validate new password
        try:
            validate_password(attrs['new_password'], user=user)
        except DjangoValidationError as e:
            raise ValidationError({'new_password': e.messages})
        
        return attrs
    
    def save(self):
        """Reset user password."""
        return self.user.reset_password(
            self.validated_data['token'],
            self.validated_data['new_password']
        )


class MFASetupSerializer(serializers.Serializer):
    """Serializer for 2FA setup."""
    
    def to_representation(self, instance):
        """Generate 2FA setup data."""
        user = instance
        secret = user.generate_mfa_secret()
        
        # Generate QR code
        import qrcode
        import io
        import base64
        from django.conf import settings
        
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name=settings.TOTP_CONFIG['ISSUER_NAME']
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code = base64.b64encode(buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = user.generate_backup_codes()
        
        return {
            'secret': secret,
            'qr_code': f'data:image/png;base64,{qr_code}',
            'backup_codes': backup_codes,
        }


class MFAVerifySerializer(serializers.Serializer):
    """Serializer for 2FA verification."""
    
    totp_code = serializers.CharField(max_length=6)
    
    def validate_totp_code(self, value):
        """Verify TOTP code."""
        user = self.context['request'].user
        
        if not user.mfa_secret:
            raise ValidationError('2FA is not set up.')
        
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(value, valid_window=1):
            raise ValidationError('Invalid TOTP code.')
        
        return value
    
    def save(self):
        """Enable 2FA for user."""
        user = self.context['request'].user
        user.mfa_enabled = True
        user.save(update_fields=['mfa_enabled'])


class MFADisableSerializer(serializers.Serializer):
    """Serializer for 2FA disable."""
    
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(max_length=8, required=False, allow_blank=True)
    
    def validate(self, attrs):
        """Validate 2FA disable request."""
        user = self.context['request'].user
        
        # Verify password
        if not user.check_password(attrs['password']):
            raise ValidationError({'password': 'Incorrect password.'})
        
        # Verify TOTP code or backup code
        totp_code = attrs.get('totp_code')
        if totp_code:
            if len(totp_code) == 6:
                # TOTP code
                totp = pyotp.TOTP(user.mfa_secret)
                if not totp.verify(totp_code, valid_window=1):
                    raise ValidationError({'totp_code': 'Invalid TOTP code.'})
            else:
                # Backup code
                if not user.use_backup_code(totp_code):
                    raise ValidationError({'totp_code': 'Invalid backup code.'})
        else:
            raise ValidationError({'totp_code': 'TOTP code or backup code is required.'})
        
        return attrs
    
    def save(self):
        """Disable 2FA for user."""
        user = self.context['request'].user
        user.mfa_enabled = False
        user.mfa_secret = ''
        user.mfa_backup_codes = []
        user.save(update_fields=['mfa_enabled', 'mfa_secret', 'mfa_backup_codes'])


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions."""
    
    class Meta:
        model = UserSession
        fields = [
            'session_id', 'ip_address', 'user_agent', 'device_info',
            'created_at', 'last_activity', 'expires_at', 'is_active'
        ]
        read_only_fields = ['session_id', 'created_at']