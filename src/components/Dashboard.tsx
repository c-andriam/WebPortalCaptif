import React from 'react'
import { 
  Users, 
  Wifi, 
  Activity, 
  Settings, 
  Shield, 
  Ticket,
  BarChart3,
  Clock,
  Database,
  UserCheck
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { formatBytes, formatDuration } from '@/lib/utils'
import { AdminPanel } from './AdminPanel'

interface User {
  id: number
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
}

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN'
  const isSuperAdmin = user.role === 'SUPERADMIN'
  
  // Show admin panel for admins
  if (isAdmin) {
    return <AdminPanel user={user} />
  }
  
  // Mock data - would come from API in production
  const stats = {
    totalUsers: 1247,
    activeConnections: 89,
    dataTransferred: 2547382902, // bytes
    uptime: 99.7,
    pendingValidations: 12,
    activeVouchers: 45
  }

  const recentActivity = [
    { id: 1, type: 'login', user: 'jean.dupont@example.com', time: '2 min ago', status: 'success' },
    { id: 2, type: 'voucher', user: 'Code ABC12345 utilisé', time: '5 min ago', status: 'info' },
    { id: 3, type: 'validation', user: 'marie.martin@example.com validée', time: '10 min ago', status: 'success' },
    { id: 4, type: 'quota', user: 'pierre.bernard@example.com - 80%', time: '15 min ago', status: 'warning' }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <UserCheck className="h-4 w-4" />
      case 'voucher': return <Ticket className="h-4 w-4" />
      case 'validation': return <Shield className="h-4 w-4" />
      case 'quota': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-blue-400'
    }
  }

  if (user.role === 'GUEST') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Accès Invité Activé</h1>
          <p className="text-gray-400">Votre session internet est maintenant active</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Statut de la Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Statut</span>
                  <Badge variant="success">Connecté</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Temps restant</span>
                  <span className="text-white font-medium">2h 30m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Données utilisées</span>
                  <span className="text-white font-medium">{formatBytes(157286400)} / 500 MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-400" />
                Informations Réseau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Adresse IP</span>
                  <span className="text-white font-mono">192.168.1.45</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MAC Address</span>
                  <span className="text-white font-mono">AA:BB:CC:DD:EE:FF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vitesse</span>
                  <span className="text-white">50 Mbps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conditions d'Utilisation</CardTitle>
            <CardDescription>Rappel des règles d'usage pour votre session invité</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• Usage personnel et conforme à la législation en vigueur</li>
              <li>• Interdiction de téléchargement de contenus illégaux</li>
              <li>• Respect des quotas de temps et de données alloués</li>
              <li>• Session automatiquement fermée à expiration</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Tableau de Bord {user.role === 'SUPERADMIN' ? 'Super Administrateur' : user.role === 'ADMIN' ? 'Administrateur' : 'Abonné'}
        </h1>
        <p className="text-gray-400">
          {isAdmin ? 'Gérez les accès et surveillez l\'activité réseau' : 'Gérez vos appareils et consultez votre usage'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>Utilisateurs Totaux</span>
              <Users className="h-4 w-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <p className="text-xs text-green-400">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>Connexions Actives</span>
              <Wifi className="h-4 w-4 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeConnections}</div>
            <p className="text-xs text-gray-400">En temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>Données Transférées</span>
              <Database className="h-4 w-4 text-purple-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatBytes(stats.dataTransferred)}</div>
            <p className="text-xs text-gray-400">Aujourd'hui</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>Disponibilité</span>
              <Activity className="h-4 w-4 text-green-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.uptime}%</div>
            <p className="text-xs text-green-400">30 jours</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin specific cards */}
      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Validations en Attente</span>
                <UserCheck className="h-4 w-4 text-yellow-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingValidations}</div>
              <p className="text-xs text-yellow-400">Action requise</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Codes Invités Actifs</span>
                <Ticket className="h-4 w-4 text-blue-400" />
              </CardTitle>
            </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeVouchers}</div>
              <p className="text-xs text-gray-400">Non utilisés</p>
            </CardContent>
          </Card>

          {isSuperAdmin && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>Configuration Système</span>
                  <Settings className="h-4 w-4 text-red-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">OK</div>
                <p className="text-xs text-green-400">Tous systèmes opérationnels</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              Activité Récente
            </CardTitle>
            <CardDescription>Derniers événements du système</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                  <div className={getActivityColor(activity.status)}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.user}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-400" />
              Actions Rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.role === 'SUBSCRIBER' ? (
                <>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Gérer mes appareils</div>
                    <div className="text-xs text-gray-400">Ajouter ou supprimer des appareils</div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Consulter ma consommation</div>
                    <div className="text-xs text-gray-400">Données et temps utilisés</div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Modifier mon profil</div>
                    <div className="text-xs text-gray-400">Informations personnelles</div>
                  </button>
                </>
              ) : (
                <>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Valider les comptes</div>
                    <div className="text-xs text-gray-400">{stats.pendingValidations} en attente</div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Créer des codes invités</div>
                    <div className="text-xs text-gray-400">Accès temporaire</div>
                  </button>
                  <button className="w-full p-3 text-left rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                    <div className="text-sm font-medium text-white">Consulter les logs</div>
                    <div className="text-xs text-gray-400">Audit et activité</div>
                  </button>
                  {isSuperAdmin && (
                    <button className="w-full p-3 text-left rounded-lg bg-red-900/20 hover:bg-red-900/30 transition-colors border border-red-500/20">
                      <div className="text-sm font-medium text-red-400">Configuration système</div>
                      <div className="text-xs text-red-300">Paramètres avancés</div>
                    </button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}