# Architecture Complète - Plateforme Portail Captif Entreprise

## 1. Vue d'ensemble Architecture

### 1.1 Stack Technique Complet
```
Backend:
- Python 3.12 + Django 5.0 + DRF 3.14
- PostgreSQL 15+ (données principales)
- Redis 7+ (cache, sessions, queues)
- Celery 5+ (tâches asynchrones)
- SMTP/SES (emails) + SMS abstraction
- OpenTelemetry (observabilité)

Frontend:
- React 18 + TypeScript 5
- Vite 5 (build tool)
- TailwindCSS 3.4 (GitHub theme dark)
- shadcn/ui + lucide-react
- JetBrains Nerd Font
- React Query + Zod validation
- i18next (FR/EN)
- WCAG 2.1 AA compliance

Infrastructure:
- Docker + Kubernetes
- Nginx (reverse proxy + rate limiting)
- Prometheus + Grafana + OpenTelemetry
- CI/CD GitHub Actions
```

### 1.2 Architecture Microservices
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Auth Service  │
│   React SPA     │◄──►│   Nginx/Django  │◄──►│   JWT + 2FA     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Portal API   │ │ Admin API   │ │ Audit API  │
        │ Captive      │ │ Management  │ │ Logs       │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼───────────────▼───────────────▼──────┐
        │           PostgreSQL Cluster                 │
        │     Users | Plans | Sessions | Audit         │
        └────────────────────────────────────────────────┘
                │
        ┌───────▼──────┐    ┌─────────────┐
        │ Redis Cache  │    │ Celery      │
        │ Sessions     │    │ Background  │
        └──────────────┘    └─────────────┘
```

## 2. Modèles de Données Détaillés

### 2.1 Utilisateurs et Authentification
```python
# accounts/models.py
class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = 'SUPERADMIN', 'Super Administrator'
        ADMIN = 'ADMIN', 'Administrator'
        SUBSCRIBER = 'SUBSCRIBER', 'Subscriber'
        GUEST = 'GUEST', 'Guest'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        PENDING_VALIDATION = 'PENDING_VALIDATION', 'Pending Validation'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        REVOKED = 'REVOKED', 'Revoked'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.SUBSCRIBER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_VALIDATION)
    
    # 2FA et sécurité
    mfa_secret = models.CharField(max_length=200, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_backup_codes = models.JSONField(default=list)
    
    # Vérifications
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True)
    
    # Sécurité mot de passe
    password_history = models.JSONField(default=list)  # 5 derniers hashs
    last_password_change = models.DateTimeField(auto_now_add=True)
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(role__in=['SUPERADMIN', 'ADMIN', 'SUBSCRIBER', 'GUEST']),
                name='valid_role'
            )
        ]
```

### 2.2 Plans et Abonnements
```python
# billing/models.py
class Plan(models.Model):
    class PlanType(models.TextChoices):
        MONTHLY = 'MONTHLY', 'Monthly Subscription'
        WEEKLY = 'WEEKLY', 'Weekly Subscription'
        TEMPORARY = 'TEMPORARY', 'Temporary Access'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    plan_type = models.CharField(max_length=20, choices=PlanType.choices)
    
    # Tarification
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='EUR')
    
    # Quotas
    max_devices = models.PositiveIntegerField(default=1)
    data_quota_gb = models.PositiveIntegerField(default=1)
    time_quota_hours = models.PositiveIntegerField(default=24)
    max_concurrent_sessions = models.PositiveIntegerField(default=1)
    
    # QoS
    bandwidth_limit_kbps = models.PositiveIntegerField(null=True, blank=True)
    allowed_hours = models.JSONField(default=dict)  # {"start": "00:00", "end": "23:59"}
    allowed_days = models.JSONField(default=list)   # [1,2,3,4,5,6,7]
    
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Validation'
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        SUSPENDED = 'SUSPENDED', 'Suspended'
        CANCELLED = 'CANCELLED', 'Cancelled'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    auto_renew = models.BooleanField(default=False)
    
    # Validation administrative
    validated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='validated_subscriptions')
    validated_at = models.DateTimeField(null=True, blank=True)
    validation_notes = models.TextField(blank=True)
    
    # Usage actuel (cache)
    current_data_usage_gb = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    current_time_usage_hours = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    current_device_count = models.PositiveIntegerField(default=0)
    last_usage_update = models.DateTimeField(auto_now=True)
