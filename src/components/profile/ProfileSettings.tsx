import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Bell,
  Eye,
  EyeOff,
  Save,
  Camera,
  Smartphone
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function ProfileSettings() {
  const { user } = useAuth()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile')

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || ''
  })

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    mfaEnabled: user?.mfa_enabled || false
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    quotaAlerts: true,
    securityAlerts: true,
    maintenanceAlerts: true
  })

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ]

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'destructive'
      case 'ADMIN': return 'warning'
      case 'SUBSCRIBER': return 'success'
      case 'GUEST': return 'secondary'
      default: return 'outline'
    }
  }

  const renderProfileTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            Informations Personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <Button 
                size="icon" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {profileData.first_name} {profileData.last_name}
              </h3>
              <p className="text-gray-400">{user?.email}</p>
              <Badge variant={getRoleColor(user?.role || '')} className="mt-2">
                {user?.role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={profileData.first_name}
                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={profileData.last_name}
                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          <Button className="bg-blue-500 hover:bg-blue-600">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les Modifications
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-red-400" />
            Changer le Mot de Passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={securityData.currentPassword}
                onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={securityData.newPassword}
                onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={securityData.confirmPassword}
              onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
            />
          </div>

          <Button variant="destructive">
            <Key className="h-4 w-4 mr-2" />
            Changer le Mot de Passe
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-400" />
            Authentification à Deux Facteurs (2FA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div>
              <h4 className="font-medium text-white">2FA TOTP</h4>
              <p className="text-sm text-gray-400">
                {securityData.mfaEnabled 
                  ? 'L\'authentification à deux facteurs est activée'
                  : 'Sécurisez votre compte avec l\'authentification à deux facteurs'
                }
              </p>
            </div>
            <Badge variant={securityData.mfaEnabled ? 'success' : 'secondary'}>
              {securityData.mfaEnabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>

          {!securityData.mfaEnabled ? (
            <Button className="bg-green-600 hover:bg-green-700">
              <Shield className="h-4 w-4 mr-2" />
              Activer la 2FA
            </Button>
          ) : (
            <div className="space-y-2">
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Voir les Codes de Récupération
              </Button>
              <Button variant="destructive">
                <Shield className="h-4 w-4 mr-2" />
                Désactiver la 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Préférences de Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div>
                <h4 className="font-medium text-white">Notifications par E-mail</h4>
                <p className="text-sm text-gray-400">Recevoir les notifications importantes par e-mail</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  emailNotifications: e.target.checked 
                })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div>
                <h4 className="font-medium text-white">Notifications SMS</h4>
                <p className="text-sm text-gray-400">Recevoir les alertes critiques par SMS</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  smsNotifications: e.target.checked 
                })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div>
                <h4 className="font-medium text-white">Alertes de Quota</h4>
                <p className="text-sm text-gray-400">Être notifié quand les quotas approchent des limites</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.quotaAlerts}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  quotaAlerts: e.target.checked 
                })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div>
                <h4 className="font-medium text-white">Alertes de Sécurité</h4>
                <p className="text-sm text-gray-400">Notifications pour les événements de sécurité</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.securityAlerts}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  securityAlerts: e.target.checked 
                })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div>
                <h4 className="font-medium text-white">Alertes de Maintenance</h4>
                <p className="text-sm text-gray-400">Être informé des maintenances programmées</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.maintenanceAlerts}
                onChange={(e) => setNotificationSettings({ 
                  ...notificationSettings, 
                  maintenanceAlerts: e.target.checked 
                })}
                className="w-4 h-4 accent-blue-500"
              />
            </div>
          </div>

          <Button className="bg-blue-500 hover:bg-blue-600">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder les Préférences
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Paramètres du Profil</h1>
      </div>

      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
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

      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'security' && renderSecurityTab()}
      {activeTab === 'notifications' && renderNotificationsTab()}
    </div>
  )
}