# Plan de Développement Complet - Plateforme Portail Captif Entreprise

## 1. Architecture Système

### 1.1 Stack Technique
```
Backend:
- Python 3.12 + Django 5.0 + DRF 3.14
- PostgreSQL 15+ (données principales)
- Redis 7+ (cache, sessions, queues)
- Celery 5+ (tâches asynchrones)
- SMTP/SES (emails) + SMS abstraction

Frontend:
- React 18 + TypeScript 5
- Vite 5 (build tool)
- TailwindCSS 3.4 (GitHub theme)
- shadcn/ui + lucide-react
- JetBrains Nerd Font
- React Query + Zod validation
- i18next (FR/EN)

Infrastructure:
- Docker + Kubernetes
- Nginx (reverse proxy)
- Prometheus + Grafana
- OpenTelemetry
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

## 2. Schéma Base de Données Détaillé

### 2.1 Modèles Principaux

```sql
-- Utilisateurs avec rôles stricts
CREATE TABLE accounts_user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) CHECK (role IN ('SUPERADMIN', 'ADMIN', 'SUBSCRIBER', 'GUEST')) NOT NULL DEFAULT 'SUBSCRIBER',
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PENDING_VALIDATION', 'SUSPENDED', 'REVOKED')) NOT NULL DEFAULT 'PENDING_VALIDATION',
    password VARCHAR(128) NOT NULL,
    mfa_secret VARCHAR(200),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_accounts_user_email ON accounts_user(email);
CREATE INDEX idx_accounts_user_role_status ON accounts_user(role, status);

-- Contrainte rôles limités
CREATE OR REPLACE FUNCTION check_role_limits() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'SUPERADMIN' AND (
        SELECT COUNT(*) FROM accounts_user WHERE role = 'SUPERADMIN' AND status = 'ACTIVE'
    ) >= 2 THEN
        RAISE EXCEPTION 'Maximum 2 SUPERADMIN allowed';
    END IF;
    
    IF NEW.role = 'ADMIN' AND (
        SELECT COUNT(*) FROM accounts_user WHERE role = 'ADMIN' AND status = 'ACTIVE'
    ) >= 3 THEN
        RAISE EXCEPTION 'Maximum 3 ADMIN allowed';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_role_limits
    BEFORE INSERT OR UPDATE ON accounts_user
    FOR EACH ROW EXECUTE FUNCTION check_role_limits();

-- Plans d'abonnement
CREATE TABLE billing_plan (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    plan_type VARCHAR(20) CHECK (plan_type IN ('MONTHLY', 'WEEKLY', 'TEMPORARY')) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    max_devices INTEGER DEFAULT 1,
    data_quota_gb INTEGER DEFAULT 1,
    time_quota_hours INTEGER DEFAULT 24,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abonnements utilisateurs
CREATE TABLE billing_subscription (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    plan_id BIGINT REFERENCES billing_plan(id) ON DELETE PROTECT,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED')) DEFAULT 'PENDING',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    validated_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appareils utilisateurs
CREATE TABLE access_device (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) NOT NULL, -- AA:BB:CC:DD:EE:FF
    name VARCHAR(100) NOT NULL,
    last_ip INET,
    last_seen TIMESTAMPTZ,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mac_address)
);

CREATE INDEX idx_access_device_mac ON access_device(mac_address);
CREATE INDEX idx_access_device_user_active ON access_device(user_id, is_revoked);

-- Sessions de connexion
CREATE TABLE access_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    device_id BIGINT REFERENCES access_device(id) ON DELETE CASCADE,
    mac_address VARCHAR(17) NOT NULL,
    ip_address INET NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'AUTHORIZED', 'EXPIRED', 'REVOKED', 'QUOTA_EXCEEDED')) DEFAULT 'PENDING',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    bytes_uploaded BIGINT DEFAULT 0,
    bytes_downloaded BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    session_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_session_mac_status ON access_session(mac_address, status);
CREATE INDEX idx_access_session_token ON access_session(session_token);
CREATE INDEX idx_access_session_time ON access_session(start_time, end_time);

