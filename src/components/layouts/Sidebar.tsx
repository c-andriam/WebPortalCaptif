import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
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
  Server
} from 'lucide-react'
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
        { icon: Activity, label: 'Sessions', path: '/sessions' },
        { icon: Activity, label: 'Monitoring Sessions', path: '/session-monitor' },
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
      "bg-gray-950 border-r border-gray-800 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
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
            className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-blue-500 text-white" 
                : "text-gray-400 hover:text-white hover:bg-gray-800",
              collapsed && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {user && !collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
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
        </div>
      )}
    </div>
  )
}