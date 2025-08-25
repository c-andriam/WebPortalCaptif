# Guide d'Intégration API - Portail Captif

## Endpoints Portail Captif

### 1. Autorisation Initiale
**POST** `/api/v1/portal/authorize/`

Appelé par OpenNDS/CoovaChilli pour vérifier l'autorisation d'accès.

**Paramètres:**
```json
{
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "token": "optional_session_token",
  "url": "http://example.com/original_request"
}
```

**Réponse:**
```json
{
  "status": "ALLOW|DENY",
  "redirect_url": "https://captive.example.com/portal/login/",
  "ttl": 3600,
  "bandwidth_up": 1000,
  "bandwidth_down": 5000,
  "session_timeout": 7200
}
```

### 2. Connexion Portail
**POST** `/api/v1/portal/login/`

Gestion connexion via portail (email/password ou voucher).

**Paramètres (Voucher):**
```json
{
  "type": "voucher",
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "code": "ABC12345",
  "url": "http://example.com/original_request"
}
```

**Paramètres (Credentials):**
```json
{
  "type": "credentials",
  "mac": "AA:BB:CC:DD:EE:FF",
  "ip": "192.168.1.100",
  "email": "user@example.com",
  "password": "password123",
  "url": "http://example.com/original_request"
}
```

### 3. Statut Session
**GET** `/api/v1/portal/status/`

**Paramètres Query:**
- `mac`: Adresse MAC
- `session_token`: Token de session

**Réponse:**
```json
{
  "session": {
    "id": 789,
    "status": "ACTIVE",
    "user": {
      "email": "user@example.com",
      "role": "SUBSCRIBER"
    },
    "quotas": {
      "data_remaining_gb": 54.8,
      "time_remaining_hours": 592.5
    },
    "expires_at": "2024-01-15T16:30:00Z"
  }
}
```

## Configuration OpenNDS

### Script d'Installation
```bash
#!/bin/bash
# scripts/opennds-setup.sh

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

## Configuration CoovaChilli

### Script d'Installation
```bash
#!/bin/bash
# scripts/coovachilli-setup.sh

PORTAL_URL="https://captive.example.com"
CHILLI_CONFIG="/etc/chilli/defaults"

cat > $CHILLI_CONFIG << EOF
HS_LANIF=eth1
HS_NETWORK=192.168.182.0
HS_NETMASK=255.255.255.0
HS_UAMLISTEN=192.168.182.1
HS_UAMPORT=3990
HS_UAMUIPORT=4990

HS_UAMSERVER=$PORTAL_URL
HS_UAMHOMEPAGE=$PORTAL_URL/portal/
HS_UAMSECRET=changeme
HS_RADSECRET=changeme

HS_RADSERVER=127.0.0.1
HS_RADSERVER2=127.0.0.1

HS_UAMDOMAINS="$PORTAL_URL,.google.com,.facebook.com"
HS_TCP_PORTS="80,443,22,53"
HS_UDP_PORTS="53,67,68"

HS_POSTAUTH=/etc/chilli/postauth.sh
HS_PREAUTH=/etc/chilli/preauth.sh
EOF

systemctl restart chilli
```

## Gestion QoS et Quotas

### Script de Monitoring
```bash
#!/bin/bash
# scripts/quota-monitor.sh

PORTAL_API="https://captive.example.com/api/v1"
INTERFACE="eth0"

monitor_quotas() {
    while true; do
        SESSIONS=$(curl -s "$PORTAL_API/access/sessions/active/" \
            -H "Authorization: Bearer $API_TOKEN")
        
        echo "$SESSIONS" | jq -r '.results[] | @base64' | while read session; do
            SESSION_DATA=$(echo $session | base64 -d)
            
            MAC=$(echo $SESSION_DATA | jq -r '.mac_address')
            QUOTA_EXCEEDED=$(echo $SESSION_DATA | jq -r '.quota_exceeded')
            
            if [ "$QUOTA_EXCEEDED" = "true" ]; then
                # Coupure connexion
                iptables -I FORWARD -m mac --mac-source $MAC -j DROP
                
                # Notification portail
                curl -s -X POST "$PORTAL_API/portal/session-terminate/" \
                    -H "Authorization: Bearer $API_TOKEN" \
                    -d "{\"mac\":\"$MAC\",\"reason\":\"quota_exceeded\"}"
            fi
        done
        
        sleep 30
    done
}

monitor_quotas &
```

## Tests d'Intégration

### Test Complet Portail
```typescript
// tests/e2e/portal-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete captive portal flow', async ({ page }) => {
  // 1. Simulation connexion Wi-Fi
  await page.goto('http://192.168.1.1:2050')
  
  // 2. Redirection vers portail
  await expect(page).toHaveURL(/captive\.example\.com/)
  
  // 3. Connexion avec voucher
  await page.click('text=Code d\'accès invité')
  await page.fill('[data-testid=voucher-code]', 'DEMO1234')
  await page.click('text=Se connecter')
  
  // 4. Vérification accès
  await expect(page.locator('text=Session Active')).toBeVisible()
  
  // 5. Test navigation Internet
  await page.goto('https://google.com')
  await expect(page).toHaveURL(/google\.com/)
  
  // 6. Retour portail et déconnexion
  await page.goto('http://captive.example.com/portal/status')
  await page.click('text=Se Déconnecter')
  await expect(page.locator('text=Déconnexion réussie')).toBeVisible()
})
```

## Déploiement Production

### Docker Compose
```yaml
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

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  backend:
    build: ./backend
    command: gunicorn captive_portal.wsgi:application --bind 0.0.0.0:8000
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/captive_portal
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Monitoring et Alertes

### Métriques Prometheus
```python
# monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge

user_registrations = Counter('captive_portal_user_registrations_total', 'User registrations', ['status'])
session_duration = Histogram('captive_portal_session_duration_seconds', 'Session duration')
active_sessions = Gauge('captive_portal_active_sessions', 'Active sessions')
quota_usage = Gauge('captive_portal_quota_usage_percent', 'Quota usage', ['user_id', 'quota_type'])
```

### Dashboard Grafana
- Métriques temps réel des sessions actives
- Alertes dépassement quotas
- Performance API et base de données
- Statistiques d'usage par plan

Cette implémentation fournit une plateforme complète, sécurisée et prête pour la production avec tous les composants nécessaires pour gérer efficacement un portail captif d'entreprise.