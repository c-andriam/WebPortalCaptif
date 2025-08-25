import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Wifi, 
  Clock, 
  Database, 
  Activity, 
  LogOut,
  AlertTriangle,
  CheckCircle,
  Smartphone
} from 'lucide-react'
import { formatBytes, formatDuration } from '@/lib/utils'

interface SessionData {
  id: string
  status: 'ACTIVE' | 'EXPIRED' | 'QUOTA_EXCEEDED'
  user: {
    email: string
    role: string
  }
  device: {
    name: string
    mac: string
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
  }
  startTime: string
  lastActivity: string
  expiresAt: string
}

interface SessionStatusProps {
  sessionData: SessionData
  onLogout: () => void
  onExtendSession?: () => void
}

export function SessionStatus({ sessionData, onLogout, onExtendSession }: SessionStatusProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date().getTime()
      const expires = new Date(sessionData.expiresAt).getTime()
      const remaining = Math.max(0, expires - now)
      setTimeRemaining(Math.floor(remaining / 1000))
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [sessionData.expiresAt])

  const dataUsagePercent = (sessionData.usage.dataUsed / sessionData.usage.dataQuota) * 100
  const timeUsagePercent = (sessionData.usage.timeUsed / sessionData.usage.timeQuota) * 100

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'EXPIRED': return 'destructive'
      case 'QUOTA_EXCEEDED': return 'warning'
      default: return 'secondary'
    }
  }

  const getQuotaColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-xl mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Session Active
          </h1>
          <p className="text-gray-400">
            Votre accès Internet est maintenant disponible
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-400" />
                Statut de Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Statut</span>
                <Badge variant={getStatusColor(sessionData.status)}>
                  {sessionData.status === 'ACTIVE' ? 'Connecté' : sessionData.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Utilisateur</span>
                <span className="text-white text-sm">{sessionData.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Rôle</span>
                <Badge variant="outline">{sessionData.user.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Temps restant</span>
                <span className="text-white font-mono">
                  {formatDuration(timeRemaining)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                Usage Données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Utilisé</span>
                  <span className="text-white">
                    {formatBytes(sessionData.usage.dataUsed)} / {formatBytes(sessionData.usage.dataQuota)}
                  </span>
                </div>
                <Progress 
                  value={dataUsagePercent} 
                  className="h-2"
                />
                <div className="text-xs text-center">
                  <span className={dataUsagePercent >= 80 ? 'text-yellow-400' : 'text-gray-400'}>
                    {dataUsagePercent.toFixed(1)}% utilisé
                  </span>
                </div>
              </div>
              {dataUsagePercent >= 80 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-yellow-300">
                    Quota bientôt atteint
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-purple-400" />
                Informations Réseau
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Adresse IP</span>
                <code className="text-white font-mono text-sm">{sessionData.network.ip}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">MAC Address</span>
                <code className="text-white font-mono text-sm">{sessionData.device.mac}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Appareil</span>
                <span className="text-white text-sm">{sessionData.device.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Vitesse</span>
                <span className="text-white">{sessionData.network.speed}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Usage Temps de Connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Temps utilisé</span>
                <span className="text-white">
                  {formatDuration(sessionData.usage.timeUsed)} / {formatDuration(sessionData.usage.timeQuota)}
                </span>
              </div>
              <Progress 
                value={timeUsagePercent} 
                className="h-3"
              />
              <div className="grid grid-cols-3 gap-4 text-xs text-center">
                <div>
                  <p className="text-gray-400">Session démarrée</p>
                  <p className="text-white">
                    {new Date(sessionData.startTime).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Dernière activité</p>
                  <p className="text-white">
                    {new Date(sessionData.lastActivity).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Expire à</p>
                  <p className="text-white">
                    {new Date(sessionData.expiresAt).toLocaleTimeString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {onExtendSession && (
            <Button 
              variant="outline" 
              onClick={onExtendSession}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Prolonger la Session
            </Button>
          )}
          <Button 
            variant="destructive" 
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Se Déconnecter
          </Button>
        </div>

        {/* Terms Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Conditions d'Utilisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Usage personnel et conforme à la législation en vigueur
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Interdiction de téléchargement de contenus illégaux
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Respect des quotas de temps et de données alloués
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                Session automatiquement fermée à expiration des quotas
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}