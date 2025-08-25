"""
Development settings for Captive Portal project.
"""
from .base import *

# Debug
DEBUG = True
ALLOWED_HOSTS = ['*']

# Database
DATABASES['default'].update({
    'NAME': 'captive_portal_dev',
    'OPTIONS': {
        'sslmode': 'disable',
    },
})

# CORS - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Email - Console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable security features in development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Django Extensions
INSTALLED_APPS += [
    'debug_toolbar',
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
] + MIDDLEWARE

# Debug Toolbar
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
}

# Logging - More verbose in development
LOGGING['loggers']['captive_portal']['level'] = 'DEBUG'
LOGGING['handlers']['console']['level'] = 'DEBUG'

# Celery - Eager execution in development
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Cache - Dummy cache for development
CACHES['default'] = {
    'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
}

# Rate limiting - Disabled in development
RATELIMIT_ENABLE = False

# Portal config - Relaxed for development
PORTAL_CONFIG.update({
    'MAX_LOGIN_ATTEMPTS': 100,
    'LOCKOUT_DURATION': 1,
})