```

### 2.3 Accès et Sessions
```python
# access/models.py
class Device(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    mac_address = models.CharField(max_length=17, db_index=True)
    name = models.CharField(max_length=100)
    device_type = models.CharField(max_length=50, default='unknown')
    
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    last_seen = models.DateTimeField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='revoked_devices')
    
    # Statistiques
    total_sessions = models.PositiveIntegerField(default=0)
    total_data_gb = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    total_time_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ['user', 'mac_address']

class Session(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        AUTHORIZED = 'AUTHORIZED', 'Authorized'
        ACTIVE = 'ACTIVE', 'Active'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'
        TERMINATED = 'TERMINATED', 'Terminated'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, null=True, blank=True)
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True)
    
    mac_address = models.CharField(max_length=17)
    ip_address = models.GenericIPAddressField()
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Usage
    bytes_uploaded = models.BigIntegerField(default=0)
    bytes_downloaded = models.BigIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    
    # Quotas snapshot
    allocated_data_gb = models.PositiveIntegerField(null=True, blank=True)
    allocated_time_hours = models.PositiveIntegerField(null=True, blank=True)
    
    # Token et portail
    session_token = models.CharField(max_length=64, unique=True, blank=True)
    portal_session_id = models.CharField(max_length=100, blank=True)
    portal_type = models.CharField(max_length=20, default='MANUAL')
    
    # Terminaison
    termination_reason = models.CharField(max_length=50, blank=True)
    terminated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='terminated_sessions')

