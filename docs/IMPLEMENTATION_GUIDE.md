# Guide d'Implémentation - Plateforme Portail Captif Entreprise

## Vue d'ensemble

Cette plateforme fournit une solution complète de gestion d'accès Internet via portail captif pour entreprises. Elle intègre les templates RocketBoard adaptés aux besoins métier avec une architecture sécurisée et scalable.

## Architecture Technique

### Stack Complet
- **Backend**: Python 3.12 + Django 5.0 + DRF 3.14
- **Base de données**: PostgreSQL 15+ avec Redis pour cache/sessions
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **UI**: shadcn/ui + lucide-react + JetBrains Nerd Font
- **Sécurité**: JWT rotatifs, 2FA TOTP, audit immuable
- **Intégration**: OpenNDS/CoovaChilli via API REST

### Fonctionnalités Clés Implémentées

#### 1. Authentification Sécurisée
- **Multi-mode**: Email/password + 2FA TOTP ou codes invités
- **Validation stricte**: Email vérifié + validation admin obligatoire
- **Sécurité renforcée**: Rate limiting, captcha, audit complet

#### 2. Gestion des Rôles (RBAC)
- **SUPERADMIN** (max 2): Configuration système, audit, gestion admins
- **ADMIN** (max 3): Validation comptes, création vouchers, monitoring
- **SUBSCRIBER**: Gestion appareils personnels, consultation usage
- **GUEST**: Accès temporaire avec quotas limités

#### 3. Portail Captif Intégré
- **Redirection automatique**: Détection MAC/IP pour redirection
- **Interface adaptée**: Login voucher ou compte selon le contexte
- **Monitoring temps réel**: Quotas, usage, alertes automatiques

#### 4. Gestion Quotas Intelligente
- **Multi-critères**: Données (GB), temps (heures), appareils (nombre)
- **Alertes graduées**: 80% (warning), 90% (critique), 100% (coupure)
- **Extensions possibles**: Admin peut étendre quotas temporairement

#### 5. Templates RocketBoard Adaptés

##### Dashboard par Rôle
- **SuperAdmin**: Métriques système, alertes sécurité, configuration
- **Admin**: Validations en attente, sessions actives, vouchers
- **Subscriber**: Usage personnel, appareils, historique
- **Guest**: Session actuelle, temps restant, conditions

##### Composants Métier Spécialisés
- **UserValidation**: Interface validation avec vérifications automatiques
- **VoucherGenerator**: Création codes invités avec aperçu plan
- **SessionMonitor**: Surveillance temps réel avec actions admin
- **QuotaManager**: Gestion quotas avec extensions et suspensions
- **DeviceManager**: Gestion appareils avec validation MAC
- **UsageStats**: Statistiques détaillées avec tendances

## Workflows Utilisateurs

### 1. Inscription Abonné
```
1. Accès Wi-Fi ouvert → Redirection portail
2. "Créer compte abonné" → Formulaire complet
3. Validation email automatique
4. Statut "En attente validation admin"
5. Admin valide → Notification utilisateur
6. Première connexion possible
```

### 2. Accès Invité
```
1. Accès Wi-Fi → Redirection portail
2. "Code d'accès invité" → Saisie 8 caractères
3. Validation code + quotas
4. Session temporaire créée
5. Monitoring usage temps réel
6. Coupure automatique si dépassement
```

### 3. Validation Administrative
```
1. Notification nouveau compte
2. Interface validation avec vérifications
3. Contrôles manuels admin
4. Décision Approuver/Rejeter
5. Actions automatiques + notifications
6. Audit complet de la décision
```

## Sécurité Implémentée

### 1. Authentification
- **Mots de passe forts**: 12+ caractères, complexité validée
- **2FA TOTP**: Obligatoire pour admins, optionnel pour abonnés
- **Sessions sécurisées**: JWT rotatifs avec refresh tokens
- **Rate limiting**: Protection contre brute force

### 2. Autorisation
- **RBAC strict**: Permissions granulaires par rôle
- **Validation admin**: Obligatoire avant premier accès
- **Audit immuable**: Toutes actions sensibles tracées
- **Quotas stricts**: Application automatique avec coupure

### 3. Infrastructure
- **CSP stricte**: Protection XSS/injection
- **HTTPS obligatoire**: TLS 1.2+ avec HSTS
- **Headers sécurisés**: Protection clickjacking, MIME sniffing
- **Validation entrées**: Zod côté client, Django côté serveur

## Intégration Réseau

### OpenNDS/CoovaChilli
La plateforme fournit les endpoints API nécessaires pour l'intégration avec les solutions de portail captif standard :

- `POST /api/v1/portal/authorize/` - Autorisation initiale
- `POST /api/v1/portal/login/` - Connexion utilisateur
- `GET /api/v1/portal/status/` - Statut session
- `POST /api/v1/portal/logout/` - Déconnexion

### Scripts d'Intégration
Des scripts sont fournis dans le backend pour configurer automatiquement OpenNDS et CoovaChilli avec les bons endpoints et paramètres.

## Déploiement

### Développement
```bash
# Frontend
npm install
npm run dev

# Backend (séparé)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Production
- **Docker Compose** pour déploiement simple
- **Kubernetes** pour environnements scalables
- **CI/CD** avec tests automatisés
- **Monitoring** Prometheus/Grafana intégré

## Tests et Qualité

### Couverture Tests
- **Tests unitaires**: >90% couverture backend
- **Tests composants**: React Testing Library
- **Tests E2E**: Playwright pour workflows complets
- **Tests sécurité**: Validation OWASP

### Accessibilité
- **WCAG 2.1 AA**: Conformité complète
- **Navigation clavier**: Support complet
- **Lecteurs d'écran**: ARIA labels appropriés
- **Contraste**: Ratios respectés

## Monitoring et Observabilité

### Métriques Métier
- Sessions actives, inscriptions, usage quotas
- Performance API, taux d'erreur, disponibilité
- Alertes automatiques sur seuils critiques

### Audit et Conformité
- Logs immuables avec hash d'intégrité
- Traçabilité complète des actions sensibles
- Export pour audits externes

Cette implémentation fournit une base solide et sécurisée pour votre plateforme de portail captif entreprise, avec tous les composants UI adaptés des templates RocketBoard et une architecture prête pour la production.