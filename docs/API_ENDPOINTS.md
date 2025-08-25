# Documentation API Complète - Portail Captif Entreprise

## Vue d'ensemble

L'API REST suit les conventions RESTful avec authentification JWT et gestion des rôles RBAC.

**Base URL**: `https://api.captive.example.com/api/v1/`

**Authentification**: Bearer Token (JWT) dans l'en-tête `Authorization`

**Format**: JSON uniquement

**Versioning**: Via URL (`/api/v1/`)

## Codes de Réponse Standards

| Code | Description |
|------|-------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 204  | Succès sans contenu |
| 400  | Requête invalide |
| 401  | Non authentifié |
| 403  | Accès interdit |
| 404  | Ressource non trouvée |
| 409  | Conflit (ressource existe) |
| 422  | Erreur de validation |
| 429  | Trop de requêtes |
| 500  | Erreur serveur |

## Structure des Erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": {
      "email": ["Cette adresse email est déjà utilisée"],
      "password": ["Le mot de passe doit contenir au moins 12 caractères"]
    },
    "request_id": "req_123456789"
  }
}
```

---

## 1. Authentification & Autorisation

### 1.1 Connexion

**POST** `/auth/login/`

Authentification par email/mot de passe avec support 2FA.

**Paramètres:**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "totp_code": "123456",  // Optionnel si 2FA activé
  "remember_me": true     // Optionnel, défaut: false
}
```

**Réponse 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "user123",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "SUBSCRIBER",
    "status": "ACTIVE",
    "email_verified": true,
    "mfa_enabled": false,
    "last_login": "2024-01-15T14:30:00Z",
    "created_at": "2024-01-01T10:00:00Z"
  }
}
```

**Erreurs:**
- `401`: Identifiants invalides
- `403`: Compte suspendu/révoqué
- `422`: 2FA requis mais non fourni

---

### 1.2 Rafraîchissement Token

**POST** `/auth/refresh/`

**Paramètres:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse 200:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

---

### 1.3 Déconnexion

**POST** `/auth/logout/`

Invalide le token actuel et optionnellement tous les tokens de l'utilisateur.

**Paramètres:**
```json
{
  "all_devices": false  // Optionnel, déconnecte tous les appareils
}
```

**Réponse 204:** Aucun contenu

---

### 1.4 Inscription

**POST** `/auth/register/`

Inscription d'un nouvel utilisateur (SUBSCRIBER uniquement).

**Paramètres:**
```json
{
  "email": "nouveau@example.com",
  "username": "nouveau_user",
  "first_name": "Nouveau",
  "last_name": "Utilisateur",
  "phone": "+33123456789",  // Optionnel
  "password": "motdepassefort123!",
  "password_confirm": "motdepassefort123!",
  "terms_accepted": true,
  "privacy_accepted": true
}
```

**Réponse 201:**
```json
{
  "user": {
    "id": 124,
    "uuid": "550e8400-e29b-41d4-a716-446655440001",
    "email": "nouveau@example.com",
    "username": "nouveau_user",
    "status": "PENDING_VALIDATION",
    "email_verified": false,
    "created_at": "2024-01-15T15:00:00Z"
  },
  "message": "Inscription réussie. Vérifiez votre email et attendez la validation administrative."
}
```

---

### 1.5 Profil Utilisateur

**GET** `/auth/profile/`

Récupère le profil de l'utilisateur connecté.

**Réponse 200:**
```json
{
  "id": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "user123",
  "first_name": "Jean",
  "last_name": "Dupont",
  "phone": "+33123456789",
  "role": "SUBSCRIBER",
  "status": "ACTIVE",
  "email_verified": true,
  "mfa_enabled": false,
  "last_login": "2024-01-15T14:30:00Z",
  "last_password_change": "2024-01-01T10:00:00Z",
  "created_at": "2024-01-01T10:00:00Z",
  "subscription": {
    "id": 456,
    "plan": {
      "name": "Mensuel Standard",
      "data_quota_gb": 100,
      "time_quota_hours": 720,
      "max_devices": 5
    },
    "status": "ACTIVE",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "current_usage": {
      "data_gb": 45.2,
      "time_hours": 127.5,
      "devices": 3
    }
  }
}
```

**PUT** `/auth/profile/`

Met à jour le profil utilisateur.

**Paramètres:**
```json
{
  "first_name": "Jean-Michel",
  "last_name": "Dupont-Martin",
  "phone": "+33987654321"
}
```

---

### 1.6 Gestion Mot de Passe

**POST** `/auth/change-password/`

**Paramètres:**
```json
{
  "current_password": "ancienmdp123",
  "new_password": "nouveaumdp456!",
  "new_password_confirm": "nouveaumdp456!"
}
```

**POST** `/auth/forgot-password/`

**Paramètres:**
```json
{
  "email": "user@example.com"
}
```

**POST** `/auth/reset-password/`

**Paramètres:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "nouveaumdp789!",
  "new_password_confirm": "nouveaumdp789!"
}
```

