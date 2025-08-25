import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  StickyNote, 
  Pin, 
  MoreHorizontal,
  Edit,
  Trash2,
  Star
} from 'lucide-react'

interface Note {
  id: number
  title: string
  content: string
  category: string
  isPinned: boolean
  isFavorite: boolean
  created: string
  modified: string
  color: string
}

const mockNotes: Note[] = [
  {
    id: 1,
    title: 'Procédure Validation Comptes',
    content: 'Étapes pour valider les nouveaux comptes abonnés:\n1. Vérifier les informations\n2. Contrôler les documents\n3. Approuver ou rejeter',
    category: 'Procédures',
    isPinned: true,
    isFavorite: true,
    created: '2024-01-15',
    modified: '2024-01-15',
    color: 'bg-blue-500/20'
  },
  {
    id: 2,
    title: 'Codes Maintenance Serveur',
    content: 'Commandes utiles pour la maintenance:\nsudo systemctl restart nginx\nsudo systemctl status postgresql\ntail -f /var/log/captive-portal.log',
    category: 'Technique',
    isPinned: false,
    isFavorite: false,
    created: '2024-01-14',
    modified: '2024-01-14',
    color: 'bg-green-500/20'
  },
  {
    id: 3,
    title: 'Réunion Équipe - Points Clés',
    content: 'Points abordés:\n- Nouvelle fonctionnalité 2FA\n- Optimisation base de données\n- Formation équipe support',
    category: 'Réunions',
    isPinned: false,
    isFavorite: true,
    created: '2024-01-13',
    modified: '2024-01-13',
    color: 'bg-yellow-500/20'
  },
  {
    id: 4,
    title: 'Contacts Fournisseurs',
    content: 'Support technique: +33 1 23 45 67 89\nCommercial: contact@provider.com\nUrgences: urgence@provider.com',
    category: 'Contacts',
    isPinned: true,
    isFavorite: false,
    created: '2024-01-12',
    modified: '2024-01-12',
    color: 'bg-purple-500/20'
  }
]

export function NotesManager() {
  const [notes] = useState<Note[]>(mockNotes)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(notes.map(note => note.category)))]

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const pinnedNotes = filteredNotes.filter(note => note.isPinned)
  const regularNotes = filteredNotes.filter(note => !note.isPinned)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Notes</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Note
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher dans les notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'Toutes' : category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Pin className="h-5 w-5 text-yellow-400" />
                Notes Épinglées
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map(note => (
                  <Card key={note.id} className={`cursor-pointer hover:bg-gray-800/50 transition-colors ${note.color} border-l-4 border-l-yellow-400`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium text-white">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {note.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-gray-300 line-clamp-4">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {note.category}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(note.modified).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-blue-400" />
              Toutes les Notes
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularNotes.map(note => (
                <Card key={note.id} className={`cursor-pointer hover:bg-gray-800/50 transition-colors ${note.color}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-medium text-white">
                        {note.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        {note.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-gray-300 line-clamp-4">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {note.category}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(note.modified).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Note
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier Sélection
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Pin className="h-4 w-4 mr-2" />
                  Épingler
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total notes</span>
                  <span className="text-white font-medium">{notes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Épinglées</span>
                  <span className="text-white font-medium">{pinnedNotes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Favoris</span>
                  <span className="text-white font-medium">
                    {notes.filter(n => n.isFavorite).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Catégories</span>
                  <span className="text-white font-medium">{categories.length - 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notes
                  .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
                  .slice(0, 5)
                  .map(note => (
                    <div key={note.id} className="flex items-start gap-2">
                      <StickyNote className="h-4 w-4 text-blue-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{note.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(note.modified).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}