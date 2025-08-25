-- Schéma Base de Données Complet - Portail Captif Entreprise
-- PostgreSQL 15+

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- UTILISATEURS ET AUTHENTIFICATION
-- ============================================================================

-- Table utilisateurs principale
CREATE TABLE accounts_user (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Informations de base
    email VARCHAR(254) UNIQUE NOT NULL,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    
    -- Authentification
    password VARCHAR(128) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    
    -- Rôles métier
    role VARCHAR(20) CHECK (role IN ('SUPERADMIN', 'ADMIN', 'SUBSCRIBER', 'GUEST')) NOT NULL DEFAULT 'SUBSCRIBER',
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'PENDING_VALIDATION', 'SUSPENDED', 'REVOKED')) NOT NULL DEFAULT 'PENDING_VALIDATION',
    
    -- 2FA et sécurité
    mfa_secret VARCHAR(200),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_backup_codes TEXT[], -- Codes de récupération chiffrés
    
    -- Vérifications
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(64),
    email_verification_expires TIMESTAMPTZ,
    
    -- Mot de passe
    password_reset_token VARCHAR(64),
    password_reset_expires TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ DEFAULT NOW(),
    password_history JSONB DEFAULT '[]', -- Hash des 5 derniers mots de passe
    
    -- Connexions
    last_login TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Index pour performances
