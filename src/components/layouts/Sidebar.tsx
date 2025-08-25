import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Activity, 
  Calendar,
  CheckSquare,
  FolderOpen,
  StickyNote,
  UserCircle,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  BarChart3,
  UserCheck,
  Plus,
  Database,
  Server,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface User {
  id: number
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
}

interface SidebarProps {
  user?: User
}

export function Sidebar({ user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  const getNavigationItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Tableau de Bord', path: '/dashboard' },
      { icon: UserCircle, label: 'Mon Profil', path: '/profile' },
      { icon: Clock, label: 'Timeline', path: '/timeline' },
    ]

    if (user?.role === 'SUBSCRIBER') {
      return [
        ...baseItems,
        { icon: Wifi, label: 'Mes Appareils', path: '/devices' },
        { icon: BarChart3, label: 'Mon Usage', path: '/usage' },
        { icon: Activity, label: 'Mes Sessions', path: '/sessions' },
        { icon: Calendar, label: 'Calendrier', path: '/calendar' },
        { icon: StickyNote, label: 'Notes', path: '/notes' },
      ]
    }

    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
      return [
        ...baseItems,
        { icon: Users, label: 'Utilisateurs', path: '/users' },
        { icon: UserCheck, label: 'Validations', path: '/validation' },
        { icon: Ticket, label: 'Codes Invités', path: '/vouchers' },
        { icon: Plus, label: 'Générer Codes', path: '/voucher-generator' },
        { icon: Activity, label: 'Sessions Actives', path: '/session-monitor' },
        { icon: Database, label: 'Gestion Quotas', path: '/quota-manager' },
        { icon: Calendar, label: 'Calendrier', path: '/calendar' },
        { icon: CheckSquare, label: 'Tâches', path: '/tasks' },
        { icon: FolderOpen, label: 'Fichiers', path: '/files' },
        { icon: StickyNote, label: 'Notes', path: '/notes' },
        { icon: UserCircle, label: 'Contacts', path: '/contacts' },
        ...(user?.role === 'SUPERADMIN' ? [
          { icon: Server, label: 'Métriques Système', path: '/system-metrics' },
          { icon: Settings, label: 'Configuration', path: '/config' },
          { icon: Shield, label: 'Audit', path: '/audit' },
        ] : [])
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className={cn(
      "bg-gray-950 border-r border-gray-800 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-lg font-bold text-white">CaptiveNet</h1>
                <p className="text-xs text-gray-400">Enterprise Portal</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              isActive 
                ? "bg-blue-500 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800",
              collapsed && "justify-center"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      {user && (
        <div className="p-4 border-t border-gray-800">
          {!collapsed ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">{user.role}</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleLogout}
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}