---

### 1.7 Vérification Email

**POST** `/auth/verify-email/`

**Paramètres:**
```json
{
  "token": "verification_token_from_email"
}
```

**POST** `/auth/resend-verification/`

**Paramètres:**
```json
{
  "email": "user@example.com"
}
```

---

### 1.8 Authentification 2FA

**POST** `/auth/2fa/setup/`

Génère un secret 2FA et QR code.

**Réponse 200:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "backup_codes": [
    "12345678",
    "87654321",
    "11223344",
    "44332211",
    "55667788"
  ]
}
```

**POST** `/auth/2fa/verify/`

Vérifie et active la 2FA.

**Paramètres:**
```json
{
  "totp_code": "123456"
}
```

**POST** `/auth/2fa/disable/`

**Paramètres:**
```json
{
  "password": "motdepasse123",
  "totp_code": "123456"  // Ou backup_code
}
```

**GET** `/auth/2fa/backup-codes/`

Régénère les codes de récupération.

---

## 2. Portail Captif

### 2.1 Autorisation Portail

**POST** `/portal/authorize/`

Endpoint appelé par OpenNDS/CoovaChilli pour autoriser l'accès.

**Paramètres:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "token": "portal_token_optional",
  "url": "http://example.com/original_request"
}
```

**Réponse 200:**
```json
{
  "status": "ALLOW",  // ou "DENY"
  "redirect_url": "https://captive.example.com/portal/welcome/",
  "ttl": 3600,
  "bandwidth_up": 1000,    // kbps
  "bandwidth_down": 5000,  // kbps
  "session_timeout": 7200  // secondes
}
```

---

### 2.2 Connexion Portail

**POST** `/portal/login/`

Connexion via le portail captif (email/password ou voucher).

**Paramètres (Email/Password):**
```json
{
  "type": "credentials",
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "email": "user@example.com",
  "password": "motdepasse123",
  "url": "http://example.com/original_request"
}
```

**Paramètres (Voucher):**
```json
{
  "type": "voucher",
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "code": "GUEST123",
  "url": "http://example.com/original_request"
}
```

**Réponse 200:**
```json
{
  "status": "success",
  "message": "Accès autorisé",
  "session": {
    "id": 789,
    "token": "session_token_abc123",
    "expires_at": "2024-01-15T16:30:00Z",
    "quotas": {
      "data_remaining_gb": 54.8,
      "time_remaining_hours": 592.5
    }
  },
  "redirect_url": "http://example.com/original_request"
}
```

---

### 2.3 Statut Session

**GET** `/portal/status/`

**Paramètres Query:**
- `mac`: Adresse MAC
- `session_token`: Token de session (optionnel)

**Réponse 200:**
```json
{
  "session": {
    "id": 789,
    "status": "ACTIVE",
    "user": {
      "email": "user@example.com",
      "role": "SUBSCRIBER"
    },
    "start_time": "2024-01-15T14:30:00Z",
    "last_activity": "2024-01-15T15:25:00Z",
    "duration_seconds": 3300,
    "usage": {
      "bytes_uploaded": 1048576,
      "bytes_downloaded": 52428800,
      "data_used_gb": 0.05
    },
    "quotas": {
      "data_quota_gb": 100,
      "data_remaining_gb": 99.95,
      "time_quota_hours": 720,
      "time_remaining_hours": 719.08
    },
    "expires_at": "2024-01-15T16:30:00Z"
  }
}
```

