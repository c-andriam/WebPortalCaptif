import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Settings, LogOut, User, Sun, Moon, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useNotifications } from '@/hooks/useNotifications'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
}

interface TopBarProps {
  user?: User
}

export function TopBar({ user }: TopBarProps) {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const recentNotifications = notifications.slice(0, 5)

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
    toast.success('Déconnexion réussie')
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (query.trim()) {
      toast.success(`Recherche: ${query}`)
      // In production, implement actual search functionality
    }
  }

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    toast.success('Notification marquée comme lue')
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
    toast.success('Toutes les notifications marquées comme lues')
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    toast.success(`Langue changée: ${lang === 'fr' ? 'Français' : 'English'}`)
  }

  const handleThemeToggle = () => {
    toggleTheme()
    toast.success(`Thème: ${theme === 'dark' ? 'Clair' : 'Sombre'}`)
  }

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              name="search"
              placeholder={t('common.search') || 'Rechercher...'}
              className="pl-10 bg-gray-800 border-gray-700 w-full"
            />
          </form>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white relative focus:ring-2 focus:ring-blue-500"
                aria-label="Notifications"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <span className="font-semibold">{t('notifications.title') || 'Notifications'}</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    {t('notifications.markAsRead') || 'Marquer comme lu'}
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer focus:bg-gray-800"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-2 h-2 rounded-full ${notification.isRead ? 'bg-gray-600' : 'bg-blue-500'}`} />
                      <span className="font-medium text-sm">{notification.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  <span className="text-gray-400">{t('notifications.noNotifications') || 'Aucune notification'}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleThemeToggle}
            className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
            aria-label="Changer le thème"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
                aria-label="Changer la langue"
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

          {/* Settings */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              navigate('/profile')
              toast.success('Redirection vers les paramètres')
            }}
            aria-label="Paramètres"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-3 text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 mr-2" />
                  {t('nav.profile') || 'Mon Profil'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('Settings') || 'Paramètres'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout') || 'Déconnexion'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}