import React from 'react'
import { Shield, User, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

interface User {
  id: number
  email: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
}

interface HeaderProps {
  user?: User
  onLogout?: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'destructive'
      case 'ADMIN': return 'warning'
      case 'SUBSCRIBER': return 'success'
      case 'GUEST': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold text-white">CaptiveNet</h1>
              <p className="text-sm text-gray-400">Portail de Gestion d'Accès</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white">{user.email}</span>
                <Badge variant={getRoleColor(user.role)} className="text-xs">
                  {user.role}
                </Badge>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout}
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}