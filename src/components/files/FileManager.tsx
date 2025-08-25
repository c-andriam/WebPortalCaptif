import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Search, 
  Grid3X3, 
  List, 
  FolderOpen, 
  File, 
  FileText,
  Image,
  Archive,
  MoreHorizontal,
  Download,
  Trash2,
  Eye
} from 'lucide-react'

interface FileItem {
  id: number
  name: string
  type: 'folder' | 'document' | 'image' | 'archive' | 'other'
  size?: string
  modified: string
  owner: string
}

const mockFiles: FileItem[] = [
  {
    id: 1,
    name: 'Documents Légaux',
    type: 'folder',
    modified: '2024-01-15',
    owner: 'Admin'
  },
  {
    id: 2,
    name: 'CGU_CaptiveNet_v2.pdf',
    type: 'document',
    size: '2.4 MB',
    modified: '2024-01-14',
    owner: 'SuperAdmin'
  },
  {
    id: 3,
    name: 'Rapport_Audit_Janvier.pdf',
    type: 'document',
    size: '5.1 MB',
    modified: '2024-01-13',
    owner: 'SuperAdmin'
  },
  {
    id: 4,
    name: 'Logo_Entreprise.png',
    type: 'image',
    size: '156 KB',
    modified: '2024-01-12',
    owner: 'Admin'
  },
  {
    id: 5,
    name: 'Backup_Config.zip',
    type: 'archive',
    size: '12.8 MB',
    modified: '2024-01-11',
    owner: 'SuperAdmin'
  },
  {
    id: 6,
    name: 'Templates Email',
    type: 'folder',
    modified: '2024-01-10',
    owner: 'Admin'
  }
]

export function FileManager() {
  const [files] = useState<FileItem[]>(mockFiles)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'folder': return <FolderOpen className="h-8 w-8 text-blue-400" />
      case 'document': return <FileText className="h-8 w-8 text-red-400" />
      case 'image': return <Image className="h-8 w-8 text-green-400" />
      case 'archive': return <Archive className="h-8 w-8 text-yellow-400" />
      default: return <File className="h-8 w-8 text-gray-400" />
    }
  }

  const getFileTypeColor = (type: FileItem['type']) => {
    switch (type) {
      case 'folder': return 'default'
      case 'document': return 'destructive'
      case 'image': return 'success'
      case 'archive': return 'warning'
      default: return 'secondary'
    }
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredFiles.map(file => (
        <Card key={file.id} className="cursor-pointer hover:bg-gray-800/50 transition-colors">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-3">
              {getFileIcon(file.type)}
            </div>
            <h4 className="text-sm font-medium text-white mb-2 truncate" title={file.name}>
              {file.name}
            </h4>
            <div className="space-y-1">
              <Badge variant={getFileTypeColor(file.type)} className="text-xs">
                {file.type === 'folder' ? 'Dossier' : file.type}
              </Badge>
              {file.size && (
                <p className="text-xs text-gray-400">{file.size}</p>
              )}
              <p className="text-xs text-gray-500">
                {new Date(file.modified).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-2">
      {filteredFiles.map(file => (
        <Card key={file.id} className="cursor-pointer hover:bg-gray-800/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div>
                  <h4 className="text-sm font-medium text-white">{file.name}</h4>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>Par {file.owner}</span>
                    <span>{new Date(file.modified).toLocaleDateString('fr-FR')}</span>
                    {file.size && <span>{file.size}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getFileTypeColor(file.type)} className="text-xs">
                  {file.type === 'folder' ? 'Dossier' : file.type}
                </Badge>
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
        <h1 className="text-3xl font-bold text-white">Gestionnaire de Fichiers</h1>
        <Button className="bg-blue-500 hover:bg-blue-600">
          <Upload className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des fichiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
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
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger Fichier
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Nouveau Dossier
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger Sélection
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stockage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Utilisé</span>
                    <span className="text-white">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  7.6 GB disponibles
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fichiers Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFiles.slice(0, 5).map(file => (
                  <div key={file.id} className="flex items-center gap-2">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(file.modified).toLocaleDateString('fr-FR')}
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