"""
Middleware for automatic audit logging.
"""
import uuid
from django.utils import timezone
from django.urls import resolve
from .utils import create_audit_log, get_client_ip


class AuditMiddleware:
    """
    Middleware to automatically capture audit context and log sensitive actions.
    """
    
    # Actions that should be audited
    SENSITIVE_ACTIONS = {
        'POST': ['login', 'register', 'change-password', 'reset-password'],
        'PUT': ['profile', 'validate', 'suspend', 'reactivate'],
        'DELETE': ['users', 'vouchers', 'sessions'],
    }
    
    # Paths that should always be audited
    SENSITIVE_PATHS = [
        '/api/v1/auth/',
        '/api/v1/admin/',
        '/api/v1/config/',
        '/api/v1/portal/',
    ]
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add audit context to request
        request.audit_context = {
            'request_id': str(uuid.uuid4()),
            'ip_address': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'timestamp': timezone.now(),
            'method': request.method,
            'path': request.path,
        }
        
        # Process request
        response = self.get_response(request)
        
        # Log sensitive actions
        if self._should_audit_request(request, response):
            self._create_request_audit_log(request, response)
        
        return response
    
    def _should_audit_request(self, request, response):
        """Determine if request should be audited."""
        # Only audit successful requests (2xx status codes)
        if not (200 <= response.status_code < 300):
            return False
        
        # Check if path is sensitive
        for sensitive_path in self.SENSITIVE_PATHS:
            if request.path.startswith(sensitive_path):
                return True
        
        # Check if action is sensitive
        method = request.method
        if method in self.SENSITIVE_ACTIONS:
            try:
                url_name = resolve(request.path).url_name
                if url_name in self.SENSITIVE_ACTIONS[method]:
                    return True
            except:
                pass
        
        return False
    
    def _create_request_audit_log(self, request, response):
        """Create audit log for the request."""
        try:
            # Determine action based on URL and method
            action = self._determine_action(request)
            
            # Get target information
            target_type, target_id = self._extract_target_info(request)
            
            # Create metadata
            metadata = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'content_type': response.get('Content-Type', ''),
            }
            
            # Add request data for certain actions (be careful with sensitive data)
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Only log non-sensitive fields
                safe_data = self._extract_safe_request_data(request)
                if safe_data:
                    metadata['request_data'] = safe_data
            
            create_audit_log(
                actor=request.user if request.user.is_authenticated else None,
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata=metadata,
                ip_address=request.audit_context['ip_address'],
                user_agent=request.audit_context['user_agent'],
                request_id=request.audit_context['request_id']
            )
            
        except Exception as e:
            # Log the error but don't break the request
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to create audit log: {e}")
    
    def _determine_action(self, request):
        """Determine audit action based on request."""
        try:
            url_name = resolve(request.path).url_name
            method = request.method
            
            # Map URL names to audit actions
            action_mapping = {
                'login': 'LOGIN',
                'logout': 'LOGOUT',
                'register': 'CREATE',
                'change_password': 'PASSWORD_CHANGE',
                'reset_password': 'PASSWORD_RESET',
                'verify_email': 'EMAIL_VERIFY',
                'mfa_setup': 'MFA_ENABLE',
                'mfa_disable': 'MFA_DISABLE',
                'validate': 'VALIDATE',
                'suspend': 'SUSPEND',
                'reactivate': 'REACTIVATE',
            }
            
            if url_name in action_mapping:
                return action_mapping[url_name]
            
            # Default mapping based on HTTP method
            method_mapping = {
                'POST': 'CREATE',
                'PUT': 'UPDATE',
                'PATCH': 'UPDATE',
                'DELETE': 'DELETE',
            }
            
            return method_mapping.get(method, 'ACCESS')
            
        except:
            return 'ACCESS'
    
    def _extract_target_info(self, request):
        """Extract target type and ID from request."""
        try:
            # Try to extract from URL path
            path_parts = request.path.strip('/').split('/')
            
            # Look for API endpoints
            if len(path_parts) >= 3 and path_parts[0] == 'api':
                if len(path_parts) >= 4:
                    target_type = path_parts[3].title().rstrip('s')  # users -> User
                    
                    # Try to extract ID from path
                    if len(path_parts) >= 5:
                        target_id = path_parts[4]
                        return target_type, target_id
                    
                    return target_type, ''
            
            return 'Unknown', ''
            
        except:
            return 'Unknown', ''
    
    def _extract_safe_request_data(self, request):
        """Extract safe (non-sensitive) data from request."""
        try:
            # Fields that should never be logged
            sensitive_fields = {
                'password', 'password_confirm', 'current_password', 
                'new_password', 'token', 'secret', 'totp_code',
                'backup_code', 'mfa_secret'
            }
            
            safe_data = {}
            
            # Extract from POST data
            if hasattr(request, 'data') and request.data:
                for key, value in request.data.items():
                    if key.lower() not in sensitive_fields:
                        safe_data[key] = str(value)[:100]  # Limit length
            
            # Extract from GET parameters
            for key, value in request.GET.items():
                if key.lower() not in sensitive_fields:
                    safe_data[f"param_{key}"] = str(value)[:100]
            
            return safe_data
            
        except:
            return {}


class AuditContextMiddleware:
    """
    Middleware to add audit context to model operations.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Store request in thread-local storage for model access
        from threading import local
        if not hasattr(self, '_local'):
            self._local = local()
        
        self._local.request = request
        
        response = self.get_response(request)
        
        # Clean up
        if hasattr(self._local, 'request'):
            delattr(self._local, 'request')
        
        return response
    
    def get_current_request(self):
        """Get current request from thread-local storage."""
        if hasattr(self, '_local') and hasattr(self._local, 'request'):
            return self._local.request
        return None


# Global instance for accessing current request
audit_context_middleware = AuditContextMiddleware(lambda r: r)