-- Vouchers invités
CREATE TABLE access_voucher (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    plan_id BIGINT REFERENCES billing_plan(id) ON DELETE CASCADE,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED')) DEFAULT 'ACTIVE',
    created_by_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    assigned_to_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_voucher_code ON access_voucher(code);
CREATE INDEX idx_access_voucher_status_validity ON access_voucher(status, valid_from, valid_until);

-- Audit logs immuables
CREATE TABLE audit_auditlog (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    actor_role VARCHAR(20),
    action VARCHAR(20) CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VALIDATE', 'REVOKE', 'CONFIG_CHANGE')) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    content_hash VARCHAR(64),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches audit
CREATE INDEX idx_audit_actor_time ON audit_auditlog(actor_id, timestamp);
CREATE INDEX idx_audit_action_time ON audit_auditlog(action, timestamp);
CREATE INDEX idx_audit_target ON audit_auditlog(target_type, target_id);

-- Empêcher modifications/suppressions audit
CREATE RULE audit_no_update AS ON UPDATE TO audit_auditlog DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_auditlog DO INSTEAD NOTHING;

-- Notifications
CREATE TABLE notifications_event (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(30) CHECK (event_type IN ('USER_REGISTRATION', 'USER_VALIDATION', 'QUOTA_WARNING', 'QUOTA_EXCEEDED', 'ADMIN_ACTION', 'SYSTEM_CONFIG', 'VOUCHER_USED')) NOT NULL,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    audience VARCHAR(20) CHECK (audience IN ('USER', 'ADMIN', 'SUPERADMIN', 'ALL')) DEFAULT 'USER',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read_time ON notifications_event(user_id, is_read, created_at);
CREATE INDEX idx_notifications_type_time ON notifications_event(event_type, created_at);
CREATE INDEX idx_notifications_audience_time ON notifications_event(audience, created_at);

-- Configuration système
CREATE TABLE portal_systemconfig (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    last_modified_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bindings portail captif
CREATE TABLE portal_captivebinding (
    id BIGSERIAL PRIMARY KEY,
    mac_address VARCHAR(17) NOT NULL,
    ip_address INET NOT NULL,
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES access_session(id) ON DELETE CASCADE,
    authorized_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) CHECK (source IN ('OPENNDS', 'COOVACHILLI', 'MANUAL')) DEFAULT 'MANUAL',
    redirect_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portal_binding_mac_auth ON portal_captivebinding(mac_address, authorized_at);
CREATE INDEX idx_portal_binding_expires ON portal_captivebinding(expires_at);
```

## 3. API Endpoints Complets

### 3.1 Authentication & Authorization
```
POST   /api/v1/auth/login/                 # Connexion email/password
POST   /api/v1/auth/logout/                # Déconnexion
POST   /api/v1/auth/register/              # Inscription (SUBSCRIBER)
POST   /api/v1/auth/refresh/               # Refresh JWT token
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
GET    /api/v1/portal/redirect/            # Redirection post-auth
POST   /api/v1/portal/heartbeat/           # Maintien session
```

### 3.3 Gestion Utilisateurs (Admin/SuperAdmin)
```
GET    /api/v1/users/                      # Liste utilisateurs
POST   /api/v1/users/                      # Créer utilisateur (Admin+)
GET    /api/v1/users/{id}/                 # Détail utilisateur
PUT    /api/v1/users/{id}/                 # Modifier utilisateur
DELETE /api/v1/users/{id}/                 # Supprimer utilisateur
POST   /api/v1/users/{id}/validate/        # Valider compte (Admin+)
POST   /api/v1/users/{id}/suspend/         # Suspendre compte
POST   /api/v1/users/{id}/reactivate/      # Réactiver compte
GET    /api/v1/users/pending/              # Comptes en attente validation
```

### 3.4 Plans & Abonnements
```
GET    /api/v1/billing/plans/              # Liste plans publics
GET    /api/v1/billing/plans/admin/        # Tous plans (Admin+)
POST   /api/v1/billing/plans/              # Créer plan (SuperAdmin)
PUT    /api/v1/billing/plans/{id}/         # Modifier plan (SuperAdmin)
DELETE /api/v1/billing/plans/{id}/         # Supprimer plan (SuperAdmin)

GET    /api/v1/billing/subscriptions/      # Mes abonnements
POST   /api/v1/billing/subscriptions/      # Créer abonnement
GET    /api/v1/billing/subscriptions/admin/ # Tous abonnements (Admin+)
PUT    /api/v1/billing/subscriptions/{id}/validate/ # Valider abonnement (Admin+)
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
POST   /api/v1/access/sessions/{id}/terminate/ # Terminer session (Admin+)
GET    /api/v1/access/sessions/active/     # Sessions actives
```

### 3.6 Vouchers Invités
```
GET    /api/v1/access/vouchers/            # Mes vouchers créés (Admin+)
POST   /api/v1/access/vouchers/            # Créer voucher (Admin+)
GET    /api/v1/access/vouchers/{code}/     # Détail voucher
POST   /api/v1/access/vouchers/{code}/use/ # Utiliser voucher
POST   /api/v1/access/vouchers/{code}/revoke/ # Révoquer voucher (Admin+)
GET    /api/v1/access/vouchers/stats/      # Statistiques vouchers (Admin+)
```

### 3.7 Notifications
```
GET    /api/v1/notifications/              # Mes notifications
POST   /api/v1/notifications/{id}/read/    # Marquer comme lu
POST   /api/v1/notifications/read-all/     # Tout marquer comme lu
DELETE /api/v1/notifications/{id}/         # Supprimer notification
GET    /api/v1/notifications/unread-count/ # Nombre non lues
```

### 3.8 Audit & Logs (SuperAdmin uniquement)
```
GET    /api/v1/audit/logs/                 # Logs audit
GET    /api/v1/audit/logs/{id}/            # Détail log
GET    /api/v1/audit/stats/                # Statistiques audit
GET    /api/v1/audit/export/               # Export logs (CSV/JSON)
```

### 3.9 Configuration Système (SuperAdmin)
```
GET    /api/v1/config/                     # Configuration système
PUT    /api/v1/config/{key}/               # Modifier paramètre
GET    /api/v1/config/backup/              # Backup configuration
POST   /api/v1/config/restore/             # Restaurer configuration
```

## 4. Structure Frontend Détaillée

### 4.1 Architecture Composants
```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── forms/                 # Formulaires réutilisables
│   ├── layouts/               # Layouts principaux
│   ├── dashboard/             # Composants dashboard
│   ├── auth/                  # Composants authentification
│   ├── portal/                # Interface portail captif
│   ├── admin/                 # Interfaces administration
│   ├── calendar/              # Composants calendrier
│   ├── tasks/                 # Gestion tâches
│   ├── files/                 # Gestionnaire fichiers
│   ├── notes/                 # Prise de notes
│   ├── contacts/              # Gestion contacts
│   ├── profile/               # Profil utilisateur
│   └── timeline/              # Timeline événements
├── hooks/                     # Custom hooks React
├── lib/                       # Utilitaires et configuration
├── pages/                     # Pages principales
├── services/                  # Services API
├── stores/                    # État global (Zustand)
├── types/                     # Types TypeScript
└── utils/                     # Fonctions utilitaires
```

### 4.2 Composants UI Adaptés RocketBoard

#### Dashboard Components
```typescript
// src/components/dashboard/DashboardStats.tsx
interface DashboardStatsProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  // Statistiques adaptées au rôle
  // SuperAdmin: tous les metrics système
  // Admin: metrics utilisateurs et sessions
  // Subscriber: usage personnel et quotas
  // Guest: session actuelle et temps restant
}

// src/components/dashboard/ActiveSessions.tsx
export function ActiveSessions() {
  // Tableau sessions actives avec actions admin
  // Filtres par utilisateur, IP, durée
  // Actions: voir détails, terminer session
}

// src/components/dashboard/QuotaAlerts.tsx
export function QuotaAlerts() {
  // Alertes dépassement quotas
  // Notifications temps réel
  // Actions rapides: étendre quota, suspendre
}
```

#### Calendar Components
```typescript
// src/components/calendar/Calendar.tsx
export function Calendar() {
  // Vue mois/semaine/jour
  // Événements: maintenance, validations, expirations
  // Intégration avec tâches et notifications
}

// src/components/calendar/EventModal.tsx
export function EventModal() {
  // Création/édition événements
  // Types: maintenance, réunion, deadline
  // Notifications automatiques
}
```

#### Task Management
```typescript
// src/components/tasks/TaskBoard.tsx
export function TaskBoard() {
  // Kanban board: À faire, En cours, Terminé
  // Filtres par priorité, assigné, date
  // Drag & drop entre colonnes
}

// src/components/tasks/TaskCard.tsx
export function TaskCard() {
  // Carte tâche avec priorité, labels, assigné
  // Actions rapides: éditer, commenter, déplacer
}
```

#### File Manager
```typescript
// src/components/files/FileManager.tsx
export function FileManager() {
  // Vue grille/liste
  // Upload drag & drop
  // Gestion dossiers (CGU, rapports, contrats)
  // Permissions par rôle
}

// src/components/files/FileUpload.tsx
export function FileUpload() {
  // Upload multiple avec progress
  // Validation types/tailles
  // Prévisualisation
}
```

#### Notes System
```typescript
// src/components/notes/NotesManager.tsx
export function NotesManager() {
  // Liste notes avec recherche
  // Catégories: procédures, technique, contacts
  // Épinglage et favoris
}

// src/components/notes/NoteEditor.tsx
export function NoteEditor() {
  // Éditeur riche avec markdown
  // Auto-sauvegarde
  // Partage entre admins
}
```

#### Contacts Management
```typescript
// src/components/contacts/ContactsManager.tsx
export function ContactsManager() {
  // Liste/grille contacts
  // Catégories: clients, fournisseurs, internes
  // Import/export CSV
}

// src/components/contacts/ContactForm.tsx
export function ContactForm() {
  // Formulaire contact complet
  // Validation email/téléphone
  // Historique interactions
}
```

#### Profile Components
```typescript
// src/components/profile/ProfileSettings.tsx
export function ProfileSettings() {
  // Onglets: Profil, Sécurité, Notifications
  // Changement mot de passe
  // Configuration 2FA
}

// src/components/profile/SecuritySettings.tsx
export function SecuritySettings() {
  // Gestion 2FA
  // Historique connexions
  // Sessions actives
}
```

#### Timeline
```typescript
// src/components/timeline/Timeline.tsx
export function Timeline() {
  // Chronologie événements
  // Filtres par type, utilisateur, date
  // Export pour audit
}

// src/components/timeline/TimelineEvent.tsx
export function TimelineEvent() {
  // Événement avec icône, description, métadonnées
  // Liens vers objets concernés
}
```

### 4.3 Hooks Personnalisés
```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  // Gestion authentification
  // JWT refresh automatique
  // Vérification rôles
}

// src/hooks/useQuotas.ts
export function useQuotas(userId?: string) {
  // Surveillance quotas temps réel
  // Alertes automatiques
  // Calculs usage
}

// src/hooks/useNotifications.ts
export function useNotifications() {
  // WebSocket notifications
  // État non lues
  // Actions marquer lu/supprimer
}

// src/hooks/usePortalStatus.ts
export function usePortalStatus() {
  // Statut session portail
  // Heartbeat automatique
  // Reconnexion auto
}
```

## 5. Workflows Utilisateurs Détaillés

### 5.1 Workflow Inscription Abonné
```
1. Utilisateur accède au Wi-Fi ouvert
2. Redirection automatique vers portail captif
3. Choix: "Créer un compte abonné"
4. Formulaire inscription:
   - Email (vérification MX)
   - Mot de passe fort (validation temps réel)
   - Informations personnelles
   - Acceptation CGU
5. Validation email automatique
6. Statut: "En attente de validation admin"
7. Notification admin: nouveau compte à valider
8. Admin valide le compte
9. Notification utilisateur: compte activé
10. Utilisateur peut se connecter
```

### 5.2 Workflow Connexion Voucher Invité
```
1. Utilisateur accède au Wi-Fi ouvert
2. Redirection vers portail captif
3. Choix: "Code d'accès invité"
4. Saisie code 8 caractères
5. Validation code:
   - Existence et validité
   - Quotas disponibles
   - Nombre d'utilisations
6. Création session temporaire
7. Accès Internet avec quotas
8. Surveillance temps réel usage
9. Notifications approche limites
10. Coupure automatique si dépassement
```

### 5.3 Workflow Validation Admin
```
1. Admin reçoit notification nouveau compte
2. Accès interface validation:
   - Informations utilisateur
   - Plan demandé
   - Vérifications automatiques
3. Contrôles admin:
   - Cohérence informations
   - Légitimité demande
   - Respect politiques
4. Décision: Approuver/Rejeter
5. Si approuvé:
   - Activation compte
   - Création abonnement
   - Notification utilisateur
6. Si rejeté:
   - Notification avec raison
   - Suppression compte
7. Audit automatique de la décision
```

### 5.4 Workflow Gestion Quotas
```
1. Surveillance continue sessions actives
2. Calcul usage temps réel:
   - Données up/down
   - Temps connexion
   - Nombre appareils
3. Seuils d'alerte (80%, 90%, 100%):
   - Notification utilisateur
   - Alerte admin si nécessaire
4. Actions automatiques dépassement:
   - Limitation débit
   - Coupure connexion
   - Notification obligatoire
5. Possibilité extension quota (admin)
6. Renouvellement automatique abonnement
```

## 6. Tests Automatisés Complets

### 6.1 Tests Backend (Django)
```python
# tests/test_auth.py
class AuthenticationTestCase(TestCase):
    def test_user_registration_flow(self):
        """Test complet inscription utilisateur"""
        # Inscription
        # Vérification email
        # Validation admin
        # Première connexion
        
    def test_2fa_setup_and_login(self):
        """Test configuration et utilisation 2FA"""
        
    def test_role_limitations(self):
        """Test limites rôles SUPERADMIN/ADMIN"""

# tests/test_portal.py
class PortalTestCase(TestCase):
    def test_captive_portal_flow(self):
        """Test flux complet portail captif"""
        
    def test_voucher_usage(self):
        """Test utilisation voucher invité"""
        
    def test_quota_enforcement(self):
        """Test application quotas"""

# tests/test_quotas.py
class QuotaTestCase(TestCase):
    def test_data_quota_tracking(self):
        """Test suivi quota données"""
        
    def test_time_quota_enforcement(self):
        """Test application quota temps"""
        
    def test_device_limit_enforcement(self):
        """Test limite nombre appareils"""

# tests/test_audit.py
class AuditTestCase(TestCase):
    def test_audit_log_immutability(self):
        """Test immutabilité logs audit"""
        
    def test_sensitive_action_logging(self):
        """Test logging actions sensibles"""
```

### 6.2 Tests Frontend (React Testing Library + Playwright)
```typescript
// tests/auth.test.tsx
describe('Authentication Flow', () => {
  test('user registration and validation', async () => {
    // Test inscription complète
    // Validation formulaire
    // Gestion erreurs
  })
  
  test('2FA setup and verification', async () => {
    // Configuration 2FA
    // Vérification codes
    // Codes de récupération
  })
})

// tests/dashboard.test.tsx
describe('Dashboard Components', () => {
  test('role-based dashboard content', async () => {
    // Contenu selon rôle
    // Permissions actions
    // Données affichées
  })
  
  test('real-time notifications', async () => {
    // WebSocket notifications
    // Mise à jour temps réel
    // Actions utilisateur
  })
})

// tests/e2e/portal.spec.ts (Playwright)
test('complete captive portal flow', async ({ page }) => {
  // Simulation connexion Wi-Fi
  // Redirection portail
  // Inscription/connexion
  // Accès Internet
  // Gestion quotas
})
```

### 6.3 Tests d'Intégration
```python
# tests/integration/test_portal_integration.py
class PortalIntegrationTestCase(TestCase):
    def test_opennds_integration(self):
        """Test intégration OpenNDS"""
        
    def test_coovachilli_integration(self):
        """Test intégration CoovaChilli"""
        
    def test_firewall_rules_application(self):
        """Test application règles firewall"""

# tests/integration/test_notification_system.py
class NotificationIntegrationTestCase(TestCase):
    def test_email_notifications(self):
        """Test notifications email"""
        
    def test_sms_notifications(self):
        """Test notifications SMS"""
        
    def test_realtime_notifications(self):
        """Test notifications temps réel"""
```

## 7. Sécurité et Conformité

### 7.1 Mesures Sécurité Backend
```python
# settings/security.py
SECURITY_SETTINGS = {
    'PASSWORD_POLICY': {
        'MIN_LENGTH': 12,
        'REQUIRE_UPPERCASE': True,
        'REQUIRE_LOWERCASE': True,
        'REQUIRE_DIGITS': True,
        'REQUIRE_SYMBOLS': True,
        'HISTORY_COUNT': 5,  # Pas de réutilisation 5 derniers
    },
    'SESSION_SECURITY': {
        'SESSION_COOKIE_SECURE': True,
        'SESSION_COOKIE_HTTPONLY': True,
        'SESSION_COOKIE_SAMESITE': 'Strict',
        'SESSION_EXPIRE_AT_BROWSER_CLOSE': True,
        'SESSION_TIMEOUT': 3600,  # 1 heure
    },
    'RATE_LIMITING': {
        'LOGIN_ATTEMPTS': '5/5m',  # 5 tentatives par 5 min
        'API_CALLS': '1000/h',     # 1000 appels par heure
        'PASSWORD_RESET': '3/h',   # 3 reset par heure
    },
    'CSP_POLICY': {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'connect-src': "'self' wss:",
        'font-src': "'self'",
        'frame-ancestors': "'none'",
    }
}
```

### 7.2 Audit et Conformité
```python
# audit/middleware.py
class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Capture contexte avant traitement
        audit_context = {
            'ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT'),
            'user': request.user if request.user.is_authenticated else None,
            'timestamp': timezone.now(),
        }
        
        response = self.get_response(request)
        
        # Log actions sensibles
        if self.is_sensitive_action(request):
            self.create_audit_log(request, response, audit_context)
            
        return response
```

## 8. Déploiement et Infrastructure

### 8.1 Docker Compose Development
```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: captive_portal
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
      
  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DEBUG=1
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/captive_portal
      - REDIS_URL=redis://redis:6379/0
      
  frontend:
    build: ./frontend
    command: npm run dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000/api/v1
      
  celery:
    build: ./backend
    command: celery -A captive_portal worker -l info
    volumes:
      - ./backend:/app
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/captive_portal
      - REDIS_URL=redis://redis:6379/0

volumes:
  postgres_data:
```

### 8.2 Kubernetes Production
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: captive-portal

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: captive-portal-config
  namespace: captive-portal
data:
  DATABASE_HOST: "postgres-service"
  REDIS_HOST: "redis-service"
  DEBUG: "0"
  ALLOWED_HOSTS: "captive.example.com"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: captive-portal-secrets
  namespace: captive-portal
type: Opaque
data:
  SECRET_KEY: <base64-encoded-secret>
  DATABASE_PASSWORD: <base64-encoded-password>
  JWT_SECRET: <base64-encoded-jwt-secret>

---
# k8s/deployment-backend.yaml
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
        envFrom:
        - configMapRef:
            name: captive-portal-config
        - secretRef:
            name: captive-portal-secrets
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

---
# k8s/service-backend.yaml
apiVersion: v1
kind: Service
metadata:
  name: captive-portal-backend-service
  namespace: captive-portal
spec:
  selector:
    app: captive-portal-backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### 8.3 CI/CD Pipeline (GitHub Actions)
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
        
    - name: Upload coverage to Codecov
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
        
    - name: Run linting
      run: |
        cd frontend
        npm run lint
        
    - name: Run type checking
      run: |
        cd frontend
        npm run type-check
        
    - name: Run unit tests
      run: |
        cd frontend
        npm run test:coverage
        
    - name: Run E2E tests
      run: |
        cd frontend
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
        
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

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
        
        # Push to registry
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push captive-portal/backend:${{ github.sha }}
        docker push captive-portal/frontend:${{ github.sha }}
        
    - name: Deploy to Kubernetes
      run: |
        # Update image tags in K8s manifests
        sed -i 's|captive-portal/backend:latest|captive-portal/backend:${{ github.sha }}|g' k8s/deployment-backend.yaml
        sed -i 's|captive-portal/frontend:latest|captive-portal/frontend:${{ github.sha }}|g' k8s/deployment-frontend.yaml
        
        # Apply to cluster
        kubectl apply -f k8s/
```

## 9. Monitoring et Observabilité

### 9.1 Métriques Prometheus
```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Métriques métier
user_registrations = Counter('captive_portal_user_registrations_total', 'Total user registrations', ['status'])
session_duration = Histogram('captive_portal_session_duration_seconds', 'Session duration in seconds')
active_sessions = Gauge('captive_portal_active_sessions', 'Number of active sessions')
quota_usage = Gauge('captive_portal_quota_usage_percent', 'Quota usage percentage', ['user_id', 'quota_type'])
voucher_usage = Counter('captive_portal_voucher_usage_total', 'Total voucher usage', ['plan_type'])

# Métriques techniques
api_requests = Counter('captive_portal_api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
api_duration = Histogram('captive_portal_api_duration_seconds', 'API request duration', ['method', 'endpoint'])
database_connections = Gauge('captive_portal_db_connections', 'Database connections')
redis_operations = Counter('captive_portal_redis_operations_total', 'Redis operations', ['operation', 'status'])
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
        "targets": [
          {
            "expr": "captive_portal_active_sessions",
            "legendFormat": "Active Sessions"
          }
        ]
      },
      {
        "title": "User Registrations Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(captive_portal_user_registrations_total[5m])",
            "legendFormat": "Registrations/sec"
          }
        ]
      },
      {
        "title": "API Response Times",
        "type": "heatmap",
        "targets": [
          {
            "expr": "captive_portal_api_duration_seconds_bucket",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "title": "Quota Usage by Type",
        "type": "piechart",
        "targets": [
          {
            "expr": "avg by (quota_type) (captive_portal_quota_usage_percent)",
            "legendFormat": "{{quota_type}}"
          }
        ]
      }
    ]
  }
}
```

## 10. Scripts d'Intégration Réseau

### 10.1 Script OpenNDS
```bash
#!/bin/bash
# scripts/opennds-integration.sh

# Configuration OpenNDS pour intégration portail captif
PORTAL_URL="https://captive.example.com"
OPENNDS_CONFIG="/etc/opennds/opennds.conf"

# Backup configuration existante
cp $OPENNDS_CONFIG $OPENNDS_CONFIG.backup

# Configuration OpenNDS
cat > $OPENNDS_CONFIG << EOF
# Configuration OpenNDS pour Captive Portal
GatewayInterface br-lan
GatewayAddress 192.168.1.1
GatewayPort 2050
MaxClients 250
SessionTimeout 0
PreAuthIdleTimeout 30
AuthIdleTimeout 120

# Portail captif
LoginScriptPathFragment /portal/login/
PortalURL $PORTAL_URL/portal/
EmptyRuleSetPolicy accept

# Règles firewall
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

FirewallRuleSet users-to-router {
    FirewallRule allow udp port 53
    FirewallRule allow tcp port 22
    FirewallRule allow tcp port 23
    FirewallRule allow tcp port 80
    FirewallRule allow tcp port 443
}

# Binauth script
BinAuth /usr/lib/opennds/binauth_log.sh
EOF

# Script binauth personnalisé
cat > /usr/lib/opennds/binauth_captive.sh << 'EOF'
#!/bin/bash
# Script d'authentification personnalisé

METHOD="$1"
MAC="$2"
IP="$3"
TOKEN="$4"
INCOMING="$5"
OUTGOING="$6"

case $METHOD in
    auth_client)
        # Appel API pour autorisation
        RESPONSE=$(curl -s -X POST "$PORTAL_URL/api/v1/portal/authorize/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"token\":\"$TOKEN\"}")
        
        STATUS=$(echo $RESPONSE | jq -r '.status')
        
        if [ "$STATUS" = "ALLOW" ]; then
            echo "1"  # Autoriser
        else
            echo "0"  # Refuser
        fi
        ;;
    client_auth)
        # Client authentifié avec succès
        curl -s -X POST "$PORTAL_URL/api/v1/portal/client-auth/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"incoming\":\"$INCOMING\",\"outgoing\":\"$OUTGOING\"}"
        ;;
    client_deauth)
        # Client déconnecté
        curl -s -X POST "$PORTAL_URL/api/v1/portal/client-deauth/" \
            -H "Content-Type: application/json" \
            -d "{\"mac\":\"$MAC\",\"ip\":\"$IP\",\"incoming\":\"$INCOMING\",\"outgoing\":\"$OUTGOING\"}"
        ;;
esac
EOF

chmod +x /usr/lib/opennds/binauth_captive.sh

# Redémarrage OpenNDS
systemctl restart opennds
systemctl enable opennds

echo "OpenNDS configuré avec succès pour le portail captif"
```

### 10.2 Script CoovaChilli
```bash
#!/bin/bash
# scripts/coovachilli-integration.sh

PORTAL_URL="https://captive.example.com"
CHILLI_CONFIG="/etc/chilli/defaults"

# Configuration CoovaChilli
cat > $CHILLI_CONFIG << EOF
# Configuration CoovaChilli pour Captive Portal
HS_LANIF=eth1
HS_NETWORK=192.168.182.0
HS_NETMASK=255.255.255.0
HS_UAMLISTEN=192.168.182.1
HS_UAMPORT=3990
HS_UAMUIPORT=4990

# Portail captif
HS_UAMSERVER=$PORTAL_URL
HS_UAMHOMEPAGE=$PORTAL_URL/portal/
HS_UAMSECRET=changeme
HS_RADSECRET=changeme

# Serveur RADIUS
HS_RADSERVER=127.0.0.1
HS_RADSERVER2=127.0.0.1

# Domaines autorisés sans auth
HS_UAMDOMAINS="$PORTAL_URL,.google.com,.facebook.com"

# Ports autorisés
HS_TCP_PORTS="80,443,22,53"
HS_UDP_PORTS="53,67,68"

# Scripts
HS_POSTAUTH=/etc/chilli/postauth.sh
HS_PREAUTH=/etc/chilli/preauth.sh
EOF

# Script post-authentification
cat > /etc/chilli/postauth.sh << 'EOF'
#!/bin/bash
# Script post-authentification CoovaChilli

# Variables CoovaChilli
FRAMED_IP_ADDRESS="$FRAMED_IP_ADDRESS"
CALLING_STATION_ID="$CALLING_STATION_ID"
SESSION_ID="$CHILLI_SESSION_ID"
SESSION_TIMEOUT="$SESSION_TIMEOUT"
IDLE_TIMEOUT="$IDLE_TIMEOUT"

# Notification au portail
curl -s -X POST "$PORTAL_URL/api/v1/portal/session-start/" \
    -H "Content-Type: application/json" \
    -d "{
        \"ip\": \"$FRAMED_IP_ADDRESS\",
        \"mac\": \"$CALLING_STATION_ID\",
        \"session_id\": \"$SESSION_ID\",
        \"session_timeout\": \"$SESSION_TIMEOUT\",
        \"idle_timeout\": \"$IDLE_TIMEOUT\"
    }"
EOF

# Script pré-authentification
cat > /etc/chilli/preauth.sh << 'EOF'
#!/bin/bash
# Script pré-authentification CoovaChilli

# Variables
IP="$FRAMED_IP_ADDRESS"
MAC="$CALLING_STATION_ID"

# Vérification autorisation
RESPONSE=$(curl -s -X POST "$PORTAL_URL/api/v1/portal/check-auth/" \
    -H "Content-Type: application/json" \
    -d "{\"ip\":\"$IP\",\"mac\":\"$MAC\"}")

STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" = "AUTHORIZED" ]; then
    exit 0  # Autoriser
else
    exit 1  # Rediriger vers portail
fi
EOF

chmod +x /etc/chilli/postauth.sh
chmod +x /etc/chilli/preauth.sh

# Redémarrage CoovaChilli
systemctl restart chilli
systemctl enable chilli

echo "CoovaChilli configuré avec succès pour le portail captif"
```

### 10.3 Script Gestion QoS
```bash
#!/bin/bash
# scripts/qos-management.sh

# Gestion QoS avec tc (traffic control)
INTERFACE="eth0"
PORTAL_API="https://captive.example.com/api/v1"

# Fonction création classes QoS
setup_qos() {
    local interface=$1
    
    # Suppression configuration existante
    tc qdisc del dev $interface root 2>/dev/null
    
    # Création qdisc racine HTB
    tc qdisc add dev $interface root handle 1: htb default 30
    
    # Classe racine (100Mbps)
    tc class add dev $interface parent 1: classid 1:1 htb rate 100mbit
    
    # Classes par type d'utilisateur
    tc class add dev $interface parent 1:1 classid 1:10 htb rate 50mbit ceil 80mbit  # Admin
    tc class add dev $interface parent 1:1 classid 1:20 htb rate 30mbit ceil 50mbit  # Subscriber
    tc class add dev $interface parent 1:1 classid 1:30 htb rate 10mbit ceil 20mbit  # Guest
    
    # Filtres par IP/MAC
    tc filter add dev $interface protocol ip parent 1: prio 1 u32 match ip dst 0.0.0.0/0 flowid 1:30
}

# Fonction application règles utilisateur
apply_user_qos() {
    local mac=$1
    local ip=$2
    local user_type=$3
    local rate_limit=$4
    
    case $user_type in
        "ADMIN"|"SUPERADMIN")
            classid="1:10"
            ;;
        "SUBSCRIBER")
            classid="1:20"
            ;;
        "GUEST")
            classid="1:30"
            ;;
        *)
            classid="1:30"
            ;;
    esac
    
    # Application filtre spécifique
    tc filter add dev $INTERFACE protocol ip parent 1: prio 1 \
        u32 match ip src $ip/32 flowid $classid
        
    # Limitation spécifique si définie
    if [ ! -z "$rate_limit" ]; then
        tc class add dev $INTERFACE parent $classid classid ${classid}:1 \
            htb rate ${rate_limit}kbit ceil ${rate_limit}kbit
        tc filter add dev $INTERFACE protocol ip parent 1: prio 2 \
            u32 match ip src $ip/32 flowid ${classid}:1
    fi
}

# Fonction surveillance quotas
monitor_quotas() {
    while true; do
        # Récupération sessions actives
        SESSIONS=$(curl -s "$PORTAL_API/access/sessions/active/" \
            -H "Authorization: Bearer $API_TOKEN")
        
        echo "$SESSIONS" | jq -r '.results[] | @base64' | while read session; do
            SESSION_DATA=$(echo $session | base64 -d)
            
            MAC=$(echo $SESSION_DATA | jq -r '.mac_address')
            IP=$(echo $SESSION_DATA | jq -r '.ip_address')
            USER_ID=$(echo $SESSION_DATA | jq -r '.user_id')
            
            # Vérification quotas
            QUOTA_STATUS=$(curl -s "$PORTAL_API/access/sessions/$SESSION_ID/quota/" \
                -H "Authorization: Bearer $API_TOKEN")
            
            QUOTA_EXCEEDED=$(echo $QUOTA_STATUS | jq -r '.quota_exceeded')
            
            if [ "$QUOTA_EXCEEDED" = "true" ]; then
                # Coupure connexion
                iptables -I FORWARD -m mac --mac-source $MAC -j DROP
                
                # Notification portail
                curl -s -X POST "$PORTAL_API/access/sessions/$SESSION_ID/terminate/" \
                    -H "Authorization: Bearer $API_TOKEN" \
                    -d '{"reason": "quota_exceeded"}'
            fi
        done
        
        sleep 30  # Vérification toutes les 30 secondes
    done
}

# Initialisation QoS
setup_qos $INTERFACE

# Démarrage monitoring
monitor_quotas &

echo "QoS configuré et monitoring démarré"
```

## 11. Documentation et Guides

### 11.1 Guide Installation
```markdown
# Guide d'Installation - Portail Captif Entreprise

## Prérequis Système

### Serveur Principal
- Ubuntu 22.04 LTS ou CentOS 8+
- 4 CPU cores minimum
- 8 GB RAM minimum
- 100 GB stockage SSD
- Connexion Internet stable

### Base de Données
- PostgreSQL 15+
- Redis 7+
- Backup automatisé

### Réseau
- Routeur compatible OpenNDS ou CoovaChilli
- VLAN séparé pour portail captif
- Certificat SSL valide

## Installation Automatisée

### 1. Clonage du Repository
```bash
git clone https://github.com/company/captive-portal.git
cd captive-portal
```

### 2. Configuration Environnement
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

### 3. Déploiement Docker
```bash
docker-compose up -d
```

### 4. Initialisation Base de Données
```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py loaddata initial_data.json
```

### 5. Configuration Réseau
```bash
# OpenNDS
sudo ./scripts/opennds-integration.sh

# Ou CoovaChilli
sudo ./scripts/coovachilli-integration.sh
```

## Configuration Post-Installation

### 1. Accès Interface Admin
- URL: https://votre-domaine.com/admin/
- Créer comptes administrateurs
- Configurer plans d'abonnement

### 2. Test Fonctionnement
- Connexion Wi-Fi test
- Vérification redirection portail
- Test inscription/connexion
- Validation quotas

### 3. Monitoring
- Accès Grafana: https://votre-domaine.com:3000/
- Configuration alertes
- Vérification métriques
```

### 11.2 Guide Utilisateur
```markdown
# Guide Utilisateur - Portail Captif

## Connexion Internet

### 1. Connexion Wi-Fi
1. Sélectionner le réseau Wi-Fi "Entreprise-Guest"
2. Se connecter (aucun mot de passe requis)
3. Redirection automatique vers le portail

### 2. Création Compte Abonné
1. Cliquer "Créer un compte abonné"
2. Remplir le formulaire d'inscription
3. Vérifier votre email
4. Attendre validation administrateur
5. Recevoir notification d'activation

### 3. Connexion avec Code Invité
1. Cliquer "Code d'accès invité"
2. Saisir le code 8 caractères
3. Accès immédiat avec quotas limités

## Gestion de Compte

### 1. Tableau de Bord
- Consultation usage données/temps
- Gestion appareils connectés
- Historique connexions
- Notifications quotas

### 2. Profil Utilisateur
- Modification informations personnelles
- Changement mot de passe
- Configuration 2FA (recommandé)
- Préférences notifications

### 3. Gestion Appareils
- Ajout nouveaux appareils (MAC address)
- Suppression appareils non utilisés
- Limite selon plan d'abonnement

## Quotas et Limitations

### 1. Types de Quotas
- **Données**: Volume up/down mensuel
- **Temps**: Durée connexion mensuelle
- **Appareils**: Nombre simultané

### 2. Surveillance Usage
- Alertes à 80% et 90% des quotas
- Coupure automatique à 100%
- Possibilité extension (payante)

### 3. Renouvellement
- Automatique si abonnement actif
- Notification avant expiration
- Possibilité changement de plan
```

Ce plan de développement complet couvre tous les aspects de votre plateforme de portail captif entreprise. Il respecte les spécifications techniques, intègre les templates RocketBoard adaptés aux besoins métier, et fournit une architecture robuste et sécurisée.

La structure modulaire permet un développement itératif avec des tests complets à chaque étape. L'accent mis sur la sécurité, l'audit et la conformité garantit une solution professionnelle adaptée aux environnements d'entreprise.