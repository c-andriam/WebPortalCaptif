import React from 'react'
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
  const { theme, toggleTheme } = useTheme()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="bg-gray-950 border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              className="pl-10 bg-gray-800 border-gray-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white relative">
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
                <span className="font-semibold">{t('notifications.title')}</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    {t('notifications.markAsRead')}
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className="flex flex-col items-start p-3 cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
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
                  <span className="text-gray-400">{t('notifications.noNotifications')}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-gray-400 hover:text-white"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => i18n.changeLanguage('fr')}>
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => i18n.changeLanguage('en')}>
                🇺🇸 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 text-gray-400 hover:text-white">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  {t('nav.profile')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('Settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}