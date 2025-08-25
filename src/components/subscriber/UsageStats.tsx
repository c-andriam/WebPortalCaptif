import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Database, 
  Clock, 
  Wifi, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { formatBytes, formatDuration } from '@/lib/utils'

interface UsageData {
  current_period: {
    data: {
      used: number
      quota: number
      percent: number
    }
    time: {
      used: number
      quota: number
      percent: number
    }
    devices: {
      active: number
      max: number
    }
  }
  subscription: {
    plan_name: string
    status: string
    start_date: string
    end_date: string
    auto_renew: boolean
  }
  recent_sessions: Array<{
    id: number
    device_name: string
    start_time: string
    duration: number
    data_used: number
  }>
  monthly_trends: Array<{
    month: string
    data_gb: number
    time_hours: number
    sessions: number
  }>
}

interface UsageStatsProps {
  usage: UsageData
  onRenewSubscription?: () => void
  onUpgradePlan?: () => void
}

export function UsageStats({ usage, onRenewSubscription, onUpgradePlan }: UsageStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'history'>('current')

  const getQuotaStatus = (percent: number) => {
    if (percent >= 100) return { color: 'destructive', label: 'Dépassé', icon: AlertTriangle }
    if (percent >= 90) return { color: 'destructive', label: 'Critique', icon: AlertTriangle }
    if (percent >= 80) return { color: 'warning', label: 'Attention', icon: AlertTriangle }
    return { color: 'success', label: 'Normal', icon: CheckCircle }
  }

  const dataStatus = getQuotaStatus(usage.current_period.data.percent)
  const timeStatus = getQuotaStatus(usage.current_period.time.percent)

  const daysUntilRenewal = Math.ceil(
    (new Date(usage.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mon Usage</h2>
          <p className="text-gray-400">Suivi de votre consommation et quotas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'current' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('current')}
          >
            Période Actuelle
          </Button>
          <Button
            variant={selectedPeriod === 'history' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('history')}
          >
            Historique
          </Button>
        </div>
      </div>

      {selectedPeriod === 'current' && (
        <>
          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  Abonnement Actuel
                </CardTitle>
                <Badge variant={usage.subscription.status === 'ACTIVE' ? 'success' : 'warning'}>
                  {usage.subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-white mb-2">{usage.subscription.plan_name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Début:</span>
                      <span className="text-white">
                        {new Date(usage.subscription.start_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fin:</span>
                      <span className="text-white">
                        {new Date(usage.subscription.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{daysUntilRenewal}</p>
                  <p className="text-sm text-gray-400">jours restants</p>
                  {daysUntilRenewal <= 7 && (
                    <Badge variant="warning" className="mt-2">
                      Renouvellement proche
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-300">
                      Renouvellement {usage.subscription.auto_renew ? 'automatique' : 'manuel'}
                    </span>
                  </div>
                  {!usage.subscription.auto_renew && daysUntilRenewal <= 7 && onRenewSubscription && (
                    <Button size="sm" onClick={onRenewSubscription}>
                      Renouveler Maintenant
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className={dataStatus.color === 'destructive' ? 'border-red-500/20' : dataStatus.color === 'warning' ? 'border-yellow-500/20' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  Usage Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {formatBytes(usage.current_period.data.used)}
                  </p>
                  <p className="text-gray-400">
                    sur {formatBytes(usage.current_period.data.quota)}
                  </p>
                </div>
                
                <Progress 
                  value={usage.current_period.data.percent} 
                  className="h-3"
                />
                
                <div className="flex items-center justify-between">
                  <Badge variant={dataStatus.color} className="flex items-center gap-1">
                    <dataStatus.icon className="h-3 w-3" />
                    {dataStatus.label}
                  </Badge>
                  <span className="text-sm text-white">
                    {usage.current_period.data.percent.toFixed(1)}%
                  </span>
                </div>

                {usage.current_period.data.percent >= 80 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-300">
                      Vous approchez de votre limite de données. 
                      {onUpgradePlan && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-yellow-300 underline ml-1"
                          onClick={onUpgradePlan}
                        >
                          Upgrader votre plan ?
                        </Button>
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={timeStatus.color === 'destructive' ? 'border-red-500/20' : timeStatus.color === 'warning' ? 'border-yellow-500/20' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-400" />
                  Temps de Connexion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {formatDuration(usage.current_period.time.used)}
                  </p>
                  <p className="text-gray-400">
                    sur {formatDuration(usage.current_period.time.quota)}
                  </p>
                </div>
                
                <Progress 
                  value={usage.current_period.time.percent} 
                  className="h-3"
                />
                
                <div className="flex items-center justify-between">
                  <Badge variant={timeStatus.color} className="flex items-center gap-1">
                    <timeStatus.icon className="h-3 w-3" />
                    {timeStatus.label}
                  </Badge>
                  <span className="text-sm text-white">
                    {usage.current_period.time.percent.toFixed(1)}%
                  </span>
                </div>

                {usage.current_period.time.percent >= 80 && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-300">
                      Vous approchez de votre limite de temps.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Devices Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-purple-400" />
                Appareils Connectés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {usage.current_period.devices.active}
                    </p>
                    <p className="text-sm text-gray-400">Actifs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-400">
                      {usage.current_period.devices.max}
                    </p>
                    <p className="text-sm text-gray-400">Maximum</p>
                  </div>
                </div>
                <Badge variant={
                  usage.current_period.devices.active >= usage.current_period.devices.max 
                    ? 'warning' 
                    : 'success'
                }>
                  {usage.current_period.devices.active >= usage.current_period.devices.max 
                    ? 'Limite atteinte' 
                    : 'Disponible'
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Sessions Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usage.recent_sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{session.device_name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(session.start_time).toLocaleDateString('fr-FR')} à{' '}
                          {new Date(session.start_time).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-white">{formatDuration(session.duration)}</p>
                      <p className="text-gray-400">{formatBytes(session.data_used)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedPeriod === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Historique d'Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.monthly_trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                  <div>
                    <h4 className="font-medium text-white">{trend.month}</h4>
                    <p className="text-sm text-gray-400">{trend.sessions} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{trend.data_gb.toFixed(1)} GB</p>
                    <p className="text-sm text-gray-400">{trend.time_hours.toFixed(1)}h</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}