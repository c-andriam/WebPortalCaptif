"""
Custom JWT authentication backend.
"""
import jwt
import hashlib
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import authentication, exceptions
from .models import UserSession

User = get_user_model()


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication with session tracking.
    """
    
    def authenticate(self, request):
        """Authenticate request using JWT token."""
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(
                token,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithms=[settings.JWT_CONFIG['ALGORITHM']]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        
        # Get user
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')
        
        # Check user status
        if user.status != User.Status.ACTIVE:
            raise exceptions.AuthenticationFailed('User account is not active')
        
        if user.is_locked:
            raise exceptions.AuthenticationFailed('User account is temporarily locked')
        
        # Validate session if session_id is present
        if 'session_id' in payload:
            try:
                session = UserSession.objects.get(
                    session_id=payload['session_id'],
                    user=user,
                    is_active=True
                )
                
                if session.is_expired:
                    session.revoke()
                    raise exceptions.AuthenticationFailed('Session has expired')
                
                # Update last activity
                session.last_activity = timezone.now()
                session.save(update_fields=['last_activity'])
                
            except UserSession.DoesNotExist:
                raise exceptions.AuthenticationFailed('Invalid session')
        
        return (user, token)


class JWTTokenGenerator:
    """
    JWT token generator with session management.
    """
    
    @staticmethod
    def generate_tokens(user, request=None):
        """Generate access and refresh tokens."""
        now = timezone.now()
        
        # Create session
        session = UserSession.objects.create(
            user=user,
            ip_address=JWTTokenGenerator._get_client_ip(request) if request else '127.0.0.1',
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
            expires_at=now + timedelta(seconds=settings.JWT_CONFIG['REFRESH_TOKEN_LIFETIME'])
        )
        
        # Access token payload
        access_payload = {
            'user_id': user.id,
            'session_id': str(session.session_id),
            'email': user.email,
            'role': user.role,
            'iat': now,
            'exp': now + timedelta(seconds=settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME']),
            'iss': settings.JWT_CONFIG['ISSUER'],
        }
        
        # Refresh token payload
        refresh_payload = {
            'user_id': user.id,
            'session_id': str(session.session_id),
            'type': 'refresh',
            'iat': now,
            'exp': now + timedelta(seconds=settings.JWT_CONFIG['REFRESH_TOKEN_LIFETIME']),
            'iss': settings.JWT_CONFIG['ISSUER'],
        }
        
        # Generate tokens
        access_token = jwt.encode(
            access_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )
        
        refresh_token = jwt.encode(
            refresh_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )
        
        # Store refresh token hash
        session.refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        session.save(update_fields=['refresh_token_hash'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'expires_in': settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'],
            'token_type': 'Bearer',
            'session_id': str(session.session_id),
        }
    
    @staticmethod
    def refresh_token(refresh_token):
        """Refresh access token."""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithms=[settings.JWT_CONFIG['ALGORITHM']]
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Refresh token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid refresh token')
        
        if payload.get('type') != 'refresh':
            raise exceptions.AuthenticationFailed('Invalid token type')
        
        # Get user and session
        try:
            user = User.objects.get(id=payload['user_id'])
            session = UserSession.objects.get(
                session_id=payload['session_id'],
                user=user,
                is_active=True
            )
        except (User.DoesNotExist, UserSession.DoesNotExist):
            raise exceptions.AuthenticationFailed('Invalid session')
        
        # Verify refresh token hash
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        if session.refresh_token_hash != token_hash:
            raise exceptions.AuthenticationFailed('Invalid refresh token')
        
        if session.is_expired:
            session.revoke()
            raise exceptions.AuthenticationFailed('Session has expired')
        
        # Generate new tokens
        now = timezone.now()
        
        # New access token
        access_payload = {
            'user_id': user.id,
            'session_id': str(session.session_id),
            'email': user.email,
            'role': user.role,
            'iat': now,
            'exp': now + timedelta(seconds=settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME']),
            'iss': settings.JWT_CONFIG['ISSUER'],
        }
        
        access_token = jwt.encode(
            access_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )
        
        # Optionally rotate refresh token
        new_refresh_token = None
        if settings.JWT_CONFIG.get('ROTATE_REFRESH_TOKENS', False):
            refresh_payload = {
                'user_id': user.id,
                'session_id': str(session.session_id),
                'type': 'refresh',
                'iat': now,
                'exp': now + timedelta(seconds=settings.JWT_CONFIG['REFRESH_TOKEN_LIFETIME']),
                'iss': settings.JWT_CONFIG['ISSUER'],
            }
            
            new_refresh_token = jwt.encode(
                refresh_payload,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithm=settings.JWT_CONFIG['ALGORITHM']
            )
            
            # Update session with new refresh token hash
            session.refresh_token_hash = hashlib.sha256(new_refresh_token.encode()).hexdigest()
            session.extend_session()
        else:
            # Just extend current session
            session.extend_session()
        
        return {
            'access_token': access_token,
            'refresh_token': new_refresh_token or refresh_token,
            'expires_in': settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'],
            'token_type': 'Bearer',
        }
    
    @staticmethod
    def revoke_token(refresh_token):
        """Revoke refresh token."""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithms=[settings.JWT_CONFIG['ALGORITHM']],
                options={'verify_exp': False}  # Allow expired tokens for revocation
            )
            
            session = UserSession.objects.get(
                session_id=payload['session_id'],
                is_active=True
            )
            session.revoke()
            
        except (jwt.InvalidTokenError, UserSession.DoesNotExist):
            pass  # Token already invalid or session doesn't exist
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip