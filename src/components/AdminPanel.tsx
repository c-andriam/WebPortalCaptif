import React, { useState } from 'react'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Ticket, 
  Plus, 
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Clock,
  Database,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'

interface User {
  id: number
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
}

interface AdminPanelProps {
  user: User
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'vouchers' | 'sessions' | 'audit'>('users')
  
  // Mock data
  const pendingUsers = [
    { id: 1, email: 'jean.martin@example.com', name: 'Jean Martin', created: '2024-01-15', plan: 'Mensuel' },
    { id: 2, email: 'marie.dubois@example.com', name: 'Marie Dubois', created: '2024-01-14', plan: 'Hebdomadaire' },
    { id: 3, email: 'pierre.bernard@example.com', name: 'Pierre Bernard', created: '2024-01-13', plan: 'Mensuel' }
  ]

  const activeUsers = [
    { id: 4, email: 'sophie.leroy@example.com', name: 'Sophie Leroy', status: 'ACTIVE', devices: 3, usage: '45 GB' },
    { id: 5, email: 'thomas.petit@example.com', name: 'Thomas Petit', status: 'ACTIVE', devices: 2, usage: '23 GB' },
    { id: 6, email: 'claire.moreau@example.com', name: 'Claire Moreau', status: 'ACTIVE', devices: 1, usage: '12 GB' }
  ]

  const vouchers = [
    { code: 'ABC12345', status: 'ACTIVE', created: '2024-01-15', expires: '2024-01-22', used: false },
    { code: 'DEF67890', status: 'USED', created: '2024-01-14', expires: '2024-01-21', used: true },
    { code: 'GHI11111', status: 'ACTIVE', created: '2024-01-13', expires: '2024-01-20', used: false }
  ]

  const activeSessions = [
    { id: 1, user: 'sophie.leroy@example.com', ip: '192.168.1.45', mac: 'AA:BB:CC:DD:EE:FF', duration: '2h 15m', data: '156 MB' },
    { id: 2, user: 'Code: ABC12345', ip: '192.168.1.67', mac: 'FF:EE:DD:CC:BB:AA', duration: '45m', data: '89 MB' },
    { id: 3, user: 'thomas.petit@example.com', ip: '192.168.1.89', mac: '11:22:33:44:55:66', duration: '1h 30m', data: '234 MB' }
  ]

  const auditLogs = [
    { id: 1, action: 'USER_VALIDATION', actor: 'admin@captivenet.com', target: 'jean.martin@example.com', time: '10:30', status: 'success' },
    { id: 2, action: 'VOUCHER_CREATED', actor: 'admin@captivenet.com', target: 'ABC12345', time: '09:15', status: 'success' },
    { id: 3, action: 'CONFIG_CHANGE', actor: 'superadmin@captivenet.com', target: 'quota_settings', time: '08:45', status: 'success' }
  ]

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'vouchers', label: 'Codes Invités', icon: Ticket },
    { id: 'sessions', label: 'Sessions', icon: Activity },
    ...(user.role === 'SUPERADMIN' ? [{ id: 'audit', label: 'Audit', icon: Shield }] : [])
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'PENDING_VALIDATION': return 'warning'
      case 'SUSPENDED': return 'destructive'
      case 'USED': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Panneau d'Administration
        </h1>
        <p className="text-gray-400">
          Gestion des utilisateurs, codes d'accès et monitoring système
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Pending Validations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-yellow-400" />
                    Validations en Attente ({pendingUsers.length})
                  </CardTitle>
                  <CardDescription>Nouveaux comptes nécessitant une validation</CardDescription>
                </div>
                <Badge variant="warning">{pendingUsers.length} en attente</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        <Badge variant="outline">{user.plan}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Inscrit le {user.created}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Valider
                      </Button>
                      <Button size="sm" variant="destructive">
                        <UserX className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  Utilisateurs Actifs ({activeUsers.length})
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="Rechercher..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                        <Badge variant="success">{user.status}</Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>{user.devices} appareils</span>
                        <span>{user.usage} utilisés</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vouchers Tab */}
      {activeTab === 'vouchers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-blue-400" />
                  Codes d'Accès Invités
                </CardTitle>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un Code
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vouchers.map((voucher) => (
                  <div key={voucher.code} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <code className="text-lg font-mono text-blue-300 bg-gray-900 px-3 py-1 rounded">
                          {voucher.code}
                        </code>
                        <Badge variant={getStatusColor(voucher.status)}>
                          {voucher.status}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Créé: {voucher.created}</span>
                        <span>Expire: {voucher.expires}</span>
                        <span>{voucher.used ? 'Utilisé' : 'Non utilisé'}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Sessions Actives ({activeSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-white">{session.user}</p>
                          <p className="text-sm text-gray-400">IP: {session.ip} • MAC: {session.mac}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span><Clock className="inline h-3 w-3 mr-1" />{session.duration}</span>
                        <span><Database className="inline h-3 w-3 mr-1" />{session.data}</span>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm">
                      Déconnecter
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Tab (SuperAdmin only) */}
      {activeTab === 'audit' && user.role === 'SUPERADMIN' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Logs d'Audit
              </CardTitle>
              <CardDescription>
                Historique immuable des actions sensibles (SuperAdmin uniquement)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{log.action}</Badge>
                        <span className="text-sm text-white">{log.target}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>Par: {log.actor}</span>
                        <span>À: {log.time}</span>
                        <Badge variant="success" className="text-xs">
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}