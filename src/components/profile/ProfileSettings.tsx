import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { profileUpdateSchema, changePasswordSchema } from '@/lib/validations'
import toast from 'react-hot-toast'

export function ProfileSettings() {
  const { user, updateUser } = useAuth()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      username: user?.username || ''
    }
  })

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    quotaAlerts: true,
    securityAlerts: true,
    maintenanceAlerts: true
  })

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'destructive'
      case 'ADMIN': return 'warning'
      case 'SUBSCRIBER': return 'success'
      case 'GUEST': return 'secondary'
      default: return 'outline'
    }
  }

  const handleProfileSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateUser(data)
      toast.success('Profil mis à jour avec succès')
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (data: any) => {
    try {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      passwordForm.reset()
      toast.success('Mot de passe modifié avec succès')
    } catch (error) {
      toast.error('Erreur lors du changement de mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    toast.success(`Notifications ${key} ${value ? 'activées' : 'désactivées'}`)
  }

  const handleAvatarChange = () => {
    toast.success('Fonctionnalité de changement d\'avatar en cours de développement')
  }

  const handleEnable2FA = () => {
    toast.success('Configuration 2FA en cours de développement')
  }

  const handleDisable2FA = () => {
    toast.error('Désactivation 2FA en cours de développement')
  }

  const handleGenerateBackupCodes = () => {
    toast.success('Génération de nouveaux codes de récupération')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Paramètres du Profil</h1>
        <p className="text-gray-400">Gérez vos informations personnelles et paramètres de sécurité</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <Button 
                    size="icon" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                    onClick={handleAvatarChange}
                    aria-label="Changer l'avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-white">
                    {profileForm.watch('first_name')} {profileForm.watch('last_name')}
                  </h3>
                  <p className="text-gray-400">{user?.email}</p>
                  <Badge variant={getRoleColor(user?.role || '')} className="mt-2">
                    {user?.role}
                  </Badge>
                </div>
              </div>

              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      disabled={loading}
                      {...profileForm.register('first_name')}
                    />
                    {profileForm.formState.errors.first_name && (
                      <p className="text-sm text-red-400">
                        {profileForm.formState.errors.first_name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      disabled={loading}
                      {...profileForm.register('last_name')}
                    />
                    {profileForm.formState.errors.last_name && (
                      <p className="text-sm text-red-400">
                        {profileForm.formState.errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    disabled={loading}
                    {...profileForm.register('username')}
                  />
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-red-400">
                      {profileForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      disabled={loading}
                      {...profileForm.register('email')}
                    />
                  </div>
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-400">
                      {profileForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      className="pl-10"
                      disabled={loading}
                      {...profileForm.register('phone')}
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-red-400" />
                Changer le Mot de Passe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="pr-10"
                      disabled={loading}
                      {...passwordForm.register('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={showCurrentPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-400">
                      {passwordForm.formState.errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className="pr-10"
                      disabled={loading}
                      {...passwordForm.register('newPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={showNewPassword ? 'Masquer' : 'Afficher'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-400">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    disabled={loading}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-400">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit"
                  variant="destructive"
                  disabled={loading}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {loading ? 'Modification...' : 'Changer le Mot de Passe'}
                </Button>
              </form>
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
                    {user?.mfa_enabled 
                      ? 'L\'authentification à deux facteurs est activée'
                      : 'Sécurisez votre compte avec l\'authentification à deux facteurs'
                    }
                  </p>
                </div>
                <Badge variant={user?.mfa_enabled ? 'success' : 'secondary'}>
                  {user?.mfa_enabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </div>

              {!user?.mfa_enabled ? (
                <Button 
                  className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
                  onClick={handleEnable2FA}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Activer la 2FA
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    variant="outline"
                    onClick={handleGenerateBackupCodes}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Voir les Codes de Récupération
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleDisable2FA}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Désactiver la 2FA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                Préférences de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {Object.entries({
                  emailNotifications: 'Notifications par E-mail',
                  smsNotifications: 'Notifications SMS',
                  quotaAlerts: 'Alertes de Quota',
                  securityAlerts: 'Alertes de Sécurité',
                  maintenanceAlerts: 'Alertes de Maintenance'
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div>
                      <h4 className="font-medium text-white">{label}</h4>
                      <p className="text-sm text-gray-400">
                        {key === 'emailNotifications' && 'Recevoir les notifications importantes par e-mail'}
                        {key === 'smsNotifications' && 'Recevoir les alertes critiques par SMS'}
                        {key === 'quotaAlerts' && 'Être notifié quand les quotas approchent des limites'}
                        {key === 'securityAlerts' && 'Notifications pour les événements de sécurité'}
                        {key === 'maintenanceAlerts' && 'Être informé des maintenances programmées'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notificationSettings[key as keyof typeof notificationSettings]}
                      onChange={(e) => handleNotificationChange(key, e.target.checked)}
                      className="w-4 h-4 accent-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <Button 
                className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                onClick={() => toast.success('Préférences de notification sauvegardées')}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les Préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}