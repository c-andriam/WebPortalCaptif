import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, 
  Database, 
  Wifi, 
  Activity, 
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  TrendingDown,
  TrendingUp,
  User,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { formatBytes, formatDuration } from '@/lib/utils'
import toast from 'react-hot-toast'

interface GuestSessionData {
  id: string
  status: 'ACTIVE' | 'WARNING' | 'CRITICAL'
  quotas: {
    time: {
      used: number
      total: number
      remaining: number
      percent: number
    }
    data: {
      used: number
      total: number
      remaining: number
      percent: number
    }
  }
  network: {
    ip: string
    mac: string
    speed: string
    quality: 'excellent' | 'good' | 'fair' | 'poor'
  }
  session: {
    startTime: string
    lastActivity: string
    expiresAt: string
    duration: number
  }
  device: {
    name: string
    type: string
  }
  voucherInfo: {
    code: string
    plan: string
    maxUses: number
    usedCount: number
    isExpired: boolean
  }
}

export function GuestDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [sessionData, setSessionData] = useState<GuestSessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  // Mock session data - would come from API in production
  useEffect(() => {
    const loadSessionData = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const voucherCode = user?.email?.split('-')[1]?.split('@')[0]?.toUpperCase() || 'DEMO1234'
      
      const mockData: GuestSessionData = {
        id: 'guest_session_123',
        status: 'ACTIVE',
        quotas: {
          time: {
            used: 5400, // 1.5 hours in seconds
            total: 86400, // 24 hours
            remaining: 81000,
            percent: 6.25
          },
          data: {
            used: 157286400, // ~150 MB in bytes
            total: 5368709120, // 5 GB
            remaining: 5211422720,
            percent: 2.93
          }
        },
        network: {
          ip: '192.168.1.45',
          mac: 'AA:BB:CC:DD:EE:FF',
          speed: '50 Mbps',
          quality: 'excellent'
        },
        session: {
          startTime: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
          lastActivity: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 81000000).toISOString(), // 22.5 hours from now
          duration: 5400
        },
        device: {
          name: 'Appareil Invité',
          type: 'smartphone'
        },
        voucherInfo: {
          code: voucherCode,
          plan: 'Accès Invité 24h',
          maxUses: 1,
          usedCount: 1,
          isExpired: true // Code expired after first use
        }
      }
      
      setSessionData(mockData)
      setLoading(false)
    }

    loadSessionData()
  }, [user])

  // Update time remaining countdown
  useEffect(() => {
    if (sessionData) {
      const updateTimeRemaining = () => {
        const now = new Date().getTime()
        const expires = new Date(sessionData.session.expiresAt).getTime()
        const remaining = Math.max(0, expires - now)
        setTimeRemaining(Math.floor(remaining / 1000))
      }

      updateTimeRemaining()
      const interval = setInterval(updateTimeRemaining, 1000)
      return () => clearInterval(interval)
    }
  }, [sessionData])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
    toast.success(t('guest.dashboard.refreshed') || 'Session actualisée')
  }

  const handleLogout = async () => {
    if (confirm(t('guest.dashboard.confirmLogout') || 'Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout()
      navigate('/guest', { replace: true })
      toast.success(t('guest.dashboard.loggedOut') || 'Déconnexion réussie')
    }
  }

  const handleExtendSession = () => {
    toast.error(t('guest.dashboard.cannotExtend') || 'Impossible d\'étendre une session invité. Le code est à usage unique.')
  }

  const handleProfile = () => {
    navigate('/guest/profile')
    toast.success(t('guest.dashboard.viewingProfile') || 'Affichage du profil')
  }

  const getQuotaStatus = (percent: number) => {
    if (percent >= 90) return { color: 'destructive', label: t('guest.dashboard.critical') || 'Critique', icon: AlertTriangle }
    if (percent >= 80) return { color: 'warning', label: t('guest.dashboard.warning') || 'Attention', icon: AlertTriangle }
    return { color: 'success', label: t('guest.dashboard.normal') || 'Normal', icon: CheckCircle }
  }

  const getNetworkQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400">{t('guest.dashboard.loading') || 'Chargement de votre session...'}</p>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('guest.dashboard.noSession') || 'Session Introuvable'}
            </h3>
            <p className="text-gray-400 mb-4">
              {t('guest.dashboard.sessionExpired') || 'Votre session a expiré ou est invalide'}
            </p>
            <Button onClick={() => navigate('/guest/login')}>
              {t('guest.dashboard.reconnect') || 'Se Reconnecter'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeStatus = getQuotaStatus(sessionData.quotas.time.percent)
  const dataStatus = getQuotaStatus(sessionData.quotas.data.percent)

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg sm:text-xl font-bold text-white">
                {t('guest.dashboard.title') || 'Session Invité Active'}
              </h1>
              <p className="text-sm text-gray-400">
                Code: <code className="text-blue-300">{sessionData.voucherInfo.code}</code>
                {sessionData.voucherInfo.isExpired && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {t('guest.dashboard.codeExpired') || 'Code Expiré'}
                  </Badge>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleProfile}
              className="focus:ring-2 focus:ring-blue-500"
            >
              <User className="h-4 w-4 mr-2" />
              {t('guest.dashboard.profile') || 'Profil'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="focus:ring-2 focus:ring-blue-500"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? t('guest.dashboard.refreshing') || 'Actualisation...' : t('guest.dashboard.refresh') || 'Actualiser'}
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              className="focus:ring-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('guest.dashboard.logout') || 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Voucher Info Alert */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-300 mb-1">
                  {t('guest.dashboard.voucherUsed') || 'Code d\'Accès Utilisé'}
                </h3>
                <p className="text-sm text-blue-200">
                  {t('guest.dashboard.voucherInfo') || 'Votre code'} <code className="bg-gray-900 px-2 py-1 rounded">{sessionData.voucherInfo.code}</code> {t('guest.dashboard.voucherExpired') || 'a été utilisé et est maintenant expiré. Votre session reste active jusqu\'à épuisement des quotas.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-400" />
                {t('guest.dashboard.status') || 'Statut'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success" className="w-full justify-center py-1">
                {t('guest.dashboard.connected') || 'Connecté'}
              </Badge>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {t('guest.dashboard.since') || 'Depuis'} {new Date(sessionData.session.startTime).toLocaleTimeString('fr-FR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-400" />
                {t('guest.dashboard.timeRemaining') || 'Temps Restant'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatDuration(timeRemaining)}
                </p>
                <p className="text-xs text-gray-400">
                  {t('guest.dashboard.expires') || 'Expire à'} {new Date(sessionData.session.expiresAt).toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4 text-purple-400" />
                {t('guest.dashboard.dataRemaining') || 'Données Restantes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {formatBytes(sessionData.quotas.data.remaining)}
                </p>
                <p className="text-xs text-gray-400">
                  {t('guest.dashboard.of') || 'sur'} {formatBytes(sessionData.quotas.data.total)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4 text-green-400" />
                {t('guest.dashboard.connection') || 'Connexion'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-white">
                  {sessionData.network.speed}
                </p>
                <p className={`text-xs ${getNetworkQualityColor(sessionData.network.quality)}`}>
                  {t(`guest.dashboard.quality.${sessionData.network.quality}`) || sessionData.network.quality}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quota Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          <Card className={dataStatus.color === 'warning' ? 'border-yellow-500/20' : dataStatus.color === 'destructive' ? 'border-red-500/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-400" />
                {t('guest.dashboard.dataUsage') || 'Consommation Données'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {formatBytes(sessionData.quotas.data.used)}
                </p>
                <p className="text-gray-400">
                  {t('guest.dashboard.usedOf') || 'utilisé sur'} {formatBytes(sessionData.quotas.data.total)}
                </p>
              </div>
              
              <Progress 
                value={sessionData.quotas.data.percent} 
                className="h-3"
              />
              
              <div className="flex items-center justify-between">
                <Badge variant={dataStatus.color} className="flex items-center gap-1">
                  <dataStatus.icon className="h-3 w-3" />
                  {dataStatus.label}
                </Badge>
                <span className="text-sm text-white">
                  {sessionData.quotas.data.percent.toFixed(1)}%
                </span>
              </div>

              {sessionData.quotas.data.percent >= 80 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t('guest.dashboard.dataWarning') || 'Attention : quota données bientôt atteint. Connexion automatiquement coupée à 100%.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={timeStatus.color === 'warning' ? 'border-yellow-500/20' : timeStatus.color === 'destructive' ? 'border-red-500/20' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-400" />
                {t('guest.dashboard.timeUsage') || 'Temps de Connexion'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">
                  {formatDuration(sessionData.quotas.time.used)}
                </p>
                <p className="text-gray-400">
                  {t('guest.dashboard.usedOf') || 'utilisé sur'} {formatDuration(sessionData.quotas.time.total)}
                </p>
              </div>
              
              <Progress 
                value={sessionData.quotas.time.percent} 
                className="h-3"
              />
              
              <div className="flex items-center justify-between">
                <Badge variant={timeStatus.color} className="flex items-center gap-1">
                  <timeStatus.icon className="h-3 w-3" />
                  {timeStatus.label}
                </Badge>
                <span className="text-sm text-white">
                  {sessionData.quotas.time.percent.toFixed(1)}%
                </span>
              </div>

              {sessionData.quotas.time.percent >= 80 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t('guest.dashboard.timeWarning') || 'Attention : quota temps bientôt atteint. Connexion automatiquement coupée à 100%.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Network Information */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-purple-400" />
              {t('guest.dashboard.networkInfo') || 'Informations Réseau'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.ipAddress') || 'Adresse IP'}</p>
                <code className="text-blue-300 font-mono">{sessionData.network.ip}</code>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.macAddress') || 'MAC Address'}</p>
                <code className="text-blue-300 font-mono text-xs sm:text-sm">{sessionData.network.mac}</code>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.speed') || 'Vitesse'}</p>
                <p className="text-white font-medium">{sessionData.network.speed}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.device') || 'Appareil'}</p>
                <div className="flex items-center justify-center gap-1">
                  <Smartphone className="h-4 w-4 text-gray-400" />
                  <p className="text-white text-sm">{sessionData.device.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Timeline */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              {t('guest.dashboard.sessionTimeline') || 'Chronologie de Session'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-2">{t('guest.dashboard.sessionStart') || 'Début de Session'}</p>
                <p className="text-white font-medium">
                  {new Date(sessionData.session.startTime).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-2">{t('guest.dashboard.lastActivity') || 'Dernière Activité'}</p>
                <p className="text-white font-medium">
                  {new Date(sessionData.session.lastActivity).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-2">{t('guest.dashboard.sessionExpires') || 'Expiration'}</p>
                <p className="text-white font-medium">
                  {new Date(sessionData.session.expiresAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voucher Information */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-yellow-400" />
              {t('guest.dashboard.voucherDetails') || 'Détails du Code d\'Accès'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.voucherCode') || 'Code'}</p>
                <code className="text-yellow-300 font-mono text-lg">{sessionData.voucherInfo.code}</code>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.plan') || 'Plan'}</p>
                <p className="text-white font-medium text-sm">{sessionData.voucherInfo.plan}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.usage') || 'Utilisation'}</p>
                <p className="text-white font-medium">
                  {sessionData.voucherInfo.usedCount} / {sessionData.voucherInfo.maxUses}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-800/50">
                <p className="text-sm text-gray-400 mb-1">{t('guest.dashboard.codeStatus') || 'Statut Code'}</p>
                <Badge variant={sessionData.voucherInfo.isExpired ? 'destructive' : 'success'}>
                  {sessionData.voucherInfo.isExpired ? t('guest.dashboard.expired') || 'Expiré' : t('guest.dashboard.active') || 'Actif'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              {t('guest.dashboard.terms.title') || 'Conditions d\'Utilisation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.dashboard.terms.rule1') || 'Usage personnel et conforme à la législation'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.dashboard.terms.rule2') || 'Interdiction de contenus illégaux'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.dashboard.terms.rule3') || 'Respect des quotas alloués'}
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                {t('guest.dashboard.terms.rule4') || 'Déconnexion automatique à épuisement des quotas'}
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                {t('guest.dashboard.terms.rule5') || 'Code d\'accès à usage unique - impossible de se reconnecter'}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}