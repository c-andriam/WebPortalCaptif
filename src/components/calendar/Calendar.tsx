import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  Users
} from 'lucide-react'

interface Event {
  id: number
  title: string
  date: Date
  time: string
  type: 'maintenance' | 'meeting' | 'deadline' | 'reminder'
  attendees?: number
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const events: Event[] = [
    {
      id: 1,
      title: 'Maintenance Serveur',
      date: new Date(2024, 0, 15),
      time: '14:00',
      type: 'maintenance'
    },
    {
      id: 2,
      title: 'Réunion Équipe Admin',
      date: new Date(2024, 0, 18),
      time: '10:00',
      type: 'meeting',
      attendees: 5
    },
    {
      id: 3,
      title: 'Renouvellement Certificats',
      date: new Date(2024, 0, 22),
      time: '09:00',
      type: 'deadline'
    },
    {
      id: 4,
      title: 'Validation Comptes en Attente',
      date: new Date(2024, 0, 25),
      time: '16:00',
      type: 'reminder'
    }
  ]

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'maintenance': return 'destructive'
      case 'meeting': return 'default'
      case 'deadline': return 'warning'
      case 'reminder': return 'secondary'
      default: return 'outline'
    }
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-800"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter(event => 
        event.date.getDate() === day &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear()
      )

      days.push(
        <div key={day} className="h-24 border border-gray-800 p-1 bg-gray-900 hover:bg-gray-800 transition-colors">
          <div className="text-sm text-white mb-1">{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className="text-xs p-1 rounded bg-blue-500/20 text-blue-300 truncate"
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-400">+{dayEvents.length - 2} autres</div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Calendrier</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Événement
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-400" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg bg-gray-800 p-1">
                    {(['month', 'week', 'day'] as const).map((viewType) => (
                      <button
                        key={viewType}
                        onClick={() => setView(viewType)}
                        className={`px-3 py-1 text-sm rounded-md transition-colors ${
                          view === viewType
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {viewType === 'month' ? 'Mois' : viewType === 'week' ? 'Semaine' : 'Jour'}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0 mb-4">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-400 border border-gray-800">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0">
                {renderCalendarGrid()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Événements à Venir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{event.title}</h4>
                        <Badge variant={getEventColor(event.type)} className="text-xs">
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {event.date.toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                        {event.attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Planifier Maintenance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Réunion Équipe
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Rappel Validation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}