import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  CheckSquare,
  Clock,
  User,
  Flag
} from 'lucide-react'

interface Task {
  id: number
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string
  dueDate: string
  labels: string[]
}

const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Validation Comptes Abonnés',
    description: 'Valider les 12 comptes en attente',
    status: 'todo',
    priority: 'high',
    assignee: 'Admin Principal',
    dueDate: '2024-01-20',
    labels: ['validation', 'urgent']
  },
  {
    id: 2,
    title: 'Maintenance Serveur Redis',
    description: 'Mise à jour et optimisation du cache Redis',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Tech Lead',
    dueDate: '2024-01-25',
    labels: ['maintenance', 'backend']
  },
  {
    id: 3,
    title: 'Audit Logs Sécurité',
    description: 'Révision des logs d\'audit du mois',
    status: 'review',
    priority: 'medium',
    assignee: 'SuperAdmin',
    dueDate: '2024-01-30',
    labels: ['sécurité', 'audit']
  },
  {
    id: 4,
    title: 'Génération Codes Invités',
    description: 'Créer 50 nouveaux codes pour événement',
    status: 'done',
    priority: 'low',
    assignee: 'Admin',
    dueDate: '2024-01-15',
    labels: ['vouchers', 'événement']
  }
]

export function TaskBoard() {
  const [tasks] = useState<Task[]>(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')

  const columns = [
    { id: 'todo', title: 'À Faire', color: 'bg-gray-800' },
    { id: 'in-progress', title: 'En Cours', color: 'bg-blue-900/50' },
    { id: 'review', title: 'Révision', color: 'bg-yellow-900/50' },
    { id: 'done', title: 'Terminé', color: 'bg-green-900/50' }
  ]

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'warning'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return <Flag className="h-3 w-3 text-red-400" />
      case 'high': return <Flag className="h-3 w-3 text-orange-400" />
      case 'medium': return <Flag className="h-3 w-3 text-yellow-400" />
      case 'low': return <Flag className="h-3 w-3 text-green-400" />
      default: return null
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gestion des Tâches</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Tâche
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des tâches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            <div className={`p-4 rounded-lg ${column.color}`}>
              <h3 className="font-semibold text-white flex items-center justify-between">
                {column.title}
                <Badge variant="secondary" className="text-xs">
                  {filteredTasks.filter(task => task.status === column.id).length}
                </Badge>
              </h3>
            </div>

            <div className="space-y-3">
              {filteredTasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <Card key={task.id} className="cursor-pointer hover:bg-gray-800/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-white">
                          {task.title}
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {task.labels.map(label => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          {getPriorityIcon(task.priority)}
                          <span className="capitalize">{task.priority}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-400">{task.assignee}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}