---

### 2.4 Déconnexion Portail

**POST** `/portal/logout/`

**Paramètres:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "session_token": "session_token_abc123"
}
```

**Réponse 200:**
```json
{
  "status": "success",
  "message": "Déconnexion réussie",
  "redirect_url": "https://captive.example.com/portal/goodbye/"
}
```

---

### 2.5 Heartbeat Session

**POST** `/portal/heartbeat/`

Maintient la session active et met à jour l'usage.

**Paramètres:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "session_token": "session_token_abc123",
  "bytes_uploaded": 1048576,
  "bytes_downloaded": 52428800
}
```

**Réponse 200:**
```json
{
  "status": "active",
  "expires_at": "2024-01-15T16:30:00Z",
  "quotas": {
    "data_remaining_gb": 99.95,
    "time_remaining_hours": 719.08,
    "warnings": []
  }
}
```

---

## 3. Gestion Utilisateurs (Admin/SuperAdmin)

### 3.1 Liste Utilisateurs

**GET** `/users/`

**Permissions:** ADMIN, SUPERADMIN

**Paramètres Query:**
- `page`: Numéro de page (défaut: 1)
- `page_size`: Taille de page (défaut: 20, max: 100)
- `search`: Recherche dans email/nom
- `role`: Filtrer par rôle
- `status`: Filtrer par statut
- `created_after`: Date ISO 8601
- `created_before`: Date ISO 8601

**Réponse 200:**
```json
{
  "count": 1247,
  "next": "https://api.captive.example.com/api/v1/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "user123",
      "first_name": "Jean",
      "last_name": "Dupont",
      "role": "SUBSCRIBER",
      "status": "ACTIVE",
      "email_verified": true,
      "last_login": "2024-01-15T14:30:00Z",
      "created_at": "2024-01-01T10:00:00Z",
      "subscription": {
        "plan_name": "Mensuel Standard",
        "status": "ACTIVE",
        "expires_at": "2024-02-01T00:00:00Z"
      },
      "stats": {
        "total_sessions": 45,
        "total_data_gb": 234.5,
        "active_devices": 3
      }
    }
  ]
}
```

---

### 3.2 Détail Utilisateur

**GET** `/users/{id}/`

**Permissions:** ADMIN, SUPERADMIN, ou propriétaire

**Réponse 200:**
```json
{
  "id": 123,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "user123",
  "first_name": "Jean",
  "last_name": "Dupont",
  "phone": "+33123456789",
  "role": "SUBSCRIBER",
  "status": "ACTIVE",
  "email_verified": true,
  "mfa_enabled": false,
  "last_login": "2024-01-15T14:30:00Z",
  "last_login_ip": "192.168.1.100",
  "failed_login_attempts": 0,
  "last_password_change": "2024-01-01T10:00:00Z",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "subscription": {
    "id": 456,
    "plan": {
      "id": 1,
      "name": "Mensuel Standard",
      "data_quota_gb": 100,
      "time_quota_hours": 720,
      "max_devices": 5
    },
    "status": "ACTIVE",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "current_usage": {
      "data_gb": 45.2,
      "time_hours": 127.5,
      "devices": 3
    },
    "validated_by": {
      "email": "admin@example.com",
      "validated_at": "2024-01-01T12:00:00Z"
    }
  },
  "devices": [
    {
      "id": 101,
      "name": "iPhone de Jean",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "device_type": "smartphone",
      "last_seen": "2024-01-15T14:30:00Z",
      "is_revoked": false
    }
  ],
  "stats": {
    "total_sessions": 45,
    "total_data_gb": 234.5,
    "total_time_hours": 1250.5,
    "avg_session_duration": 1800,
    "last_session": "2024-01-15T14:30:00Z"
  }
}
```

---

### 3.3 Créer Utilisateur

**POST** `/users/`

**Permissions:** ADMIN, SUPERADMIN

**Paramètres:**
```json
{
  "email": "nouvel@example.com",
  "username": "nouvel_user",
  "first_name": "Nouvel",
  "last_name": "Utilisateur",
  "phone": "+33123456789",
  "role": "SUBSCRIBER",  // ADMIN si SUPERADMIN
  "password": "motdepassetemporaire123!",
  "send_welcome_email": true
}
```

