import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  User, 
  Shield, 
  UserCheck, 
  Ticket, 
  Settings,
  Activity,
  Search,
  Filter
} from 'lucide-react'

interface TimelineEvent {
  id: number
  type: 'login' | 'validation' | 'voucher' | 'config' | 'session' | 'audit'
  title: string
  description: string
  actor: string
  timestamp: string
  metadata?: Record<string, any>
}

const mockEvents: TimelineEvent[] = [
  {
    id: 1,
    type: 'login',
    title: 'Connexion Administrateur',
    description: 'admin@captivenet.com s\'est connecté au système',
    actor: 'admin@captivenet.com',
    timestamp: '2024-01-15T14:30:00Z'
  },
  {
    id: 2,
    type: 'validation',
    title: 'Validation Compte Abonné',
    description: 'Compte jean.dupont@example.com validé par l\'administrateur',
    actor: 'admin@captivenet.com',
    timestamp: '2024-01-15T14:25:00Z',
    metadata: { targetUser: 'jean.dupont@example.com' }
  },
  {
    id: 3,
    type: 'voucher',
    title: 'Création Code Invité',
    description: 'Nouveau code invité ABC12345 créé',
    actor: 'admin@captivenet.com',
    timestamp: '2024-01-15T14:20:00Z',
    metadata: { voucherCode: 'ABC12345' }
  },
  {
    id: 4,
    type: 'session',
    title: 'Nouvelle Session',
    description: 'Session démarrée pour marie.martin@example.com',
    actor: 'marie.martin@example.com',
    timestamp: '2024-01-15T14:15:00Z',
    metadata: { ip: '192.168.1.45', mac: 'AA:BB:CC:DD:EE:FF' }
  },
  {
    id: 5,
    type: 'config',
    title: 'Modification Configuration',
    description: 'Paramètres de quota modifiés',
    actor: 'superadmin@captivenet.com',
    timestamp: '2024-01-15T14:10:00Z',
    metadata: { setting: 'quota_limits' }
  },
  {
    id: 6,
    type: 'audit',
    title: 'Consultation Logs Audit',
    description: 'Accès aux logs d\'audit par le super administrateur',
    actor: 'superadmin@captivenet.com',
    timestamp: '2024-01-15T14:05:00Z'
  }
]

export function Timeline() {
  const [events] = useState<TimelineEvent[]>(mockEvents)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const eventTypes = [
    { id: 'all', label: 'Tous', icon: Clock },
    { id: 'login', label: 'Connexions', icon: User },
    { id: 'validation', label: 'Validations', icon: UserCheck },
    { id: 'voucher', label: 'Codes Invités', icon: Ticket },
    { id: 'session', label: 'Sessions', icon: Activity },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'audit', label: 'Audit', icon: Shield }
  ]

  const getEventIcon = (type: TimelineEvent['type']) => {
    const eventType = eventTypes.find(t => t.id === type)
    return eventType ? eventType.icon : Clock
  }

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'login': return 'text-blue-400'
      case 'validation': return 'text-green-400'
      case 'voucher': return 'text-yellow-400'
      case 'session': return 'text-purple-400'
      case 'config': return 'text-red-400'
      case 'audit': return 'text-orange-400'
      default: return 'text-gray-400'
    }
  }

  const getBadgeVariant = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'login': return 'default'
      case 'validation': return 'success'
      case 'voucher': return 'warning'
      case 'session': return 'secondary'
      case 'config': return 'destructive'
      case 'audit': return 'outline'
      default: return 'outline'
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.actor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || event.type === selectedType
    return matchesSearch && matchesType
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Timeline des Événements</h1>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les événements..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {eventTypes.map(type => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.id)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700"></div>
            
            <div className="space-y-6">
              {filteredEvents.map((event, index) => {
                const Icon = getEventIcon(event.type)
                return (
                  <div key={event.id} className="relative flex items-start gap-4">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 border-2 border-gray-700 ${getEventColor(event.type)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Event content */}
                    <Card className="flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm font-medium text-white">
                              {event.title}
                            </CardTitle>
                            <p className="text-xs text-gray-400 mt-1">
                              {event.description}
                            </p>
                          </div>
                          <Badge variant={getBadgeVariant(event.type)} className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <User className="h-3 w-3" />
                            <span>{event.actor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(event.timestamp)}</span>
                          </div>
                        </div>
                        
                        {event.metadata && (
                          <div className="mt-3 p-2 rounded bg-gray-800/50 border border-gray-700">
                            <div className="text-xs text-gray-300">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-400">{key}:</span>
                                  <span className="font-mono">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Événements aujourd'hui</span>
                  <span className="text-white font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Connexions</span>
                  <span className="text-white font-medium">
                    {events.filter(e => e.type === 'login').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Validations</span>
                  <span className="text-white font-medium">
                    {events.filter(e => e.type === 'validation').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sessions</span>
                  <span className="text-white font-medium">
                    {events.filter(e => e.type === 'session').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.slice(0, 5).map(event => {
                  const Icon = getEventIcon(event.type)
                  return (
                    <div key={event.id} className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-1 flex-shrink-0 ${getEventColor(event.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{event.title}</p>
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtres Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs">
                  <Clock className="h-3 w-3 mr-2" />
                  Dernière heure
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  <Clock className="h-3 w-3 mr-2" />
                  Aujourd'hui
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  <Clock className="h-3 w-3 mr-2" />
                  Cette semaine
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  <Shield className="h-3 w-3 mr-2" />
                  Actions sensibles
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}