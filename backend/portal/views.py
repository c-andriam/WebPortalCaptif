from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta

@api_view(['POST'])
@permission_classes([AllowAny])
def authorize(request):
    """
    Captive portal authorization endpoint
    Expected from OpenNDS/CoovaChilli
    """
    mac = request.data.get('mac')
    ip = request.data.get('ip')
    url = request.data.get('url', '')
    
    if not mac or not ip:
        return Response({'error': 'MAC and IP required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if device has active session
    # This is a simplified version - full implementation would check quotas, etc.
    
    return Response({
        'status': 'DENY',  # or 'ALLOW'
        'redirect_url': f'/portal/login?mac={mac}&ip={ip}&url={url}',
        'ttl': 3600  # 1 hour
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def portal_login(request):
    """Handle captive portal login"""
    mac = request.data.get('mac')
    ip = request.data.get('ip')
    code = request.data.get('code')  # voucher code
    
    if not mac or not ip:
        return Response({'error': 'MAC and IP required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if code:
        # Voucher-based access
        # Implementation would validate voucher and create session
        pass
    
    return Response({
        'status': 'success',
        'message': 'Access granted',
        'redirect_url': request.data.get('url', '/')
    })