class Voucher(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        USED = 'USED', 'Used'
        EXPIRED = 'EXPIRED', 'Expired'
        REVOKED = 'REVOKED', 'Revoked'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    code = models.CharField(max_length=8, unique=True)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    
    max_uses = models.PositiveIntegerField(default=1)
    used_count = models.PositiveIntegerField(default=0)
    
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_vouchers')
    
    first_used_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    @staticmethod
    def generate_code():
        import secrets, string
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            if not Voucher.objects.filter(code=code).exists():
                return code
```

### 2.4 Audit et Notifications
```python
# audit/models.py
class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        LOGIN_FAILED = 'LOGIN_FAILED', 'Login Failed'
        VALIDATE = 'VALIDATE', 'Validate'
        REVOKE = 'REVOKE', 'Revoke'
        SUSPEND = 'SUSPEND', 'Suspend'
        CONFIG_CHANGE = 'CONFIG_CHANGE', 'Configuration Change'
        PASSWORD_CHANGE = 'PASSWORD_CHANGE', 'Password Change'
        MFA_ENABLE = 'MFA_ENABLE', '2FA Enable'
        MFA_DISABLE = 'MFA_DISABLE', '2FA Disable'
        SESSION_START = 'SESSION_START', 'Session Start'
        SESSION_END = 'SESSION_END', 'Session End'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'
        VOUCHER_CREATE = 'VOUCHER_CREATE', 'Voucher Create'
        VOUCHER_USE = 'VOUCHER_USE', 'Voucher Use'

    # Acteur
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    actor_email = models.CharField(max_length=254, blank=True)  # Snapshot
    actor_role = models.CharField(max_length=20, blank=True)    # Snapshot
    
    # Action
    action = models.CharField(max_length=30, choices=Action.choices)
    target_type = models.CharField(max_length=50)  # Model name
    target_id = models.CharField(max_length=50, blank=True)
    target_repr = models.TextField(blank=True)     # String representation
    
    # Détails
    metadata = models.JSONField(default=dict)
    changes = models.JSONField(default=dict)       # Before/after for updates
    
    # Contexte
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    request_id = models.UUIDField(null=True, blank=True)
    
    # Intégrité
    content_hash = models.CharField(max_length=64, blank=True)  # SHA-256
    
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        default_permissions = ('add', 'view')  # Pas de change/delete

# notifications/models.py
class Event(models.Model):
    class EventType(models.TextChoices):
        USER_REGISTRATION = 'USER_REGISTRATION', 'User Registration'
        USER_VALIDATION = 'USER_VALIDATION', 'User Validation'
        USER_SUSPENDED = 'USER_SUSPENDED', 'User Suspended'
        QUOTA_WARNING = 'QUOTA_WARNING', 'Quota Warning'
        QUOTA_EXCEEDED = 'QUOTA_EXCEEDED', 'Quota Exceeded'
        QUOTA_RESET = 'QUOTA_RESET', 'Quota Reset'
        SESSION_START = 'SESSION_START', 'Session Start'
        SESSION_END = 'SESSION_END', 'Session End'
        SESSION_TIMEOUT = 'SESSION_TIMEOUT', 'Session Timeout'
        VOUCHER_CREATED = 'VOUCHER_CREATED', 'Voucher Created'
        VOUCHER_USED = 'VOUCHER_USED', 'Voucher Used'
        VOUCHER_EXPIRED = 'VOUCHER_EXPIRED', 'Voucher Expired'
        ADMIN_ACTION = 'ADMIN_ACTION', 'Admin Action'
        SYSTEM_CONFIG = 'SYSTEM_CONFIG', 'System Configuration'
        SECURITY_ALERT = 'SECURITY_ALERT', 'Security Alert'
        MAINTENANCE_SCHEDULED = 'MAINTENANCE_SCHEDULED', 'Maintenance Scheduled'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Low'
        NORMAL = 'NORMAL', 'Normal'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Audience(models.TextChoices):
        USER = 'USER', 'User'
        ADMIN = 'ADMIN', 'Admin'
        SUPERADMIN = 'SUPERADMIN', 'Super Admin'
        ALL = 'ALL', 'All'

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    payload = models.JSONField(default=dict)
    
    audience = models.CharField(max_length=20, choices=Audience.choices, default=Audience.USER)
    channels = models.JSONField(default=list)  # ['web', 'email', 'sms']
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Envoi externe
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    sms_sent = models.BooleanField(default=False)
    sms_sent_at = models.DateTimeField(null=True, blank=True)
    
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

## 3. API Endpoints Complets

### 3.1 Authentification
```
POST   /api/v1/auth/login/                 # Connexion email/password + 2FA
POST   /api/v1/auth/logout/                # Déconnexion
POST   /api/v1/auth/refresh/               # Refresh JWT token
POST   /api/v1/auth/register/              # Inscription SUBSCRIBER
GET    /api/v1/auth/profile/               # Profil utilisateur
PUT    /api/v1/auth/profile/               # Mise à jour profil
POST   /api/v1/auth/change-password/       # Changement mot de passe
POST   /api/v1/auth/forgot-password/       # Mot de passe oublié
POST   /api/v1/auth/reset-password/        # Reset mot de passe
POST   /api/v1/auth/verify-email/          # Vérification email
POST   /api/v1/auth/resend-verification/   # Renvoyer email vérification

# 2FA
POST   /api/v1/auth/2fa/setup/             # Configuration 2FA
POST   /api/v1/auth/2fa/verify/            # Vérification code 2FA
POST   /api/v1/auth/2fa/disable/           # Désactivation 2FA
GET    /api/v1/auth/2fa/backup-codes/      # Codes de récupération
```

### 3.2 Portail Captif
```
POST   /api/v1/portal/authorize/           # Autorisation OpenNDS/CoovaChilli
POST   /api/v1/portal/login/               # Connexion portail (email ou voucher)
GET    /api/v1/portal/status/              # Statut session
POST   /api/v1/portal/logout/              # Déconnexion portail
POST   /api/v1/portal/heartbeat/           # Maintien session + usage
GET    /api/v1/portal/redirect/            # Redirection post-auth
```

### 3.3 Gestion Utilisateurs (Admin/SuperAdmin)
```
GET    /api/v1/users/                      # Liste utilisateurs
POST   /api/v1/users/                      # Créer utilisateur
GET    /api/v1/users/{id}/                 # Détail utilisateur
PUT    /api/v1/users/{id}/                 # Modifier utilisateur
DELETE /api/v1/users/{id}/                 # Supprimer utilisateur
POST   /api/v1/users/{id}/validate/        # Valider compte
POST   /api/v1/users/{id}/suspend/         # Suspendre compte
POST   /api/v1/users/{id}/reactivate/      # Réactiver compte
GET    /api/v1/users/pending/              # Comptes en attente
```

### 3.4 Plans & Abonnements
```
GET    /api/v1/billing/plans/              # Liste plans
POST   /api/v1/billing/plans/              # Créer plan (SuperAdmin)
PUT    /api/v1/billing/plans/{id}/         # Modifier plan
DELETE /api/v1/billing/plans/{id}/         # Supprimer plan

GET    /api/v1/billing/subscriptions/      # Mes abonnements
POST   /api/v1/billing/subscriptions/      # Créer abonnement
GET    /api/v1/billing/subscriptions/admin/ # Tous abonnements (Admin+)
PUT    /api/v1/billing/subscriptions/{id}/validate/ # Valider abonnement
```

### 3.5 Appareils & Sessions
```
GET    /api/v1/access/devices/             # Mes appareils
POST   /api/v1/access/devices/             # Ajouter appareil
PUT    /api/v1/access/devices/{id}/        # Modifier appareil
DELETE /api/v1/access/devices/{id}/        # Supprimer appareil
POST   /api/v1/access/devices/{id}/revoke/ # Révoquer appareil

GET    /api/v1/access/sessions/            # Mes sessions
GET    /api/v1/access/sessions/admin/      # Toutes sessions (Admin+)
GET    /api/v1/access/sessions/{id}/       # Détail session
POST   /api/v1/access/sessions/{id}/terminate/ # Terminer session
GET    /api/v1/access/sessions/active/     # Sessions actives
```

### 3.6 Vouchers
```
GET    /api/v1/access/vouchers/            # Mes vouchers (Admin+)
POST   /api/v1/access/vouchers/            # Créer vouchers
GET    /api/v1/access/vouchers/{code}/     # Détail voucher
POST   /api/v1/access/vouchers/{code}/use/ # Utiliser voucher
POST   /api/v1/access/vouchers/{code}/revoke/ # Révoquer voucher
GET    /api/v1/access/vouchers/stats/      # Statistiques vouchers
```

### 3.7 Notifications
```
GET    /api/v1/notifications/              # Mes notifications
POST   /api/v1/notifications/{id}/read/    # Marquer comme lu
POST   /api/v1/notifications/read-all/     # Tout marquer comme lu
DELETE /api/v1/notifications/{id}/         # Supprimer notification
GET    /api/v1/notifications/unread-count/ # Nombre non lues
```

### 3.8 Audit (SuperAdmin)
```
GET    /api/v1/audit/logs/                 # Logs audit
GET    /api/v1/audit/logs/{id}/            # Détail log
GET    /api/v1/audit/stats/                # Statistiques audit
GET    /api/v1/audit/export/               # Export logs
```

### 3.9 Configuration (SuperAdmin)
```
GET    /api/v1/config/                     # Configuration système
PUT    /api/v1/config/{key}/               # Modifier paramètre
GET    /api/v1/config/backup/              # Backup configuration
POST   /api/v1/config/restore/             # Restaurer configuration
```

## 4. Structure Frontend avec Templates RocketBoard

### 4.1 Architecture Composants
```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── forms/                 # Formulaires réutilisables
│   ├── layouts/               # Layouts principaux
│   ├── dashboard/             # Dashboard adapté par rôle
│   ├── auth/                  # Auth templates adaptés
│   ├── portal/                # Interface portail captif
│   ├── admin/                 # Interfaces administration
│   ├── calendar/              # Calendrier événements/maintenance
│   ├── tasks/                 # Gestion tâches admin
│   ├── files/                 # Gestionnaire documents
│   ├── notes/                 # Prise de notes admin
│   ├── contacts/              # Gestion contacts clients
│   ├── profile/               # Profil utilisateur
│   └── timeline/              # Timeline audit/événements
├── hooks/                     # Custom hooks React
├── lib/                       # Utilitaires et configuration
├── pages/                     # Pages principales
├── services/                  # Services API
├── stores/                    # État global (Zustand)
├── types/                     # Types TypeScript
└── utils/                     # Fonctions utilitaires
```

### 4.2 Composants Dashboard Adaptés
```typescript
// Dashboard par rôle avec métriques spécifiques
interface DashboardProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
}

// SuperAdmin: métriques système complètes
// Admin: gestion utilisateurs et sessions
// Subscriber: usage personnel et quotas
// Guest: session actuelle et temps restant
```

### 4.3 Templates Auth Sécurisés
```typescript
// Formulaires avec validation renforcée
// 2FA intégré, rate limiting, captcha
// Récupération mot de passe sécurisée
// Vérification email obligatoire
```

### 4.4 Interface Portail Captif
```typescript
// Page d'accueil portail
// Connexion email/password ou voucher
// Statut session temps réel
// Gestion quotas visuels
```

## 5. Sécurité Renforcée

### 5.1 Backend Django
```python
# settings/security.py
SECURITY_MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_ratelimit.middleware.RatelimitMiddleware',
    'audit.middleware.AuditMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Sécurité stricte
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# CSP stricte
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_CONNECT_SRC = ("'self'", "wss:")

# Rate limiting
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# Password policy
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.AttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 12}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.CustomPasswordValidator',
    },
]
```

### 5.2 Middleware Audit
```python
# audit/middleware.py
class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Capture contexte
        request.audit_context = {
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'request_id': str(uuid.uuid4()),
            'timestamp': timezone.now(),
        }
        
        response = self.get_response(request)
        
        # Log actions sensibles
        if self.is_sensitive_action(request):
            self.create_audit_log(request, response)
            
        return response
```

## 6. Intégration Portail Captif

### 6.1 Script OpenNDS
```bash
#!/bin/bash
# scripts/opennds-integration.sh

PORTAL_URL="https://captive.example.com"
OPENNDS_CONFIG="/etc/opennds/opennds.conf"

cat > $OPENNDS_CONFIG << EOF
GatewayInterface br-lan
GatewayAddress 192.168.1.1
GatewayPort 2050
MaxClients 250
SessionTimeout 0
PreAuthIdleTimeout 30
AuthIdleTimeout 120

LoginScriptPathFragment /portal/login/
PortalURL $PORTAL_URL/portal/
EmptyRuleSetPolicy accept

FirewallRuleSet authenticated-users {
    FirewallRule allow all
}

FirewallRuleSet preauthenticated-users {
    FirewallRule allow tcp port 53
    FirewallRule allow udp port 53
    FirewallRule allow tcp port 80
    FirewallRule allow tcp port 443
    FirewallRule allow tcp port 2050
}

BinAuth /usr/lib/opennds/binauth_captive.sh
EOF

# Script binauth personnalisé
cat > /usr/lib/opennds/binauth_captive.sh << 'EOF'
#!/bin/bash
METHOD="$1"
MAC="$2"
IP="$3"
TOKEN="$4"
INCOMING="$5"
OUTGOING="$6"

case $METHOD in
    auth_client)
        RESPONSE=$(curl -s -X POST "$PORTAL_URL/api/v1/portal/authorize/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"token\":\"$TOKEN\"}")
        
        STATUS=$(echo $RESPONSE | jq -r '.status')
        
        if [ "$STATUS" = "ALLOW" ]; then
            echo "1"
        else
            echo "0"
        fi
        ;;
    client_auth)
        curl -s -X POST "$PORTAL_URL/api/v1/portal/session-start/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"incoming\":\"$INCOMING\",\"outgoing\":\"$OUTGOING\"}"
        ;;
    client_deauth)
        curl -s -X POST "$PORTAL_URL/api/v1/portal/session-end/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"incoming\":\"$INCOMING\",\"outgoing\":\"$OUTGOING\"}"
        ;;
esac
EOF

chmod +x /usr/lib/opennds/binauth_captive.sh
systemctl restart opennds
```

### 6.2 QoS et Quotas
```bash
#!/bin/bash
# scripts/qos-management.sh

INTERFACE="eth0"
PORTAL_API="https://captive.example.com/api/v1"

setup_qos() {
    tc qdisc del dev $INTERFACE root 2>/dev/null
    tc qdisc add dev $INTERFACE root handle 1: htb default 30
    tc class add dev $INTERFACE parent 1: classid 1:1 htb rate 100mbit
    
    # Classes par rôle
    tc class add dev $INTERFACE parent 1:1 classid 1:10 htb rate 50mbit ceil 80mbit  # Admin
    tc class add dev $INTERFACE parent 1:1 classid 1:20 htb rate 30mbit ceil 50mbit  # Subscriber
    tc class add dev $INTERFACE parent 1:1 classid 1:30 htb rate 10mbit ceil 20mbit  # Guest
}

monitor_quotas() {
    while true; do
        SESSIONS=$(curl -s "$PORTAL_API/access/sessions/active/" \
            -H "Authorization: Bearer $API_TOKEN")
        
        echo "$SESSIONS" | jq -r '.results[] | @base64' | while read session; do
            SESSION_DATA=$(echo $session | base64 -d)
            
            MAC=$(echo $SESSION_DATA | jq -r '.mac_address')
            QUOTA_EXCEEDED=$(echo $SESSION_DATA | jq -r '.quota_exceeded')
            
            if [ "$QUOTA_EXCEEDED" = "true" ]; then
                iptables -I FORWARD -m mac --mac-source $MAC -j DROP
            fi
        done
        
        sleep 30
    done
}

setup_qos $INTERFACE
monitor_quotas &
```

## 7. Tests Automatisés

### 7.1 Tests Backend
```python
# tests/test_auth.py
class AuthenticationTestCase(TestCase):
    def test_user_registration_flow(self):
        """Test complet inscription utilisateur"""
        response = self.client.post('/api/v1/auth/register/', {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'TestPassword123!',
            'password_confirm': 'TestPassword123!'
        })
        self.assertEqual(response.status_code, 201)
        
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.status, User.Status.PENDING_VALIDATION)
        self.assertFalse(user.email_verified)
        
    def test_2fa_setup_and_login(self):
        """Test configuration et utilisation 2FA"""
        user = self.create_user()
        self.client.force_authenticate(user=user)
        
        # Setup 2FA
        response = self.client.post('/api/v1/auth/2fa/setup/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('secret', response.data)
        self.assertIn('qr_code', response.data)
        
        # Verify and enable
        totp = pyotp.TOTP(response.data['secret'])
        code = totp.now()
        
        response = self.client.post('/api/v1/auth/2fa/verify/', {
            'totp_code': code
        })
        self.assertEqual(response.status_code, 200)
        
        user.refresh_from_db()
        self.assertTrue(user.mfa_enabled)

# tests/test_portal.py
class PortalTestCase(TestCase):
    def test_captive_portal_flow(self):
        """Test flux complet portail captif"""
        # Autorisation initiale
        response = self.client.post('/api/v1/portal/authorize/', {
            'mac': 'AA:BB:CC:DD:EE:FF',
            'ip': '192.168.1.100'
        })
        self.assertEqual(response.data['status'], 'DENY')
        
        # Connexion avec voucher
        voucher = self.create_voucher()
        response = self.client.post('/api/v1/portal/login/', {
            'type': 'voucher',
            'mac': 'AA:BB:CC:DD:EE:FF',
            'ip': '192.168.1.100',
            'code': voucher.code
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')
        
        # Vérification session
        session = Session.objects.get(mac_address='AA:BB:CC:DD:EE:FF')
        self.assertEqual(session.status, Session.Status.ACTIVE)
```

### 7.2 Tests Frontend
```typescript
// tests/auth.test.tsx
describe('Authentication Flow', () => {
  test('user registration with validation', async () => {
    render(<App />)
    
    // Navigation vers inscription
    fireEvent.click(screen.getByText('Créer un compte'))
    
    // Remplissage formulaire
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'TestPassword123!' }
    })
    
    // Soumission
    fireEvent.click(screen.getByText('Créer mon compte'))
    
    // Vérification message
    await waitFor(() => {
      expect(screen.getByText(/en attente de validation/)).toBeInTheDocument()
    })
  })
  
  test('2FA setup process', async () => {
    const user = mockAuthenticatedUser()
    render(<ProfileSettings user={user} />)
    
    // Activation 2FA
    fireEvent.click(screen.getByText('Activer la 2FA'))
    
    // Vérification QR code
    await waitFor(() => {
      expect(screen.getByText(/Scannez ce QR code/)).toBeInTheDocument()
    })
    
    // Saisie code TOTP
    fireEvent.change(screen.getByLabelText('Code TOTP'), {
      target: { value: '123456' }
    })
    
    fireEvent.click(screen.getByText('Vérifier'))
    
    await waitFor(() => {
      expect(screen.getByText(/2FA activée avec succès/)).toBeInTheDocument()
    })
  })
})

// tests/e2e/portal.spec.ts (Playwright)
test('complete captive portal flow', async ({ page }) => {
  // Simulation connexion Wi-Fi
  await page.goto('http://192.168.1.1:2050')
  
  // Redirection vers portail
  await expect(page).toHaveURL(/captive\.example\.com/)
  
  // Connexion avec voucher
  await page.click('text=Code d\'accès invité')
  await page.fill('[data-testid=voucher-code]', 'GUEST123')
  await page.click('text=Se connecter')
  
  // Vérification accès
  await expect(page.locator('text=Accès autorisé')).toBeVisible()
  
  // Test navigation Internet
  await page.goto('https://google.com')
  await expect(page).toHaveURL(/google\.com/)
})
```

## 8. Déploiement et Infrastructure

### 8.1 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: captive_portal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      
  backend:
    build: ./backend
    command: gunicorn captive_portal.wsgi:application --bind 0.0.0.0:8000
    volumes:
      - ./backend:/app
      - static_files:/app/staticfiles
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/captive_portal
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=0
      
  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - static_files:/usr/share/nginx/html/static
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      
  celery:
    build: ./backend
    command: celery -A captive_portal worker -l info
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/captive_portal
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      
  celery-beat:
    build: ./backend
    command: celery -A captive_portal beat -l info
    volumes:
      - ./backend:/app
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

volumes:
  postgres_data:
  static_files:
```

### 8.2 Kubernetes Production
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: captive-portal-backend
  namespace: captive-portal
spec:
  replicas: 3
  selector:
    matchLabels:
      app: captive-portal-backend
  template:
    metadata:
      labels:
        app: captive-portal-backend
    spec:
      containers:
      - name: backend
        image: captive-portal/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: captive-portal-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: captive-portal-secrets
              key: secret-key
        livenessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready/
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 8.3 CI/CD Pipeline
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.12'
        
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install coverage pytest-cov
        
    - name: Run tests with coverage
      run: |
        cd backend
        coverage run --source='.' manage.py test
        coverage report --fail-under=90
        coverage xml
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage
        npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'

  build-and-deploy:
    needs: [test-backend, test-frontend, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Build and push Docker images
      run: |
        docker build -t captive-portal/backend:${{ github.sha }} ./backend
        docker build -t captive-portal/frontend:${{ github.sha }} ./frontend
        
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push captive-portal/backend:${{ github.sha }}
        docker push captive-portal/frontend:${{ github.sha }}
        
    - name: Deploy to Kubernetes
      run: |
        sed -i 's|captive-portal/backend:latest|captive-portal/backend:${{ github.sha }}|g' k8s/deployment.yaml
        kubectl apply -f k8s/
```

## 9. Monitoring et Observabilité

### 9.1 Métriques Prometheus
```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Métriques métier
user_registrations = Counter('captive_portal_user_registrations_total', 'Total user registrations', ['status'])
session_duration = Histogram('captive_portal_session_duration_seconds', 'Session duration')
active_sessions = Gauge('captive_portal_active_sessions', 'Active sessions')
quota_usage = Gauge('captive_portal_quota_usage_percent', 'Quota usage', ['user_id', 'quota_type'])
voucher_usage = Counter('captive_portal_voucher_usage_total', 'Voucher usage', ['plan_type'])

# Métriques techniques
api_requests = Counter('captive_portal_api_requests_total', 'API requests', ['method', 'endpoint', 'status'])
api_duration = Histogram('captive_portal_api_duration_seconds', 'API duration', ['method', 'endpoint'])
```

### 9.2 Dashboard Grafana
```json
{
  "dashboard": {
    "title": "Captive Portal Monitoring",
    "panels": [
      {
        "title": "Active Sessions",
        "type": "stat",
        "targets": [{"expr": "captive_portal_active_sessions"}]
      },
      {
        "title": "User Registration Rate",
        "type": "graph",
        "targets": [{"expr": "rate(captive_portal_user_registrations_total[5m])"}]
      },
      {
        "title": "API Response Times",
        "type": "heatmap",
        "targets": [{"expr": "captive_portal_api_duration_seconds_bucket"}]
      }
    ]
  }
}
```

## 10. Workflows Utilisateurs

### 10.1 Inscription Abonné
```
1. Utilisateur accède Wi-Fi ouvert
2. Redirection automatique portail captif
3. Choix "Créer compte abonné"
4. Formulaire inscription complet
5. Validation email automatique
6. Statut "En attente validation admin"
7. Notification admin nouveau compte
8. Admin valide le compte
9. Notification utilisateur activation
10. Première connexion possible
```

### 10.2 Connexion Voucher Invité
```
1. Accès Wi-Fi ouvert
2. Redirection portail captif
3. Choix "Code d'accès invité"
4. Saisie code 8 caractères
5. Validation code et quotas
6. Création session temporaire
7. Accès Internet avec quotas
8. Surveillance usage temps réel
9. Notifications approche limites
10. Coupure automatique si dépassement
```

### 10.3 Validation Administrative
```
1. Admin reçoit notification
2. Interface validation avec détails
3. Vérifications automatiques
4. Contrôles manuels admin
5. Décision Approuver/Rejeter
6. Actions automatiques selon décision
7. Notifications utilisateur
8. Audit complet de la décision
```

Cette architecture complète fournit une base solide pour développer votre plateforme de portail captif entreprise avec toutes les fonctionnalités demandées, la sécurité renforcée, et l'intégration des templates RocketBoard adaptés aux besoins métier.