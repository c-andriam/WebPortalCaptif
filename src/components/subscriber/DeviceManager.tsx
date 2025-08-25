import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Wifi, 
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const deviceSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  mac_address: z.string().regex(
    /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    'Format MAC invalide (ex: AA:BB:CC:DD:EE:FF)'
  ),
  device_type: z.string().min(1, 'Type requis'),
})

interface Device {
  id: number
  name: string
  mac_address: string
  device_type: string
  last_ip?: string
  last_seen?: string
  is_revoked: boolean
  stats: {
    total_sessions: number
    total_data_gb: number
    total_time_hours: number
  }
  created_at: string
}

interface DeviceManagerProps {
  devices: Device[]
  maxDevices: number
  onAddDevice: (device: { name: string; mac_address: string; device_type: string }) => Promise<void>
  onUpdateDevice: (id: number, data: Partial<Device>) => Promise<void>
  onRemoveDevice: (id: number) => Promise<void>
  loading?: boolean
}

export function DeviceManager({ 
  devices, 
  maxDevices, 
  onAddDevice, 
  onUpdateDevice, 
  onRemoveDevice, 
  loading 
}: DeviceManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)

  const form = useForm({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: '',
      mac_address: '',
      device_type: 'smartphone',
    }
  })

  const deviceTypes = [
    { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
    { value: 'laptop', label: 'Ordinateur Portable', icon: Laptop },
    { value: 'tablet', label: 'Tablette', icon: Tablet },
    { value: 'desktop', label: 'Ordinateur de Bureau', icon: Wifi },
    { value: 'other', label: 'Autre', icon: Wifi },
  ]

  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find(dt => dt.value === type)
    return deviceType ? deviceType.icon : Wifi
  }

  const getDeviceTypeLabel = (type: string) => {
    const deviceType = deviceTypes.find(dt => dt.value === type)
    return deviceType ? deviceType.label : type
  }

  const handleSubmit = async (data: any) => {
    try {
      await onAddDevice(data)
      setShowAddDialog(false)
      form.reset()
    } catch (error) {
      console.error('Error adding device:', error)
    }
  }

  const handleRemove = async (deviceId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
      await onRemoveDevice(deviceId)
    }
  }

  const activeDevices = devices.filter(d => !d.is_revoked)
  const canAddDevice = activeDevices.length < maxDevices

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mes Appareils</h2>
          <p className="text-gray-400">
            {activeDevices.length} / {maxDevices} appareils configurés
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-500 hover:bg-blue-600"
              disabled={!canAddDevice || loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Appareil
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un Nouvel Appareil</DialogTitle>
              <DialogDescription>
                Configurez un nouvel appareil pour accéder au réseau Wi-Fi
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Nom de l'appareil</Label>
                <Input
                  id="device-name"
                  placeholder="iPhone de Jean, MacBook Pro..."
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac-address">Adresse MAC</Label>
                <Input
                  id="mac-address"
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="font-mono"
                  {...form.register('mac_address')}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    form.setValue('mac_address', value)
                  }}
                />
                {form.formState.errors.mac_address && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.mac_address.message}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Trouvez l'adresse MAC dans les paramètres réseau de votre appareil
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-type">Type d'appareil</Label>
                <Select onValueChange={(value) => form.setValue('device_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Ajout...' : 'Ajouter l\'Appareil'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Device Limit Warning */}
      {!canAddDevice && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-300">
                  Limite d'appareils atteinte
                </p>
                <p className="text-xs text-yellow-200">
                  Supprimez un appareil existant pour en ajouter un nouveau
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const DeviceIcon = getDeviceIcon(device.device_type)
          
          return (
            <Card key={device.id} className={device.is_revoked ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <DeviceIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-white">
                        {device.name}
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        {getDeviceTypeLabel(device.device_type)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingDevice(device)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRemove(device.id)}
                        className="text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">MAC:</span>
                    <code className="ml-2 text-blue-300 font-mono">{device.mac_address}</code>
                  </div>
                  {device.last_ip && (
                    <div>
                      <span className="text-gray-400">Dernière IP:</span>
                      <code className="ml-2 text-green-300">{device.last_ip}</code>
                    </div>
                  )}
                  {device.last_seen && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-400">Vu:</span>
                      <span className="text-white">
                        {new Date(device.last_seen).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-white">Statistiques d'Usage</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 rounded bg-gray-800/50">
                      <p className="text-gray-400">Sessions</p>
                      <p className="text-white font-medium">{device.stats.total_sessions}</p>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-800/50">
                      <p className="text-gray-400">Données</p>
                      <p className="text-white font-medium">{device.stats.total_data_gb.toFixed(1)} GB</p>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-800/50">
                      <p className="text-gray-400">Temps</p>
                      <p className="text-white font-medium">{device.stats.total_time_hours.toFixed(1)}h</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant={device.is_revoked ? 'destructive' : 'success'}>
                    {device.is_revoked ? 'Révoqué' : 'Actif'}
                  </Badge>
                  {device.last_seen && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-300">En ligne</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {devices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wifi className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucun Appareil Configuré</h3>
            <p className="text-gray-400 mb-4">
              Ajoutez vos appareils pour accéder au réseau Wi-Fi
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter mon Premier Appareil
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}