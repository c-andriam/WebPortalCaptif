"""
Production settings for Captive Portal project.
"""
from .base import *
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

# Security
DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='captive.example.com').split(',')

# Security Headers
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# CSP (Content Security Policy)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "fonts.googleapis.com")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'", "fonts.gstatic.com")
CSP_CONNECT_SRC = ("'self'", "wss:")
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

# Database - Production optimizations
DATABASES['default'].update({
    'CONN_MAX_AGE': 600,
    'OPTIONS': {
        'sslmode': 'require',
        'connect_timeout': 10,
        'options': '-c default_transaction_isolation=read_committed'
    },
})

# Cache - Production Redis configuration
CACHES['default'].update({
    'OPTIONS': {
        'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        'PARSER_CLASS': 'redis.connection.HiredisParser',
        'CONNECTION_POOL_KWARGS': {
            'max_connections': 100,
            'retry_on_timeout': True,
        },
        'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        'IGNORE_EXCEPTIONS': True,
    }
})

# Email - Production SMTP
EMAIL_BACKEND = 'anymail.backends.amazon_ses.EmailBackend'
ANYMAIL = {
    'AMAZON_SES_REGION': config('AWS_SES_REGION', default='eu-west-1'),
    'AMAZON_SES_ACCESS_KEY_ID': config('AWS_ACCESS_KEY_ID', default=''),
    'AMAZON_SES_SECRET_ACCESS_KEY': config('AWS_SECRET_ACCESS_KEY', default=''),
}

# Logging - Production configuration
LOGGING.update({
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/captive-portal/django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/captive-portal/django-error.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'syslog': {
            'level': 'INFO',
            'class': 'logging.handlers.SysLogHandler',
            'address': '/dev/log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'error_file', 'syslog'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'captive_portal': {
            'handlers': ['file', 'error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['error_file', 'syslog'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
})

# Sentry Error Tracking
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=False,
            ),
            CeleryIntegration(
                monitor_beat_tasks=True,
                propagate_traces=True,
            ),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment=config('ENVIRONMENT', default='production'),
        release=config('RELEASE_VERSION', default='unknown'),
    )

# Celery - Production configuration
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Static files - Production storage
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = False

# Media files - Production storage (S3)
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='eu-west-1')
AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default='')
AWS_DEFAULT_ACL = 'private'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}

# Rate limiting - Strict in production
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].update({
    'anon': '50/hour',
    'user': '500/hour',
    'login': '3/5min',
    'register': '2/hour',
})

# Portal config - Strict in production
PORTAL_CONFIG.update({
    'MAX_LOGIN_ATTEMPTS': 3,
    'LOCKOUT_DURATION': 900,  # 15 minutes
})

# Health checks
HEALTH_CHECK = {
    'DISK_USAGE_MAX': 90,  # %
    'MEMORY_MIN': 100,     # MB
}