---

### 3.4 Modifier Utilisateur

**PUT** `/users/{id}/`

**Permissions:** ADMIN, SUPERADMIN

**Paramètres:**
```json
{
  "first_name": "Jean-Michel",
  "last_name": "Dupont-Martin",
  "phone": "+33987654321",
  "role": "ADMIN"  // Seulement SUPERADMIN peut modifier les rôles
}
```

---

### 3.5 Actions Utilisateur

**POST** `/users/{id}/validate/`

Valide un compte en attente.

**Permissions:** ADMIN, SUPERADMIN

**Paramètres:**
```json
{
  "notes": "Validation après vérification documents"
}
```

**POST** `/users/{id}/suspend/`

**Paramètres:**
```json
{
  "reason": "Violation des conditions d'utilisation",
  "duration_days": 30  // Optionnel, permanent si omis
}
```

**POST** `/users/{id}/reactivate/`

**Paramètres:**
```json
{
  "notes": "Réactivation après résolution du problème"
}
```

**DELETE** `/users/{id}/`

Suppression définitive (SUPERADMIN uniquement).

---

### 3.6 Comptes en Attente

**GET** `/users/pending/`

**Permissions:** ADMIN, SUPERADMIN

**Réponse 200:**
```json
{
  "count": 12,
  "results": [
    {
      "id": 124,
      "email": "nouveau@example.com",
      "first_name": "Nouveau",
      "last_name": "Utilisateur",
      "created_at": "2024-01-15T15:00:00Z",
      "requested_plan": {
        "id": 1,
        "name": "Mensuel Standard"
      },
      "email_verified": true
    }
  ]
}
```

---

## 4. Plans & Abonnements

### 4.1 Liste Plans

**GET** `/billing/plans/`

Plans publics pour tous, tous les plans pour les admins.

**Paramètres Query:**
- `type`: MONTHLY, WEEKLY, TEMPORARY
- `active_only`: true/false (défaut: true)

**Réponse 200:**
```json
{
  "results": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440002",
      "code": "MONTHLY_STANDARD",
      "name": "Mensuel Standard",
      "description": "Abonnement mensuel avec quotas généreux",
      "plan_type": "MONTHLY",
      "price": 29.99,
      "currency": "EUR",
      "max_devices": 5,
      "data_quota_gb": 100,
      "time_quota_hours": 720,
      "max_concurrent_sessions": 3,
      "bandwidth_limit_kbps": null,
      "is_active": true,
      "is_public": true,
      "is_default": true,
      "features": [
        "Support prioritaire",
        "Accès 24/7",
        "Statistiques détaillées"
      ]
    }
  ]
}
```

---

### 4.2 Créer Plan

**POST** `/billing/plans/`

**Permissions:** SUPERADMIN

**Paramètres:**
```json
{
  "code": "PREMIUM_MONTHLY",
  "name": "Mensuel Premium",
  "description": "Plan premium avec quotas étendus",
  "plan_type": "MONTHLY",
  "price": 49.99,
  "currency": "EUR",
  "max_devices": 10,
  "data_quota_gb": 250,
  "time_quota_hours": 720,
  "max_concurrent_sessions": 5,
  "bandwidth_limit_kbps": 10000,
  "allowed_hours": {
    "start": "06:00",
    "end": "23:00"
  },
  "allowed_days": [1, 2, 3, 4, 5, 6, 7],
  "is_public": true
}
```

---

### 4.3 Abonnements

**GET** `/billing/subscriptions/`

Mes abonnements (utilisateur) ou tous (admin).

**GET** `/billing/subscriptions/{id}/`

**POST** `/billing/subscriptions/`

Créer un abonnement.

**Paramètres:**
```json
{
  "plan_id": 1,
  "start_date": "2024-01-15T00:00:00Z",
  "auto_renew": true,
  "payment_method": "credit_card",
  "payment_reference": "ch_1234567890"
}
```

**POST** `/billing/subscriptions/{id}/validate/`

Validation administrative.

**Permissions:** ADMIN, SUPERADMIN

---

## 5. Appareils & Sessions

### 5.1 Mes Appareils

