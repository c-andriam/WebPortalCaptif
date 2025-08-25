"""
URL configuration for accounts app.
"""
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', views.RefreshTokenView.as_view(), name='refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('register/', views.RegisterView.as_view(), name='register'),
    
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Password management
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    
    # Email verification
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend_verification'),
    
    # 2FA
    path('2fa/setup/', views.MFASetupView.as_view(), name='mfa_setup'),
    path('2fa/verify/', views.MFAVerifyView.as_view(), name='mfa_verify'),
    path('2fa/disable/', views.MFADisableView.as_view(), name='mfa_disable'),
    path('2fa/backup-codes/', views.MFABackupCodesView.as_view(), name='mfa_backup_codes'),
    
    # Sessions
    path('sessions/', views.UserSessionsView.as_view(), name='user_sessions'),
    path('sessions/<uuid:session_id>/revoke/', views.RevokeSessionView.as_view(), name='revoke_session'),
]