import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  Database, 
  Clock, 
  Users, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter
} from 'lucide-react'
import { formatBytes, formatDuration } from '@/lib/utils'

interface UserQuota {
  id: number
  user: {
    email: string
    name: string
    role: string
  }
  subscription: {
    plan_name: string
    status: string
  }
  quotas: {
    data: {
      used: number
      total: number
      percent: number
    }
    time: {
      used: number
      total: number
      percent: number
    }
    devices: {
      used: number
      total: number
    }
  }
  alerts: string[]
  lastActivity: string
}

interface QuotaManagerProps {
  userQuotas: UserQuota[]
  onExtendQuota: (userId: number, quotaType: 'data' | 'time', amount: number) => Promise<void>
  onSuspendUser: (userId: number, reason: string) => Promise<void>
  loading?: boolean
}

export function QuotaManager({ userQuotas, onExtendQuota, onSuspendUser, loading }: QuotaManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [alertFilter, setAlertFilter] = useState<'all' | 'warning' | 'critical'>('all')

  const filteredQuotas = userQuotas.filter(quota => {
    const matchesSearch = 
      quota.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const hasAlerts = quota.alerts.length > 0
    const hasCriticalAlerts = quota.alerts.some(alert => 
      alert.includes('90%') || alert.includes('100%')
    )
    
    const matchesFilter = 
      alertFilter === 'all' ||
      (alertFilter === 'warning' && hasAlerts && !hasCriticalAlerts) ||
      (alertFilter === 'critical' && hasCriticalAlerts)
    
    return matchesSearch && matchesFilter
  })

  const getQuotaStatus = (percent: number) => {
    if (percent >= 100) return { color: 'destructive', label: 'Dépassé' }
    if (percent >= 90) return { color: 'destructive', label: 'Critique' }
    if (percent >= 80) return { color: 'warning', label: 'Attention' }
    return { color: 'success', label: 'Normal' }
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const stats = {
    totalUsers: userQuotas.length,
    usersWithAlerts: userQuotas.filter(q => q.alerts.length > 0).length,
    criticalUsers: userQuotas.filter(q => 
      q.quotas.data.percent >= 90 || q.quotas.time.percent >= 90
    ).length,
    avgDataUsage: userQuotas.reduce((acc, q) => acc + q.quotas.data.percent, 0) / userQuotas.length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestion des Quotas</h2>
          <p className="text-gray-400">Surveillance et gestion des quotas utilisateurs</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-xs text-gray-400">Utilisateurs totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.usersWithAlerts}</p>
                <p className="text-xs text-gray-400">Avec alertes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.criticalUsers}</p>
                <p className="text-xs text-gray-400">Critiques (&gt;90%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgDataUsage.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">Usage moyen données</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'warning', 'critical'] as const).map((filter) => (
            <Button
              key={filter}
              variant={alertFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertFilter(filter)}
            >
              {filter === 'all' ? 'Tous' : filter === 'warning' ? 'Avertissements' : 'Critiques'}
            </Button>
          ))}
        </div>
      </div>

      {/* Quota Cards */}
      <div className="space-y-4">
        {filteredQuotas.map((quota) => (
          <Card key={quota.id} className={quota.alerts.length > 0 ? 'border-yellow-500/20' : ''}>
            <CardContent className="p-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {quota.user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{quota.user.name}</h4>
                      <p className="text-sm text-gray-400">{quota.user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {quota.user.role}
                    </Badge>
                    <p className="text-xs text-gray-400">{quota.subscription.plan_name}</p>
                  </div>
                </div>

                {/* Data Quota */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Données</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Utilisé</span>
                      <span className="text-white">
                        {formatBytes(quota.quotas.data.used)} / {formatBytes(quota.quotas.data.total)}
                      </span>
                    </div>
                    <Progress 
                      value={quota.quotas.data.percent} 
                      className="h-2"
                    />
                    <div className="text-center">
                      <Badge variant={getQuotaStatus(quota.quotas.data.percent).color} className="text-xs">
                        {quota.quotas.data.percent.toFixed(1)}% - {getQuotaStatus(quota.quotas.data.percent).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Time Quota */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">Temps</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Utilisé</span>
                      <span className="text-white">
                        {formatDuration(quota.quotas.time.used)} / {formatDuration(quota.quotas.time.total)}
                      </span>
                    </div>
                    <Progress 
                      value={quota.quotas.time.percent} 
                      className="h-2"
                    />
                    <div className="text-center">
                      <Badge variant={getQuotaStatus(quota.quotas.time.percent).color} className="text-xs">
                        {quota.quotas.time.percent.toFixed(1)}% - {getQuotaStatus(quota.quotas.time.percent).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">Actions</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Appareils:</span>
                      <span className="ml-2 text-white">
                        {quota.quotas.devices.used} / {quota.quotas.devices.total}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onExtendQuota(quota.id, 'data', 10)}
                        disabled={loading}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        +10GB
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onExtendQuota(quota.id, 'time', 24)}
                        disabled={loading}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        +24h
                      </Button>
                    </div>
                    {quota.alerts.length > 0 && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onSuspendUser(quota.id, 'Quota exceeded')}
                        disabled={loading}
                      >
                        Suspendre
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {quota.alerts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-300">Alertes Actives</span>
                  </div>
                  <div className="space-y-1">
                    {quota.alerts.map((alert, index) => (
                      <p key={index} className="text-xs text-yellow-200 bg-yellow-500/10 px-2 py-1 rounded">
                        {alert}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredQuotas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucun Quota à Afficher</h3>
            <p className="text-gray-400">
              {searchTerm || alertFilter !== 'all' 
                ? 'Aucun utilisateur ne correspond aux critères'
                : 'Aucun quota configuré'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}