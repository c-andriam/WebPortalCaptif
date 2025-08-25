"""
Views for user accounts and authentication.
"""
from django.contrib.auth import login, logout
from django.utils import timezone
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import User, UserSession
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    MFASetupSerializer, MFAVerifySerializer, MFADisableSerializer,
    UserSessionSerializer
)
from .authentication import JWTTokenGenerator
from audit.utils import create_audit_log


class LoginView(APIView):
    """User login with JWT token generation."""
    
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='5/5m', method='POST'))
    def post(self, request):
        """Authenticate user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            tokens = JWTTokenGenerator.generate_tokens(user, request)
            
            # Update last login
            user.last_login = timezone.now()
            user.last_login_ip = self._get_client_ip(request)
            user.save(update_fields=['last_login', 'last_login_ip'])
            
            # Create audit log
            create_audit_log(
                actor=user,
                action='LOGIN',
                target_type='User',
                target_id=str(user.id),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'login_method': 'email_password'}
            )
            
            return Response({
                **tokens,
                'user': UserSerializer(user).data,
                'message': 'Login successful'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RefreshTokenView(APIView):
    """Refresh JWT access token."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Refresh access token using refresh token."""
        refresh_token = request.data.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tokens = JWTTokenGenerator.refresh_token(refresh_token)
            return Response(tokens)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    """User logout with token revocation."""
    
    def post(self, request):
        """Logout user and revoke tokens."""
        refresh_token = request.data.get('refresh_token')
        all_devices = request.data.get('all_devices', False)
        
        if all_devices:
            # Revoke all user sessions
            UserSession.objects.filter(user=request.user, is_active=True).update(
                is_active=False,
                revoked_at=timezone.now()
            )
        elif refresh_token:
            # Revoke specific token
            JWTTokenGenerator.revoke_token(refresh_token)
        
        # Create audit log
        create_audit_log(
            actor=request.user,
            action='LOGOUT',
            target_type='User',
            target_id=str(request.user.id),
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'all_devices': all_devices}
        )
        
        return Response({'message': 'Logout successful'}, status=status.HTTP_204_NO_CONTENT)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RegisterView(APIView):
    """User registration."""
    
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='3/1h', method='POST'))
    def post(self, request):
        """Register new user."""
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            create_audit_log(
                actor=None,
                action='CREATE',
                target_type='User',
                target_id=str(user.id),
                target_repr=user.email,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'registration_method': 'email'}
            )
            
            return Response({
                'user': UserSerializer(user).data,
                'message': 'Registration successful. Please verify your email and wait for admin validation.'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ProfileView(APIView):
    """User profile management."""
    
    def get(self, request):
        """Get user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        """Update user profile."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            create_audit_log(
                actor=request.user,
                action='UPDATE',
                target_type='User',
                target_id=str(user.id),
                target_repr=user.email,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'updated_fields': list(serializer.validated_data.keys())}
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ChangePasswordView(APIView):
    """Change user password."""
    
    def post(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            create_audit_log(
                actor=request.user,
                action='PASSWORD_CHANGE',
                target_type='User',
                target_id=str(request.user.id),
                target_repr=request.user.email,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Password changed successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ForgotPasswordView(APIView):
    """Forgot password request."""
    
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='3/1h', method='POST'))
    def post(self, request):
        """Send password reset email."""
        serializer = ForgotPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Always return success to prevent email enumeration
            if hasattr(serializer, 'user'):
                user = serializer.user
                token = user.generate_password_reset_token()
                
                # TODO: Send password reset email
                # send_password_reset_email(user, token)
                
                # Create audit log
                create_audit_log(
                    actor=None,
                    action='PASSWORD_RESET_REQUEST',
                    target_type='User',
                    target_id=str(user.id),
                    target_repr=user.email,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
            
            return Response({
                'message': 'If the email exists, a password reset link has been sent.'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ResetPasswordView(APIView):
    """Reset password with token."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Reset password using token."""
        serializer = ResetPasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            success = serializer.save()
            
            if success:
                # Create audit log
                create_audit_log(
                    actor=None,
                    action='PASSWORD_RESET',
                    target_type='User',
                    target_id=str(serializer.user.id),
                    target_repr=serializer.user.email,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({'message': 'Password reset successfully'})
            else:
                return Response(
                    {'error': 'Invalid or expired reset token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class VerifyEmailView(APIView):
    """Verify email address."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Verify email with token."""
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Verification token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email_verification_token=token)
            success = user.verify_email(token)
            
            if success:
                # Create audit log
                create_audit_log(
                    actor=user,
                    action='EMAIL_VERIFY',
                    target_type='User',
                    target_id=str(user.id),
                    target_repr=user.email,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', '')
                )
                
                return Response({'message': 'Email verified successfully'})
            else:
                return Response(
                    {'error': 'Invalid or expired verification token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid verification token'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ResendVerificationView(APIView):
    """Resend email verification."""
    
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='3/1h', method='POST'))
    def post(self, request):
        """Resend email verification."""
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email, email_verified=False)
            token = user.generate_email_verification_token()
            
            # TODO: Send verification email
            # send_verification_email(user, token)
            
            return Response({
                'message': 'Verification email sent successfully'
            })
        except User.DoesNotExist:
            # Don't reveal if email exists
            return Response({
                'message': 'If the email exists and is not verified, a verification email has been sent.'
            })


# 2FA Views
class MFASetupView(APIView):
    """Setup 2FA for user."""
    
    def post(self, request):
        """Generate 2FA setup data."""
        serializer = MFASetupSerializer(request.user)
        return Response(serializer.data)


class MFAVerifyView(APIView):
    """Verify and enable 2FA."""
    
    def post(self, request):
        """Verify TOTP code and enable 2FA."""
        serializer = MFAVerifySerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            create_audit_log(
                actor=request.user,
                action='MFA_ENABLE',
                target_type='User',
                target_id=str(request.user.id),
                target_repr=request.user.email,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': '2FA enabled successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MFADisableView(APIView):
    """Disable 2FA for user."""
    
    def post(self, request):
        """Disable 2FA."""
        serializer = MFADisableSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            create_audit_log(
                actor=request.user,
                action='MFA_DISABLE',
                target_type='User',
                target_id=str(request.user.id),
                target_repr=request.user.email,
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': '2FA disabled successfully'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class MFABackupCodesView(APIView):
    """Get new backup codes."""
    
    def get(self, request):
        """Generate new backup codes."""
        if not request.user.mfa_enabled:
            return Response(
                {'error': '2FA is not enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        backup_codes = request.user.generate_backup_codes()
        
        # Create audit log
        create_audit_log(
            actor=request.user,
            action='MFA_BACKUP_CODES_REGENERATE',
            target_type='User',
            target_id=str(request.user.id),
            target_repr=request.user.email,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({'backup_codes': backup_codes})
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserSessionsView(generics.ListAPIView):
    """List user sessions."""
    
    serializer_class = UserSessionSerializer
    
    def get_queryset(self):
        """Get user's active sessions."""
        return UserSession.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-last_activity')


class RevokeSessionView(APIView):
    """Revoke specific session."""
    
    def post(self, request, session_id):
        """Revoke session by ID."""
        try:
            session = UserSession.objects.get(
                session_id=session_id,
                user=request.user,
                is_active=True
            )
            session.revoke()
            
            # Create audit log
            create_audit_log(
                actor=request.user,
                action='SESSION_REVOKE',
                target_type='UserSession',
                target_id=str(session.session_id),
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'revoked_session_ip': session.ip_address}
            )
            
            return Response({'message': 'Session revoked successfully'})
        except UserSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_client_ip(self, request):
        """Get client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip