import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Search, 
  Filter, 
  MoreHorizontal,
  Wifi,
  Clock,
  Database,
  User,
  MapPin,
  Smartphone,
  LogOut,
  AlertTriangle
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatBytes, formatDuration } from '@/lib/utils'

interface ActiveSession {
  id: number
  user: {
    email: string
    role: string
    name: string
  }
  device: {
    name: string
    mac: string
    type: string
  }
  network: {
    ip: string
    speed: string
  }
  usage: {
    dataUsed: number
    dataQuota: number
    timeUsed: number
    timeQuota: number
    duration: number
  }
  status: 'ACTIVE' | 'WARNING' | 'CRITICAL'
  startTime: string
  lastActivity: string
  location?: string
}

interface SessionMonitorProps {
  sessions: ActiveSession[]
  onTerminateSession: (sessionId: number) => Promise<void>
  onRefresh: () => void
  loading?: boolean
}

export function SessionMonitor({ sessions, onTerminateSession, onRefresh, loading }: SessionMonitorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(onRefresh, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, onRefresh])

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = 
      session.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.network.ip.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || session.status.toLowerCase() === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'WARNING': return 'warning'
      case 'CRITICAL': return 'destructive'
      default: return 'secondary'
    }
  }

  const getQuotaColor = (percent: number) => {
    if (percent >= 90) return 'text-red-400'
    if (percent >= 80) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'smartphone':
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sessions Actives</h2>
          <p className="text-gray-400">{filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''} en cours</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={onRefresh}
            disabled={loading}
          >
            <Activity className="h-4 w-4 mr-2" />
            {loading ? 'Actualisation...' : 'Actualiser'}
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par utilisateur, appareil ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="warning">Avertissement</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sessions Grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filteredSessions.map((session) => {
          const dataPercent = (session.usage.dataUsed / session.usage.dataQuota) * 100
          const timePercent = (session.usage.timeUsed / session.usage.timeQuota) * 100
          
          return (
            <Card key={session.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-white">
                        {session.user.name}
                      </CardTitle>
                      <p className="text-xs text-gray-400">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <User className="h-4 w-4 mr-2" />
                          Voir Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Activity className="h-4 w-4 mr-2" />
                          Historique
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onTerminateSession(session.id)}
                          className="text-red-400"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Déconnecter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Device Info */}
                <div className="flex items-center gap-2 text-sm">
                  {getDeviceIcon(session.device.type)}
                  <span className="text-white">{session.device.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {session.device.type}
                  </Badge>
                </div>

                {/* Network Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">IP:</span>
                    <code className="ml-1 text-blue-300">{session.network.ip}</code>
                  </div>
                  <div>
                    <span className="text-gray-400">MAC:</span>
                    <code className="ml-1 text-blue-300">{session.device.mac}</code>
                  </div>
                </div>

                {/* Usage Progress */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Données</span>
                      <span className={getQuotaColor(dataPercent)}>
                        {formatBytes(session.usage.dataUsed)} / {formatBytes(session.usage.dataQuota)}
                      </span>
                    </div>
                    <Progress value={dataPercent} className="h-1.5" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Temps</span>
                      <span className={getQuotaColor(timePercent)}>
                        {formatDuration(session.usage.timeUsed)} / {formatDuration(session.usage.timeQuota)}
                      </span>
                    </div>
                    <Progress value={timePercent} className="h-1.5" />
                  </div>
                </div>

                {/* Timing Info */}
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <span>Démarré:</span>
                    <p className="text-white">
                      {new Date(session.startTime).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <span>Dernière activité:</span>
                    <p className="text-white">
                      {new Date(session.lastActivity).toLocaleTimeString('fr-FR')}
                    </p>
                  </div>
                </div>

                {/* Warnings */}
                {(dataPercent >= 80 || timePercent >= 80) && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs text-yellow-300">
                      Quota{dataPercent >= 80 && timePercent >= 80 ? 's' : ''} bientôt atteint{dataPercent >= 80 && timePercent >= 80 ? 's' : ''}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucune Session Active</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune session ne correspond aux critères de recherche'
                : 'Aucune session active en ce moment'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}