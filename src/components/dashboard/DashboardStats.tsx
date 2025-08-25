import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Wifi, 
  Activity, 
  Database, 
  Clock, 
  Shield,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
  }
  icon: React.ElementType
  iconColor: string
}

function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  const getTrendIcon = () => {
    if (!change) return null
    switch (change.type) {
      case 'increase': return <TrendingUp className="h-3 w-3" />
      case 'decrease': return <TrendingDown className="h-3 w-3" />
      default: return <Minus className="h-3 w-3" />
    }
  }

  const getTrendColor = () => {
    if (!change) return 'text-gray-400'
    switch (change.type) {
      case 'increase': return 'text-green-400'
      case 'decrease': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{title}</span>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {change && (
          <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{change.value > 0 ? '+' : ''}{change.value}% {change.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  userRole: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
}

export function DashboardStats({ userRole }: DashboardStatsProps) {
  const getStatsForRole = () => {
    switch (userRole) {
      case 'SUPERADMIN':
      case 'ADMIN':
        return [
          {
            title: 'Utilisateurs Totaux',
            value: '1,247',
            change: { value: 12, type: 'increase' as const, period: 'ce mois' },
            icon: Users,
            iconColor: 'text-blue-400'
          },
          {
            title: 'Connexions Actives',
            value: '89',
            change: { value: 5, type: 'increase' as const, period: 'aujourd\'hui' },
            icon: Wifi,
            iconColor: 'text-green-400'
          },
          {
            title: 'Données Transférées',
            value: '2.4 TB',
            change: { value: 8, type: 'increase' as const, period: 'cette semaine' },
            icon: Database,
            iconColor: 'text-purple-400'
          },
          {
            title: 'Disponibilité',
            value: '99.7%',
            change: { value: 0.2, type: 'increase' as const, period: '30 jours' },
            icon: Activity,
            iconColor: 'text-green-400'
          },
          {
            title: 'Validations en Attente',
            value: '12',
            change: { value: -3, type: 'decrease' as const, period: 'aujourd\'hui' },
            icon: Shield,
            iconColor: 'text-yellow-400'
          },
          {
            title: 'Temps Moyen Session',
            value: '2h 15m',
            change: { value: 10, type: 'increase' as const, period: 'cette semaine' },
            icon: Clock,
            iconColor: 'text-blue-400'
          }
        ]

      case 'SUBSCRIBER':
        return [
          {
            title: 'Mes Appareils',
            value: '3',
            icon: Wifi,
            iconColor: 'text-blue-400'
          },
          {
            title: 'Données Utilisées',
            value: '45.2 GB',
            change: { value: 15, type: 'increase' as const, period: 'ce mois' },
            icon: Database,
            iconColor: 'text-purple-400'
          },
          {
            title: 'Temps Connexion',
            value: '127h',
            change: { value: 8, type: 'increase' as const, period: 'ce mois' },
            icon: Clock,
            iconColor: 'text-green-400'
          },
          {
            title: 'Sessions Actives',
            value: '2',
            icon: Activity,
            iconColor: 'text-green-400'
          }
        ]

      case 'GUEST':
        return [
          {
            title: 'Temps Restant',
            value: '2h 30m',
            icon: Clock,
            iconColor: 'text-yellow-400'
          },
          {
            title: 'Données Restantes',
            value: '343 MB',
            icon: Database,
            iconColor: 'text-blue-400'
          },
          {
            title: 'Vitesse Connexion',
            value: '50 Mbps',
            icon: Wifi,
            iconColor: 'text-green-400'
          },
          {
            title: 'Statut Session',
            value: 'Actif',
            icon: Activity,
            iconColor: 'text-green-400'
          }
        ]

      default:
        return []
    }
  }

  const stats = getStatsForRole()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}