CREATE INDEX idx_accounts_user_email ON accounts_user(email);
CREATE INDEX idx_accounts_user_username ON accounts_user(username);
CREATE INDEX idx_accounts_user_role_status ON accounts_user(role, status);
CREATE INDEX idx_accounts_user_uuid ON accounts_user(uuid);
CREATE INDEX idx_accounts_user_email_verification ON accounts_user(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_accounts_user_password_reset ON accounts_user(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_user_updated_at 
    BEFORE UPDATE ON accounts_user 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction vérification limites rôles
CREATE OR REPLACE FUNCTION check_role_limits() RETURNS TRIGGER AS $$
BEGIN
    -- Vérification SUPERADMIN (max 2)
    IF NEW.role = 'SUPERADMIN' AND NEW.status = 'ACTIVE' AND (
        SELECT COUNT(*) FROM accounts_user 
        WHERE role = 'SUPERADMIN' AND status = 'ACTIVE' AND id != COALESCE(NEW.id, 0)
    ) >= 2 THEN
        RAISE EXCEPTION 'Maximum 2 SUPERADMIN autorisés';
    END IF;
    
    -- Vérification ADMIN (max 3)
    IF NEW.role = 'ADMIN' AND NEW.status = 'ACTIVE' AND (
        SELECT COUNT(*) FROM accounts_user 
        WHERE role = 'ADMIN' AND status = 'ACTIVE' AND id != COALESCE(NEW.id, 0)
    ) >= 3 THEN
        RAISE EXCEPTION 'Maximum 3 ADMIN autorisés';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_role_limits
    BEFORE INSERT OR UPDATE ON accounts_user
    FOR EACH ROW EXECUTE FUNCTION check_role_limits();

-- ============================================================================
-- PLANS ET ABONNEMENTS
-- ============================================================================

-- Table plans d'abonnement
CREATE TABLE billing_plan (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Identification
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Type et tarification
    plan_type VARCHAR(20) CHECK (plan_type IN ('MONTHLY', 'WEEKLY', 'TEMPORARY')) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Quotas
    max_devices INTEGER DEFAULT 1 CHECK (max_devices > 0),
    data_quota_gb INTEGER DEFAULT 1 CHECK (data_quota_gb > 0),
    time_quota_hours INTEGER DEFAULT 24 CHECK (time_quota_hours > 0),
    
    -- Limitations avancées
    max_concurrent_sessions INTEGER DEFAULT 1,
    bandwidth_limit_kbps INTEGER, -- Limitation bande passante
    allowed_hours JSONB DEFAULT '{"start": "00:00", "end": "23:59"}', -- Heures autorisées
    allowed_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- Jours semaine (1=lundi)
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE, -- Visible aux utilisateurs
    is_default BOOLEAN DEFAULT FALSE, -- Plan par défaut
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_billing_plan_code ON billing_plan(code);
CREATE INDEX idx_billing_plan_type_active ON billing_plan(plan_type, is_active);
CREATE INDEX idx_billing_plan_public ON billing_plan(is_public) WHERE is_public = TRUE;

CREATE TRIGGER update_billing_plan_updated_at 
    BEFORE UPDATE ON billing_plan 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table abonnements utilisateurs
CREATE TABLE billing_subscription (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Relations
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    plan_id BIGINT REFERENCES billing_plan(id) ON DELETE PROTECT,
    
    -- Statut
    status VARCHAR(20) CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED')) DEFAULT 'PENDING',
    
    -- Période
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- Renouvellement
    auto_renew BOOLEAN DEFAULT FALSE,
    renewal_attempts INTEGER DEFAULT 0,
    last_renewal_attempt TIMESTAMPTZ,
    
    -- Validation administrative
    validated_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    
    -- Facturation
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_date TIMESTAMPTZ,
    
    -- Usage actuel (cache pour performances)
    current_data_usage_gb DECIMAL(10,3) DEFAULT 0.000,
    current_time_usage_hours DECIMAL(8,2) DEFAULT 0.00,
    current_device_count INTEGER DEFAULT 0,
    last_usage_update TIMESTAMPTZ DEFAULT NOW(),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_dates CHECK (end_date > start_date),
    CONSTRAINT valid_amount CHECK (amount_paid >= 0)
);

CREATE INDEX idx_billing_subscription_user ON billing_subscription(user_id);
CREATE INDEX idx_billing_subscription_plan ON billing_subscription(plan_id);
CREATE INDEX idx_billing_subscription_status ON billing_subscription(status);
CREATE INDEX idx_billing_subscription_dates ON billing_subscription(start_date, end_date);
CREATE INDEX idx_billing_subscription_active ON billing_subscription(user_id, status) WHERE status = 'ACTIVE';

CREATE TRIGGER update_billing_subscription_updated_at 
    BEFORE UPDATE ON billing_subscription 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- APPAREILS ET SESSIONS
-- ============================================================================

-- Table appareils utilisateurs
CREATE TABLE access_device (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Relations
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    
    -- Identification réseau
    mac_address VARCHAR(17) NOT NULL, -- Format AA:BB:CC:DD:EE:FF
    name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'unknown', -- smartphone, laptop, tablet, etc.
    
    -- Informations réseau
    last_ip INET,
    last_seen TIMESTAMPTZ,
    user_agent TEXT,
    
    -- Statut
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMPTZ,
    revoked_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    revoked_reason TEXT,
    
    -- Statistiques
    total_sessions INTEGER DEFAULT 0,
    total_data_gb DECIMAL(12,3) DEFAULT 0.000,
    total_time_hours DECIMAL(10,2) DEFAULT 0.00,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    UNIQUE(user_id, mac_address),
    CONSTRAINT valid_mac_address CHECK (mac_address ~* '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$')
);

CREATE INDEX idx_access_device_mac ON access_device(mac_address);
CREATE INDEX idx_access_device_user_active ON access_device(user_id, is_revoked);
CREATE INDEX idx_access_device_last_seen ON access_device(last_seen DESC);

CREATE TRIGGER update_access_device_updated_at 
    BEFORE UPDATE ON access_device 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Table sessions de connexion
CREATE TABLE access_session (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Relations
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    device_id BIGINT REFERENCES access_device(id) ON DELETE CASCADE,
    subscription_id BIGINT REFERENCES billing_subscription(id) ON DELETE SET NULL,
    
    -- Identification réseau
    mac_address VARCHAR(17) NOT NULL,
    ip_address INET NOT NULL,
    
    -- Statut session
    status VARCHAR(20) CHECK (status IN ('PENDING', 'AUTHORIZED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'QUOTA_EXCEEDED', 'TERMINATED')) DEFAULT 'PENDING',
    
    -- Temporalité
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    -- Usage
    bytes_uploaded BIGINT DEFAULT 0,
    bytes_downloaded BIGINT DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    
    -- Quotas au moment de la session (snapshot)
    allocated_data_gb INTEGER,
    allocated_time_hours INTEGER,
    
    -- Token et sécurité
    session_token VARCHAR(64) UNIQUE,
    portal_session_id VARCHAR(100), -- ID session OpenNDS/CoovaChilli
    
    -- Informations techniques
    user_agent TEXT,
    portal_type VARCHAR(20) CHECK (portal_type IN ('OPENNDS', 'COOVACHILLI', 'MANUAL')) DEFAULT 'MANUAL',
    
    -- Terminaison
    termination_reason VARCHAR(50),
    terminated_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_bytes CHECK (bytes_uploaded >= 0 AND bytes_downloaded >= 0),
    CONSTRAINT valid_duration CHECK (duration_seconds >= 0)
);

CREATE INDEX idx_access_session_mac_status ON access_session(mac_address, status);
CREATE INDEX idx_access_session_token ON access_session(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX idx_access_session_time ON access_session(start_time, end_time);
CREATE INDEX idx_access_session_user_active ON access_session(user_id, status) WHERE status IN ('AUTHORIZED', 'ACTIVE');
CREATE INDEX idx_access_session_device ON access_session(device_id);
CREATE INDEX idx_access_session_portal ON access_session(portal_session_id) WHERE portal_session_id IS NOT NULL;

CREATE TRIGGER update_access_session_updated_at 
    BEFORE UPDATE ON access_session 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction génération token session
CREATE OR REPLACE FUNCTION generate_session_token() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.session_token IS NULL THEN
        NEW.session_token = encode(gen_random_bytes(32), 'base64');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_session_token
    BEFORE INSERT ON access_session
    FOR EACH ROW EXECUTE FUNCTION generate_session_token();

-- ============================================================================
-- VOUCHERS INVITÉS
-- ============================================================================

-- Table vouchers/codes invités
CREATE TABLE access_voucher (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Code d'accès
    code VARCHAR(8) UNIQUE NOT NULL,
    
    -- Plan associé
    plan_id BIGINT REFERENCES billing_plan(id) ON DELETE CASCADE,
    
    -- Utilisation
    max_uses INTEGER DEFAULT 1 CHECK (max_uses > 0),
    used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
    
    -- Validité
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Statut
    status VARCHAR(20) CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED')) DEFAULT 'ACTIVE',
    
    -- Création et attribution
    created_by_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    assigned_to_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    
    -- Utilisation
    first_used_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Révocation
    revoked_at TIMESTAMPTZ,
    revoked_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    revoked_reason TEXT,
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_dates CHECK (valid_until > valid_from),
    CONSTRAINT valid_usage CHECK (used_count <= max_uses)
);

CREATE INDEX idx_access_voucher_code ON access_voucher(code);
CREATE INDEX idx_access_voucher_status_validity ON access_voucher(status, valid_from, valid_until);
CREATE INDEX idx_access_voucher_created_by ON access_voucher(created_by_id);
CREATE INDEX idx_access_voucher_assigned_to ON access_voucher(assigned_to_id) WHERE assigned_to_id IS NOT NULL;

CREATE TRIGGER update_access_voucher_updated_at 
    BEFORE UPDATE ON access_voucher 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction génération code voucher
CREATE OR REPLACE FUNCTION generate_voucher_code() RETURNS TRIGGER AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        LOOP
            result := '';
            FOR i IN 1..8 LOOP
                result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
            END LOOP;
            
            -- Vérifier unicité
            IF NOT EXISTS (SELECT 1 FROM access_voucher WHERE code = result) THEN
                EXIT;
            END IF;
        END LOOP;
        NEW.code := result;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_voucher_code
    BEFORE INSERT ON access_voucher
    FOR EACH ROW EXECUTE FUNCTION generate_voucher_code();

-- Table utilisation vouchers (historique)
CREATE TABLE access_voucher_usage (
    id BIGSERIAL PRIMARY KEY,
    
    -- Relations
    voucher_id BIGINT REFERENCES access_voucher(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES access_session(id) ON DELETE CASCADE,
    
    -- Informations utilisation
    used_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET NOT NULL,
    mac_address VARCHAR(17) NOT NULL,
    user_agent TEXT,
    
    -- Résultat
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT
);

CREATE INDEX idx_access_voucher_usage_voucher ON access_voucher_usage(voucher_id);
CREATE INDEX idx_access_voucher_usage_session ON access_voucher_usage(session_id);
CREATE INDEX idx_access_voucher_usage_time ON access_voucher_usage(used_at);

-- ============================================================================
-- PORTAIL CAPTIF
-- ============================================================================

-- Table configuration système
CREATE TABLE portal_systemconfig (
    id BIGSERIAL PRIMARY KEY,
    
    -- Configuration
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'integer', 'boolean', 'json')),
    description TEXT,
    
    -- Validation
    validation_regex VARCHAR(500),
    is_sensitive BOOLEAN DEFAULT FALSE, -- Masquer dans logs
    requires_restart BOOLEAN DEFAULT FALSE, -- Redémarrage service requis
    
    -- Modification
    last_modified_by_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Historique (pour rollback)
    previous_value TEXT,
    change_reason TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portal_systemconfig_key ON portal_systemconfig(key);
CREATE INDEX idx_portal_systemconfig_sensitive ON portal_systemconfig(is_sensitive);

-- Table bindings portail captif
CREATE TABLE portal_captivebinding (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identification réseau
    mac_address VARCHAR(17) NOT NULL,
    ip_address INET NOT NULL,
    
    -- Relations
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES access_session(id) ON DELETE CASCADE,
    
    -- Autorisation
    authorized_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Source autorisation
    source VARCHAR(20) CHECK (source IN ('OPENNDS', 'COOVACHILLI', 'MANUAL')) DEFAULT 'MANUAL',
    portal_session_id VARCHAR(100),
    
    -- Redirection
    original_url TEXT,
    redirect_url TEXT,
    
    -- Statut
    is_active BOOLEAN DEFAULT TRUE,
    deauthorized_at TIMESTAMPTZ,
    deauth_reason TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_portal_binding_mac_auth ON portal_captivebinding(mac_address, authorized_at);
CREATE INDEX idx_portal_binding_expires ON portal_captivebinding(expires_at);
CREATE INDEX idx_portal_binding_session ON portal_captivebinding(session_id);
CREATE INDEX idx_portal_binding_active ON portal_captivebinding(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- AUDIT ET LOGS
-- ============================================================================

-- Table logs audit (immuable)
CREATE TABLE audit_auditlog (
    id BIGSERIAL PRIMARY KEY,
    
    -- Acteur
    actor_id BIGINT REFERENCES accounts_user(id) ON DELETE SET NULL,
    actor_email VARCHAR(254), -- Snapshot au moment de l'action
    actor_role VARCHAR(20), -- Snapshot du rôle
    
    -- Action
    action VARCHAR(30) CHECK (action IN (
        'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
        'VALIDATE', 'REVOKE', 'SUSPEND', 'REACTIVATE',
        'CONFIG_CHANGE', 'PASSWORD_CHANGE', '2FA_ENABLE', '2FA_DISABLE',
        'SESSION_START', 'SESSION_END', 'QUOTA_EXCEEDED',
        'VOUCHER_CREATE', 'VOUCHER_USE', 'VOUCHER_REVOKE'
    )) NOT NULL,
    
    -- Cible
    target_type VARCHAR(50) NOT NULL, -- Nom du modèle
    target_id VARCHAR(50), -- ID de l'objet
    target_repr TEXT, -- Représentation textuelle
    
    -- Détails
    metadata JSONB DEFAULT '{}',
    changes JSONB DEFAULT '{}', -- Changements avant/après pour UPDATE
    
    -- Contexte technique
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(36), -- UUID de la requête
    
    -- Intégrité
    content_hash VARCHAR(64), -- SHA-256 du contenu
    
    -- Horodatage
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherches et performances
CREATE INDEX idx_audit_actor_time ON audit_auditlog(actor_id, timestamp DESC);
CREATE INDEX idx_audit_action_time ON audit_auditlog(action, timestamp DESC);
CREATE INDEX idx_audit_target ON audit_auditlog(target_type, target_id);
CREATE INDEX idx_audit_timestamp ON audit_auditlog(timestamp DESC);
CREATE INDEX idx_audit_ip ON audit_auditlog(ip_address) WHERE ip_address IS NOT NULL;

-- Fonction calcul hash intégrité
CREATE OR REPLACE FUNCTION calculate_audit_hash() RETURNS TRIGGER AS $$
BEGIN
    NEW.content_hash := encode(
        digest(
            concat(
                COALESCE(NEW.actor_id::text, ''),
                NEW.action,
                NEW.target_type,
                COALESCE(NEW.target_id, ''),
                COALESCE(NEW.metadata::text, '{}'),
                NEW.timestamp::text
            ),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_audit_hash
    BEFORE INSERT ON audit_auditlog
    FOR EACH ROW EXECUTE FUNCTION calculate_audit_hash();

-- Règles empêchant modification/suppression (immutabilité)
CREATE RULE audit_no_update AS ON UPDATE TO audit_auditlog DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_auditlog DO INSTEAD NOTHING;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Table événements/notifications
CREATE TABLE notifications_event (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    
    -- Type et classification
    event_type VARCHAR(30) CHECK (event_type IN (
        'USER_REGISTRATION', 'USER_VALIDATION', 'USER_SUSPENDED',
        'QUOTA_WARNING', 'QUOTA_EXCEEDED', 'QUOTA_RESET',
        'SESSION_START', 'SESSION_END', 'SESSION_TIMEOUT',
        'VOUCHER_CREATED', 'VOUCHER_USED', 'VOUCHER_EXPIRED',
        'ADMIN_ACTION', 'SYSTEM_CONFIG', 'SECURITY_ALERT',
        'MAINTENANCE_SCHEDULED', 'MAINTENANCE_COMPLETED'
    )) NOT NULL,
    
    priority VARCHAR(10) CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')) DEFAULT 'NORMAL',
    
    -- Destinataire
    user_id BIGINT REFERENCES accounts_user(id) ON DELETE CASCADE,
    
    -- Contenu
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}', -- Données additionnelles
    
    -- Ciblage
    audience VARCHAR(20) CHECK (audience IN ('USER', 'ADMIN', 'SUPERADMIN', 'ALL')) DEFAULT 'USER',
    
    -- Canaux de diffusion
    channels VARCHAR(50)[] DEFAULT ARRAY['web'], -- web, email, sms, push
    
    -- Statut lecture
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Envoi externe
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    sms_sent BOOLEAN DEFAULT FALSE,
    sms_sent_at TIMESTAMPTZ,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read_time ON notifications_event(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_time ON notifications_event(event_type, created_at DESC);
CREATE INDEX idx_notifications_audience_time ON notifications_event(audience, created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications_event(priority, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications_event(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_expires ON notifications_event(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- STATISTIQUES ET MÉTRIQUES
-- ============================================================================

-- Table métriques système (pour monitoring)
CREATE TABLE monitoring_metric (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identification métrique
    name VARCHAR(100) NOT NULL,
    labels JSONB DEFAULT '{}', -- Labels Prometheus-style
    
    -- Valeur
    value DECIMAL(20,6) NOT NULL,
    metric_type VARCHAR(20) CHECK (metric_type IN ('counter', 'gauge', 'histogram')) DEFAULT 'gauge',
    
    -- Horodatage
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monitoring_metric_name_time ON monitoring_metric(name, timestamp DESC);
CREATE INDEX idx_monitoring_metric_labels ON monitoring_metric USING GIN(labels);

-- Vue statistiques utilisateurs actifs
CREATE VIEW stats_active_users AS
SELECT 
    DATE_TRUNC('day', s.start_time) as date,
    COUNT(DISTINCT s.user_id) as unique_users,
    COUNT(*) as total_sessions,
    SUM(s.bytes_uploaded + s.bytes_downloaded) as total_bytes,
    AVG(s.duration_seconds) as avg_duration_seconds
FROM access_session s
WHERE s.status IN ('ACTIVE', 'TERMINATED')
    AND s.start_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', s.start_time)
ORDER BY date DESC;

-- Vue quotas par utilisateur
CREATE VIEW stats_user_quotas AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    s.id as subscription_id,
    p.name as plan_name,
    p.data_quota_gb,
    p.time_quota_hours,
    p.max_devices,
    s.current_data_usage_gb,
    s.current_time_usage_hours,
    s.current_device_count,
    ROUND((s.current_data_usage_gb / p.data_quota_gb * 100)::numeric, 2) as data_usage_percent,
    ROUND((s.current_time_usage_hours / p.time_quota_hours * 100)::numeric, 2) as time_usage_percent
FROM accounts_user u
JOIN billing_subscription s ON u.id = s.user_id
JOIN billing_plan p ON s.plan_id = p.id
WHERE s.status = 'ACTIVE'
    AND u.status = 'ACTIVE';

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction nettoyage sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Marquer sessions expirées
    UPDATE access_session 
    SET status = 'EXPIRED', 
        end_time = NOW(),
        updated_at = NOW()
    WHERE status IN ('ACTIVE', 'AUTHORIZED')
        AND (
            -- Timeout inactivité (2 heures)
            last_activity < NOW() - INTERVAL '2 hours'
            -- Ou quota temps dépassé
            OR duration_seconds > (allocated_time_hours * 3600)
        );
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Nettoyer bindings expirés
    UPDATE portal_captivebinding 
    SET is_active = FALSE,
        deauthorized_at = NOW(),
        deauth_reason = 'expired'
    WHERE is_active = TRUE 
        AND expires_at < NOW();
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction mise à jour usage abonnement
CREATE OR REPLACE FUNCTION update_subscription_usage(p_user_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE billing_subscription s
    SET 
        current_data_usage_gb = (
            SELECT COALESCE(SUM((bytes_uploaded + bytes_downloaded) / 1024.0 / 1024.0 / 1024.0), 0)
            FROM access_session sess
            WHERE sess.user_id = p_user_id
                AND sess.start_time >= s.start_date
                AND sess.start_time < s.end_date
        ),
        current_time_usage_hours = (
            SELECT COALESCE(SUM(duration_seconds / 3600.0), 0)
            FROM access_session sess
            WHERE sess.user_id = p_user_id
                AND sess.start_time >= s.start_date
                AND sess.start_time < s.end_date
        ),
        current_device_count = (
            SELECT COUNT(DISTINCT d.id)
            FROM access_device d
            WHERE d.user_id = p_user_id
                AND d.is_revoked = FALSE
        ),
        last_usage_update = NOW(),
        updated_at = NOW()
    WHERE s.user_id = p_user_id
        AND s.status = 'ACTIVE';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONNÉES INITIALES
-- ============================================================================

-- Plans par défaut
INSERT INTO billing_plan (code, name, description, plan_type, price, max_devices, data_quota_gb, time_quota_hours, is_default) VALUES
('GUEST_1H', 'Accès Invité 1H', 'Accès temporaire 1 heure', 'TEMPORARY', 0.00, 1, 1, 1, FALSE),
('GUEST_1D', 'Accès Invité 1 Jour', 'Accès temporaire 24 heures', 'TEMPORARY', 2.99, 1, 5, 24, FALSE),
('WEEKLY_BASIC', 'Hebdomadaire Basic', 'Abonnement hebdomadaire basique', 'WEEKLY', 9.99, 3, 25, 168, FALSE),
('MONTHLY_STANDARD', 'Mensuel Standard', 'Abonnement mensuel standard', 'MONTHLY', 29.99, 5, 100, 720, TRUE),
('MONTHLY_PREMIUM', 'Mensuel Premium', 'Abonnement mensuel premium', 'MONTHLY', 49.99, 10, 250, 720, FALSE);

-- Configuration système par défaut
INSERT INTO portal_systemconfig (key, value, description, value_type) VALUES
('portal.title', 'CaptiveNet Enterprise', 'Titre du portail captif', 'string'),
('portal.welcome_message', 'Bienvenue sur notre réseau Wi-Fi', 'Message d''accueil', 'string'),
('portal.terms_url', '/terms/', 'URL des conditions d''utilisation', 'string'),
('portal.privacy_url', '/privacy/', 'URL de la politique de confidentialité', 'string'),
('portal.support_email', 'support@example.com', 'Email de support', 'string'),
('portal.session_timeout', '7200', 'Timeout session en secondes (2h)', 'integer'),
('portal.max_login_attempts', '5', 'Tentatives de connexion max', 'integer'),
('portal.lockout_duration', '300', 'Durée blocage en secondes (5min)', 'integer'),
('quotas.warning_threshold', '80', 'Seuil alerte quota (%)', 'integer'),
('quotas.critical_threshold', '90', 'Seuil critique quota (%)', 'integer'),
('notifications.email_enabled', 'true', 'Notifications email activées', 'boolean'),
('notifications.sms_enabled', 'false', 'Notifications SMS activées', 'boolean'),
('security.require_email_verification', 'true', 'Vérification email obligatoire', 'boolean'),
('security.require_admin_validation', 'true', 'Validation admin obligatoire', 'boolean'),
('security.password_min_length', '12', 'Longueur minimale mot de passe', 'integer'),
('security.mfa_required_for_admins', 'true', '2FA obligatoire pour admins', 'boolean');

-- ============================================================================
-- VUES MATÉRIALISÉES POUR PERFORMANCES
-- ============================================================================

-- Vue matérialisée statistiques quotidiennes
CREATE MATERIALIZED VIEW daily_stats AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    'user_registrations' as metric,
    COUNT(*) as value
FROM accounts_user
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
    DATE_TRUNC('day', start_time) as date,
    'sessions_started' as metric,
    COUNT(*) as value
FROM access_session
WHERE start_time >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', start_time)

UNION ALL

SELECT 
    DATE_TRUNC('day', used_at) as date,
    'vouchers_used' as metric,
    COUNT(*) as value
FROM access_voucher_usage
WHERE used_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', used_at);

CREATE UNIQUE INDEX idx_daily_stats_date_metric ON daily_stats(date, metric);

-- Rafraîchissement automatique des vues matérialisées
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSIONS ET SÉCURITÉ
-- ============================================================================

-- Rôle lecture seule pour monitoring
CREATE ROLE monitoring_readonly;
GRANT CONNECT ON DATABASE captive_portal TO monitoring_readonly;
GRANT USAGE ON SCHEMA public TO monitoring_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_readonly;
GRANT SELECT ON daily_stats TO monitoring_readonly;

-- Rôle application
CREATE ROLE app_user;
GRANT CONNECT ON DATABASE captive_portal TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT DELETE ON access_session, portal_captivebinding TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Interdire DELETE sur tables critiques
REVOKE DELETE ON accounts_user, billing_plan, billing_subscription, audit_auditlog FROM app_user;

-- ============================================================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE accounts_user IS 'Utilisateurs du système avec authentification et rôles';
COMMENT ON TABLE billing_plan IS 'Plans d''abonnement avec quotas et tarification';
COMMENT ON TABLE billing_subscription IS 'Abonnements actifs des utilisateurs';
COMMENT ON TABLE access_device IS 'Appareils enregistrés par utilisateur';
COMMENT ON TABLE access_session IS 'Sessions de connexion avec usage et quotas';
COMMENT ON TABLE access_voucher IS 'Codes d''accès temporaire pour invités';
COMMENT ON TABLE portal_captivebinding IS 'Bindings actifs du portail captif';
COMMENT ON TABLE audit_auditlog IS 'Logs d''audit immuables pour traçabilité';
COMMENT ON TABLE notifications_event IS 'Notifications et événements système';
COMMENT ON TABLE portal_systemconfig IS 'Configuration système modifiable';

-- Fin du schéma