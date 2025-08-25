import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Server, 
  Database, 
  Activity, 
  Wifi,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download
} from 'lucide-react'

interface SystemMetrics {
  system: {
    cpu_usage: number
    memory_usage: number
    disk_usage: number
    uptime_hours: number
    load_average: number[]
  }
  network: {
    active_sessions: number
    total_bandwidth_mbps: number
    packets_per_second: number
    errors_per_hour: number
  }
  database: {
    connections: number
    queries_per_second: number
    cache_hit_ratio: number
    slow_queries: number
  }
  application: {
    response_time_ms: number
    error_rate_percent: number
    requests_per_minute: number
    active_users: number
  }
  alerts: Array<{
    id: number
    type: 'warning' | 'critical' | 'info'
    message: string
    timestamp: string
  }>
}

interface SystemMetricsProps {
  metrics: SystemMetrics
  onRefresh: () => void
  onExportMetrics: () => void
  loading?: boolean
}

export function SystemMetrics({ metrics, onRefresh, onExportMetrics, loading }: SystemMetricsProps) {
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(onRefresh, 10000) // Refresh every 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, onRefresh])

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'destructive'
    if (value >= thresholds.warning) return 'warning'
    return 'success'
  }

  const getHealthStatus = () => {
    const issues = []
    if (metrics.system.cpu_usage > 80) issues.push('CPU élevé')
    if (metrics.system.memory_usage > 85) issues.push('Mémoire élevée')
    if (metrics.system.disk_usage > 90) issues.push('Disque plein')
    if (metrics.application.error_rate_percent > 5) issues.push('Taux d\'erreur élevé')
    
    if (issues.length === 0) return { status: 'healthy', message: 'Tous les systèmes opérationnels' }
    if (issues.length <= 2) return { status: 'warning', message: `${issues.length} problème(s) détecté(s)` }
    return { status: 'critical', message: `${issues.length} problèmes critiques` }
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Métriques Système</h2>
          <p className="text-gray-400">Surveillance en temps réel de l'infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" onClick={onExportMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card className={
        healthStatus.status === 'critical' ? 'border-red-500/20 bg-red-500/5' :
        healthStatus.status === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' :
        'border-green-500/20 bg-green-500/5'
      }>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {healthStatus.status === 'healthy' ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            )}
            <div>
              <h3 className="font-semibold text-white">État du Système</h3>
              <p className="text-sm text-gray-400">{healthStatus.message}</p>
            </div>
            <div className="ml-auto">
              <Badge variant={
                healthStatus.status === 'healthy' ? 'success' :
                healthStatus.status === 'warning' ? 'warning' : 'destructive'
              }>
                {healthStatus.status === 'healthy' ? 'Opérationnel' :
                 healthStatus.status === 'warning' ? 'Attention' : 'Critique'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-blue-400" />
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{metrics.system.cpu_usage}%</p>
            </div>
            <Progress 
              value={metrics.system.cpu_usage} 
              className="h-2"
            />
            <Badge variant={getStatusColor(metrics.system.cpu_usage, { warning: 70, critical: 85 })}>
              {metrics.system.cpu_usage < 70 ? 'Normal' : metrics.system.cpu_usage < 85 ? 'Élevé' : 'Critique'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-green-400" />
              Mémoire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{metrics.system.memory_usage}%</p>
            </div>
            <Progress 
              value={metrics.system.memory_usage} 
              className="h-2"
            />
            <Badge variant={getStatusColor(metrics.system.memory_usage, { warning: 75, critical: 90 })}>
              {metrics.system.memory_usage < 75 ? 'Normal' : metrics.system.memory_usage < 90 ? 'Élevé' : 'Critique'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Server className="h-4 w-4 text-purple-400" />
              Disque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{metrics.system.disk_usage}%</p>
            </div>
            <Progress 
              value={metrics.system.disk_usage} 
              className="h-2"
            />
            <Badge variant={getStatusColor(metrics.system.disk_usage, { warning: 80, critical: 95 })}>
              {metrics.system.disk_usage < 80 ? 'Normal' : metrics.system.disk_usage < 95 ? 'Élevé' : 'Critique'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-yellow-400" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {Math.floor(metrics.system.uptime_hours / 24)}j
              </p>
              <p className="text-sm text-gray-400">
                {metrics.system.uptime_hours % 24}h
              </p>
            </div>
            <Badge variant="success">
              Stable
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Network & Application Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-blue-400" />
              Métriques Réseau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.network.active_sessions}</p>
                <p className="text-xs text-gray-400">Sessions actives</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.network.total_bandwidth_mbps}</p>
                <p className="text-xs text-gray-400">Mbps utilisés</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.network.packets_per_second}</p>
                <p className="text-xs text-gray-400">Paquets/sec</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.network.errors_per_hour}</p>
                <p className="text-xs text-gray-400">Erreurs/heure</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Performance Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.application.response_time_ms}ms</p>
                <p className="text-xs text-gray-400">Temps réponse</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.application.error_rate_percent}%</p>
                <p className="text-xs text-gray-400">Taux d'erreur</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.application.requests_per_minute}</p>
                <p className="text-xs text-gray-400">Req/min</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-lg font-bold text-white">{metrics.application.active_users}</p>
                <p className="text-xs text-gray-400">Utilisateurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-400" />
            Base de Données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-800/50">
              <p className="text-xl font-bold text-white">{metrics.database.connections}</p>
              <p className="text-sm text-gray-400">Connexions actives</p>
              <Badge variant={metrics.database.connections > 50 ? 'warning' : 'success'} className="mt-2">
                {metrics.database.connections > 50 ? 'Élevé' : 'Normal'}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-800/50">
              <p className="text-xl font-bold text-white">{metrics.database.queries_per_second}</p>
              <p className="text-sm text-gray-400">Requêtes/sec</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-800/50">
              <p className="text-xl font-bold text-white">{metrics.database.cache_hit_ratio}%</p>
              <p className="text-sm text-gray-400">Cache hit ratio</p>
              <Badge variant={metrics.database.cache_hit_ratio > 90 ? 'success' : 'warning'} className="mt-2">
                {metrics.database.cache_hit_ratio > 90 ? 'Optimal' : 'À optimiser'}
              </Badge>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-800/50">
              <p className="text-xl font-bold text-white">{metrics.database.slow_queries}</p>
              <p className="text-sm text-gray-400">Requêtes lentes</p>
              <Badge variant={metrics.database.slow_queries > 10 ? 'warning' : 'success'} className="mt-2">
                {metrics.database.slow_queries > 10 ? 'Attention' : 'Normal'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {metrics.alerts.length > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Alertes Actives ({metrics.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                    alert.type === 'critical' ? 'text-red-400' :
                    alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-white">{alert.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant={
                    alert.type === 'critical' ? 'destructive' :
                    alert.type === 'warning' ? 'warning' : 'default'
                  }>
                    {alert.type === 'critical' ? 'Critique' :
                     alert.type === 'warning' ? 'Attention' : 'Info'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}