**GET** `/access/devices/`

**Réponse 200:**
```json
{
  "results": [
    {
      "id": 101,
      "uuid": "550e8400-e29b-41d4-a716-446655440003",
      "name": "iPhone de Jean",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "device_type": "smartphone",
      "last_ip": "192.168.1.100",
      "last_seen": "2024-01-15T14:30:00Z",
      "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      "is_revoked": false,
      "stats": {
        "total_sessions": 25,
        "total_data_gb": 12.5,
        "total_time_hours": 45.2,
        "last_session": "2024-01-15T14:30:00Z"
      },
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**POST** `/access/devices/`

Ajouter un appareil.

**Paramètres:**
```json
{
  "name": "MacBook Pro",
  "mac_address": "BB:CC:DD:EE:FF:AA",
  "device_type": "laptop"
}
```

---

### 5.2 Sessions

**GET** `/access/sessions/`

Mes sessions ou toutes (admin).

**Paramètres Query:**
- `status`: ACTIVE, TERMINATED, EXPIRED, etc.
- `device_id`: Filtrer par appareil
- `start_date`: Date début
- `end_date`: Date fin

**Réponse 200:**
```json
{
  "count": 156,
  "results": [
    {
      "id": 789,
      "uuid": "550e8400-e29b-41d4-a716-446655440004",
      "user": {
        "email": "user@example.com",
        "role": "SUBSCRIBER"
      },
      "device": {
        "name": "iPhone de Jean",
        "mac_address": "AA:BB:CC:DD:EE:FF"
      },
      "ip_address": "192.168.1.100",
      "status": "ACTIVE",
      "start_time": "2024-01-15T14:30:00Z",
      "end_time": null,
      "last_activity": "2024-01-15T15:25:00Z",
      "duration_seconds": 3300,
      "bytes_uploaded": 1048576,
      "bytes_downloaded": 52428800,
      "portal_type": "OPENNDS",
      "quotas": {
        "allocated_data_gb": 100,
        "allocated_time_hours": 720,
        "data_used_gb": 0.05,
        "time_used_hours": 0.92
      }
    }
  ]
}
```

**POST** `/access/sessions/{id}/terminate/`

Terminer une session.

**Permissions:** ADMIN, SUPERADMIN, ou propriétaire

---

## 6. Vouchers Invités

### 6.1 Gestion Vouchers

**GET** `/access/vouchers/`

**Permissions:** ADMIN, SUPERADMIN

**Paramètres Query:**
- `status`: ACTIVE, USED, EXPIRED, REVOKED
- `plan_id`: Filtrer par plan
- `created_by`: Filtrer par créateur

**Réponse 200:**
```json
{
  "results": [
    {
      "id": 201,
      "uuid": "550e8400-e29b-41d4-a716-446655440005",
      "code": "GUEST123",
      "plan": {
        "name": "Accès Invité 1 Jour",
        "data_quota_gb": 5,
        "time_quota_hours": 24
      },
      "max_uses": 1,
      "used_count": 0,
      "valid_from": "2024-01-15T00:00:00Z",
      "valid_until": "2024-01-22T23:59:59Z",
      "status": "ACTIVE",
      "created_by": {
        "email": "admin@example.com"
      },
      "assigned_to": null,
      "first_used_at": null,
      "last_used_at": null,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**POST** `/access/vouchers/`

Créer des vouchers.

**Permissions:** ADMIN, SUPERADMIN

**Paramètres:**
```json
{
  "plan_id": 2,
  "quantity": 10,  // Nombre de codes à générer
  "max_uses": 1,
  "valid_from": "2024-01-15T00:00:00Z",
  "valid_until": "2024-01-22T23:59:59Z",
  "notes": "Codes pour événement client"
}
```

**Réponse 201:**
```json
{
  "vouchers": [
    {
      "code": "GUEST123",
      "id": 201
    },
    {
      "code": "GUEST124",
      "id": 202
    }
  ],
  "message": "10 codes créés avec succès"
}
```

---

### 6.2 Utilisation Voucher

**GET** `/access/vouchers/{code}/`

Détails d'un voucher (public pour vérification).

**POST** `/access/vouchers/{code}/use/`

Utiliser un voucher (appelé par le portail).

**Paramètres:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

**POST** `/access/vouchers/{code}/revoke/`

Révoquer un voucher.

**Permissions:** ADMIN, SUPERADMIN

---

### 6.3 Statistiques Vouchers

**GET** `/access/vouchers/stats/`

**Permissions:** ADMIN, SUPERADMIN

**Réponse 200:**
```json
{
  "total_created": 150,
  "total_used": 89,
  "total_expired": 25,
  "total_active": 36,
  "usage_by_plan": [
    {
      "plan_name": "Accès Invité 1H",
      "created": 50,
      "used": 45,
      "usage_rate": 90.0
    }
  ],
  "usage_by_month": [
    {
      "month": "2024-01",
      "created": 75,
      "used": 60
    }
  ]
}
```

---

## 7. Notifications

### 7.1 Mes Notifications

**GET** `/notifications/`

**Paramètres Query:**
- `unread_only`: true/false
- `event_type`: Type d'événement
- `priority`: LOW, NORMAL, HIGH, CRITICAL

**Réponse 200:**
```json
{
  "count": 25,
  "unread_count": 5,
  "results": [
    {
      "id": 301,
      "uuid": "550e8400-e29b-41d4-a716-446655440006",
      "event_type": "QUOTA_WARNING",
      "priority": "HIGH",
      "title": "Quota données à 80%",
      "message": "Vous avez utilisé 80% de votre quota mensuel de données (80 GB sur 100 GB).",
      "payload": {
        "quota_type": "data",
        "usage_percent": 80,
        "remaining_gb": 20
      },
      "is_read": false,
      "created_at": "2024-01-15T15:30:00Z",
      "expires_at": "2024-02-01T00:00:00Z"
    }
  ]
}
```

**POST** `/notifications/{id}/read/`

Marquer comme lu.

**POST** `/notifications/read-all/`

Marquer toutes comme lues.

**GET** `/notifications/unread-count/`

**Réponse 200:**
```json
{
  "count": 5
}
```

---

## 8. Audit & Logs (SuperAdmin)

### 8.1 Logs Audit

**GET** `/audit/logs/`

**Permissions:** SUPERADMIN

**Paramètres Query:**
- `action`: Type d'action
- `actor_id`: ID de l'acteur
- `target_type`: Type d'objet cible
- `start_date`: Date début
- `end_date`: Date fin
- `ip_address`: Adresse IP

**Réponse 200:**
```json
{
  "count": 5420,
  "results": [
    {
      "id": 1001,
      "actor": {
        "id": 1,
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "action": "USER_VALIDATION",
      "target_type": "User",
      "target_id": "124",
      "target_repr": "nouveau@example.com",
      "metadata": {
        "validation_notes": "Documents vérifiés"
      },
      "changes": {
        "status": {
          "before": "PENDING_VALIDATION",
          "after": "ACTIVE"
        }
      },
      "ip_address": "192.168.1.10",
      "user_agent": "Mozilla/5.0...",
      "request_id": "req_123456789",
      "content_hash": "a1b2c3d4e5f6...",
      "timestamp": "2024-01-15T15:45:00Z"
    }
  ]
}
```

---

### 8.2 Statistiques Audit

**GET** `/audit/stats/`

**Permissions:** SUPERADMIN

**Réponse 200:**
```json
{
  "total_logs": 5420,
  "logs_last_24h": 156,
  "actions_by_type": [
    {
      "action": "LOGIN",
      "count": 1250
    },
    {
      "action": "USER_VALIDATION",
      "count": 89
    }
  ],
  "top_actors": [
    {
      "actor_email": "admin@example.com",
      "action_count": 234
    }
  ],
  "security_events": {
    "failed_logins": 45,
    "suspicious_ips": 3,
    "admin_actions": 67
  }
}
```

---

### 8.3 Export Logs

**GET** `/audit/export/`

**Permissions:** SUPERADMIN

**Paramètres Query:**
- `format`: csv, json
- `start_date`: Date début
- `end_date`: Date fin
- `actions`: Liste d'actions à inclure

**Réponse 200:** Fichier CSV/JSON

---

## 9. Configuration Système (SuperAdmin)

### 9.1 Configuration

**GET** `/config/`

**Permissions:** SUPERADMIN

**Réponse 200:**
```json
{
  "portal": {
    "title": "CaptiveNet Enterprise",
    "welcome_message": "Bienvenue sur notre réseau Wi-Fi",
    "terms_url": "/terms/",
    "privacy_url": "/privacy/",
    "support_email": "support@example.com",
    "session_timeout": 7200,
    "max_login_attempts": 5,
    "lockout_duration": 300
  },
  "quotas": {
    "warning_threshold": 80,
    "critical_threshold": 90
  },
  "notifications": {
    "email_enabled": true,
    "sms_enabled": false
  },
  "security": {
    "require_email_verification": true,
    "require_admin_validation": true,
    "password_min_length": 12,
    "mfa_required_for_admins": true
  }
}
```

**PUT** `/config/{key}/`

Modifier un paramètre.

**Paramètres:**
```json
{
  "value": "nouvelle_valeur",
  "reason": "Mise à jour suite à incident sécurité"
}
```

---

### 9.2 Backup/Restore

**GET** `/config/backup/`

Export complet de la configuration.

**POST** `/config/restore/`

Restauration depuis un backup.

---

## 10. Webhooks & Intégrations

### 10.1 Webhooks Portail

**POST** `/portal/webhooks/session-start/`

Appelé par OpenNDS/CoovaChilli au début de session.

**POST** `/portal/webhooks/session-end/`

Appelé à la fin de session.

**POST** `/portal/webhooks/accounting/`

Mise à jour usage en temps réel.

---

## 11. Monitoring & Métriques

### 11.1 Métriques Système

**GET** `/monitoring/metrics/`

**Permissions:** ADMIN, SUPERADMIN

**Réponse 200:**
```json
{
  "system": {
    "active_sessions": 89,
    "total_users": 1247,
    "data_transferred_gb": 2547.3,
    "uptime_percent": 99.7
  },
  "quotas": {
    "users_over_80_percent": 23,
    "users_over_90_percent": 8,
    "quota_violations": 2
  },
  "performance": {
    "avg_response_time_ms": 145,
    "error_rate_percent": 0.1,
    "db_connections": 12
  }
}
```

---

### 11.2 Health Check

**GET** `/health/`

**Réponse 200:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T16:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "celery": "healthy"
  }
}
```

---

## 12. Limites et Rate Limiting

### Rate Limits par Endpoint

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/auth/login/` | 5 tentatives | 5 minutes |
| `/auth/register/` | 3 inscriptions | 1 heure |
| `/portal/login/` | 10 tentatives | 5 minutes |
| API générale | 1000 requêtes | 1 heure |
| Upload fichiers | 10 uploads | 1 minute |

### Headers de Rate Limiting

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
Retry-After: 3600
```

---

## 13. Codes d'Erreur Spécifiques

| Code | Message | Description |
|------|---------|-------------|
| `AUTH_REQUIRED` | Authentication required | Token manquant ou invalide |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | Rôle insuffisant |
| `ACCOUNT_LOCKED` | Account temporarily locked | Trop de tentatives échouées |
| `EMAIL_NOT_VERIFIED` | Email verification required | Email non vérifié |
| `ADMIN_VALIDATION_REQUIRED` | Admin validation pending | Validation admin requise |
| `QUOTA_EXCEEDED` | Quota exceeded | Quota dépassé |
| `VOUCHER_INVALID` | Invalid voucher code | Code voucher invalide |
| `VOUCHER_EXPIRED` | Voucher expired | Code voucher expiré |
| `VOUCHER_EXHAUSTED` | Voucher fully used | Code voucher épuisé |
| `SESSION_EXPIRED` | Session expired | Session expirée |
| `DEVICE_LIMIT_REACHED` | Device limit reached | Limite d'appareils atteinte |
| `PLAN_INACTIVE` | Plan no longer available | Plan inactif |
| `SUBSCRIPTION_EXPIRED` | Subscription expired | Abonnement expiré |

---

Cette documentation couvre l'ensemble des endpoints de l'API avec des exemples détaillés. Chaque endpoint inclut les permissions requises, les paramètres attendus, et les réponses possibles avec gestion d'erreurs complète.