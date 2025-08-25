import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Clock, 
  Database,
  Wifi,
  Save,
  Volume2,
  VolumeX,
  Mail,
  Smartphone
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import toast from 'react-hot-toast'

export function GuestProfile() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  
  const [notificationSettings, setNotificationSettings] = useState({
    quotaAlerts: true,
    sessionAlerts: true,
    soundEnabled: false,
    browserNotifications: true
  })

  const handleBack = () => {
    navigate('/guest/dashboard')
    toast.success(t('guest.profile.backToDashboard') || 'Retour au tableau de bord')
  }

  const handleNotificationToggle = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }))
    toast.success(
      value 
        ? t('guest.profile.notificationEnabled') || `Notifications ${setting} activées`
        : t('guest.profile.notificationDisabled') || `Notifications ${setting} désactivées`
    )
  }

  const handleSaveSettings = () => {
    // Simulate API call
    toast.success(t('guest.profile.settingsSaved') || 'Paramètres sauvegardés avec succès')
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    toast.success(t('guest.profile.allNotificationsRead') || 'Toutes les notifications marquées comme lues')
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    toast.success(t('guest.profile.notificationRead') || 'Notification marquée comme lue')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'info': return <Bell className="h-4 w-4 text-blue-400" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />
      default: return <Bell className="h-4 w-4 text-gray-400" />
    }
  }

  const sessionInfo = {
    code: user?.email?.split('-')[1]?.split('@')[0]?.toUpperCase() || 'GUEST123',
    type: 'Accès Temporaire',
    plan: 'Invité 24h',
    startTime: new Date(Date.now() - 5400000).toISOString(),
    expiresAt: new Date(Date.now() + 81000000).toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBack}
            className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
            aria-label={t('guest.profile.backButton') || 'Retour au tableau de bord'}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">
              {t('guest.profile.title') || 'Profil Invité'}
            </h1>
            <p className="text-sm text-gray-400">
              {t('guest.profile.subtitle') || 'Paramètres et informations de session'}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t('guest.profile.tabs.profile') || 'Profil'}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t('guest.profile.tabs.notifications') || 'Notifications'}</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Session Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  {t('guest.profile.sessionInfo') || 'Informations de Session'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {t('guest.profile.guestUser') || 'Utilisateur Invité'}
                    </h3>
                    <p className="text-gray-400">{t('guest.profile.accessCode') || 'Code d\'accès'}: <code className="text-blue-300">{sessionInfo.code}</code></p>
                    <Badge variant="secondary" className="mt-2">
                      {sessionInfo.type}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <h4 className="font-medium text-white mb-2">{t('guest.profile.plan') || 'Plan Actuel'}</h4>
                    <p className="text-gray-300">{sessionInfo.plan}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <h4 className="font-medium text-white mb-2">{t('guest.profile.sessionDuration') || 'Durée de Session'}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('guest.profile.started') || 'Démarrée'}:</span>
                        <span className="text-white">{new Date(sessionInfo.startTime).toLocaleTimeString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('guest.profile.expires') || 'Expire'}:</span>
                        <span className="text-white">{new Date(sessionInfo.expiresAt).toLocaleTimeString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Limitations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-400" />
                  {t('guest.profile.limitations') || 'Limitations du Compte Invité'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">{t('guest.profile.noEmailChange') || 'Modification d\'email non disponible'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                    <Smartphone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">{t('guest.profile.noPhoneChange') || 'Modification de téléphone non disponible'}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">{t('guest.profile.noPasswordChange') || 'Gestion de mot de passe non disponible'}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    {t('guest.profile.upgradeMessage') || 'Pour accéder à toutes les fonctionnalités, créez un compte abonné permanent.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  {t('guest.profile.notificationSettings') || 'Paramètres de Notification'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <h4 className="font-medium text-white">{t('guest.profile.quotaAlerts') || 'Alertes de Quota'}</h4>
                      <p className="text-sm text-gray-400">
                        {t('guest.profile.quotaAlertsDesc') || 'Être notifié quand les quotas approchent des limites'}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.quotaAlerts}
                      onCheckedChange={(checked) => handleNotificationToggle('quotaAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <h4 className="font-medium text-white">{t('guest.profile.sessionAlerts') || 'Alertes de Session'}</h4>
                      <p className="text-sm text-gray-400">
                        {t('guest.profile.sessionAlertsDesc') || 'Notifications d\'expiration de session'}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.sessionAlerts}
                      onCheckedChange={(checked) => handleNotificationToggle('sessionAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <h4 className="font-medium text-white">{t('guest.profile.soundNotifications') || 'Sons de Notification'}</h4>
                      <p className="text-sm text-gray-400">
                        {t('guest.profile.soundNotificationsDesc') || 'Jouer un son pour les alertes importantes'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {notificationSettings.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        checked={notificationSettings.soundEnabled}
                        onCheckedChange={(checked) => handleNotificationToggle('soundEnabled', checked)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <h4 className="font-medium text-white">{t('guest.profile.browserNotifications') || 'Notifications Navigateur'}</h4>
                      <p className="text-sm text-gray-400">
                        {t('guest.profile.browserNotificationsDesc') || 'Afficher les notifications dans le navigateur'}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.browserNotifications}
                      onCheckedChange={(checked) => handleNotificationToggle('browserNotifications', checked)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('guest.profile.saveSettings') || 'Sauvegarder les Paramètres'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    {t('guest.profile.recentNotifications') || 'Notifications Récentes'}
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                    >
                      {t('guest.profile.markAllRead') || 'Tout marquer comme lu'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-800/50 ${
                          notification.isRead 
                            ? 'bg-gray-800/30 border-gray-700' 
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('guest.profile.noNotifications') || 'Aucune Notification'}
                    </h3>
                    <p className="text-gray-400">
                      {t('guest.profile.noNotificationsDesc') || 'Vous n\'avez aucune notification pour le moment'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}