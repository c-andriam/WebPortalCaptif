import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  Users, 
  Mail, 
  Phone, 
  Building,
  MoreHorizontal,
  Edit,
  Trash2,
  Star,
  Grid3X3,
  List
} from 'lucide-react'

interface Contact {
  id: number
  name: string
  email: string
  phone: string
  company: string
  role: string
  category: 'client' | 'fournisseur' | 'interne' | 'support'
  isFavorite: boolean
  avatar?: string
  lastContact: string
}

const mockContacts: Contact[] = [
  {
    id: 1,
    name: 'Jean Dupont',
    email: 'jean.dupont@entreprise.com',
    phone: '+33 1 23 45 67 89',
    company: 'Entreprise Client A',
    role: 'Directeur IT',
    category: 'client',
    isFavorite: true,
    lastContact: '2024-01-15'
  },
  {
    id: 2,
    name: 'Marie Martin',
    email: 'marie.martin@support.com',
    phone: '+33 1 98 76 54 32',
    company: 'Support Technique',
    role: 'Responsable Support',
    category: 'support',
    isFavorite: false,
    lastContact: '2024-01-14'
  },
  {
    id: 3,
    name: 'Pierre Bernard',
    email: 'p.bernard@fournisseur.com',
    phone: '+33 1 11 22 33 44',
    company: 'Fournisseur Réseau',
    role: 'Commercial',
    category: 'fournisseur',
    isFavorite: true,
    lastContact: '2024-01-13'
  },
  {
    id: 4,
    name: 'Sophie Leroy',
    email: 'sophie.leroy@captivenet.com',
    phone: '+33 1 55 66 77 88',
    company: 'CaptiveNet',
    role: 'Admin Système',
    category: 'interne',
    isFavorite: false,
    lastContact: '2024-01-12'
  }
]

export function ContactsManager() {
  const [contacts] = useState<Contact[]>(mockContacts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const categories = [
    { id: 'all', label: 'Tous', count: contacts.length },
    { id: 'client', label: 'Clients', count: contacts.filter(c => c.category === 'client').length },
    { id: 'fournisseur', label: 'Fournisseurs', count: contacts.filter(c => c.category === 'fournisseur').length },
    { id: 'interne', label: 'Interne', count: contacts.filter(c => c.category === 'interne').length },
    { id: 'support', label: 'Support', count: contacts.filter(c => c.category === 'support').length }
  ]

  const getCategoryColor = (category: Contact['category']) => {
    switch (category) {
      case 'client': return 'success'
      case 'fournisseur': return 'warning'
      case 'interne': return 'default'
      case 'support': return 'destructive'
      default: return 'secondary'
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const renderGridView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredContacts.map(contact => (
        <Card key={contact.id} className="cursor-pointer hover:bg-gray-800/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-sm font-medium text-white">
                    {contact.name}
                  </CardTitle>
                  <p className="text-xs text-gray-400">{contact.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {contact.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="h-3 w-3" />
                <span className="truncate">{contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Phone className="h-3 w-3" />
                <span>{contact.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Building className="h-3 w-3" />
                <span className="truncate">{contact.company}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant={getCategoryColor(contact.category)} className="text-xs">
                {contact.category}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(contact.lastContact).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      {filteredContacts.map(contact => (
        <Card key={contact.id} className="cursor-pointer hover:bg-gray-800/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-4 flex-1">
                  <div>
                    <h4 className="text-sm font-medium text-white">{contact.name}</h4>
                    <p className="text-xs text-gray-400">{contact.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{contact.email}</p>
                    <p className="text-xs text-gray-400">{contact.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">{contact.company}</p>
                    <Badge variant={getCategoryColor(contact.category)} className="text-xs mt-1">
                      {contact.category}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dernier contact</p>
                    <p className="text-sm text-gray-300">
                      {new Date(contact.lastContact).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {contact.isFavorite && <Star className="h-4 w-4 text-yellow-400 fill-current" />}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Contacts</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Contact
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          {viewMode === 'grid' ? renderGridView() : renderListView()}
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
                  Nouveau Contact
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer Email
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Créer Groupe
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
                  <span className="text-gray-400">Total contacts</span>
                  <span className="text-white font-medium">{contacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Favoris</span>
                  <span className="text-white font-medium">
                    {contacts.filter(c => c.isFavorite).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Clients</span>
                  <span className="text-white font-medium">
                    {contacts.filter(c => c.category === 'client').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fournisseurs</span>
                  <span className="text-white font-medium">
                    {contacts.filter(c => c.category === 'fournisseur').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contacts
                  .sort((a, b) => new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime())
                  .slice(0, 5)
                  .map(contact => (
                    <div key={contact.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{contact.name}</p>
                        <p className="text-xs text-gray-400">{contact.company}</p>
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