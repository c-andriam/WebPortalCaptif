import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Shield, Bell, LogOut, User, RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export function GuestLayout() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()

  const handleLogout = async () => {
    if (confirm(t('guest.layout.confirmLogout') || 'Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout()
      navigate('/guest', { replace: true })
      toast.success(t('guest.layout.loggedOut') || 'Déconnexion réussie')
    }
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    toast.success(t('guest.layout.languageChanged') || `Langue changée: ${lang === 'fr' ? 'Français' : 'English'}`)
  }

  const handleNotifications = () => {
    navigate('/guest/profile?tab=notifications')
    toast.success(t('guest.layout.viewingNotifications') || 'Affichage des notifications')
  }

  const handleProfile = () => {
    navigate('/guest/profile')
    toast.success(t('guest.layout.viewingProfile') || 'Affichage du profil')
  }

  const handleDashboard = () => {
    navigate('/guest/dashboard')
    toast.success(t('guest.layout.viewingDashboard') || 'Retour au tableau de bord')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-gray-950 border-b border-gray-800 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={handleDashboard}
            className="flex items-center gap-2 hover:bg-gray-800 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Shield className="h-6 w-6 text-blue-400" />
            <div className="text-left hidden sm:block">
              <h1 className="text-sm font-bold text-white">CaptiveNet</h1>
              <p className="text-xs text-gray-400">{t('guest.layout.guestAccess') || 'Accès Invité'}</p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNotifications}
              className="text-gray-400 hover:text-white relative focus:ring-2 focus:ring-blue-500"
              aria-label={t('guest.layout.notifications') || 'Notifications'}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>

            {/* Language Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
                  aria-label={t('guest.layout.changeLanguage') || 'Changer la langue'}
                >
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleLanguageChange('fr')}>
                  🇫🇷 Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                  🇺🇸 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {t('guest.layout.guestUser') || 'Invité'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleProfile}>
                  <User className="h-4 w-4 mr-2" />
                  {t('guest.layout.profile') || 'Mon Profil'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDashboard}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('guest.layout.dashboard') || 'Tableau de Bord'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('guest.layout.logout') || 'Déconnexion'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 px-4 py-4">
        <div className="container mx-auto text-center">
          <p className="text-xs text-gray-500">
            {t('guest.layout.footer') || 'Session invité temporaire - Code à usage unique - Respectez les conditions d\'utilisation'}
          </p>
        </div>
      </footer>
    </div>
  )
}