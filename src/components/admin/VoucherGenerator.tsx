import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Ticket, 
  Plus, 
  Copy, 
  Download,
  Calendar,
  Users,
  Database,
  Clock
} from 'lucide-react'

const voucherSchema = z.object({
  plan_id: z.string().min(1, 'Plan requis'),
  quantity: z.number().min(1, 'Minimum 1 code').max(100, 'Maximum 100 codes'),
  max_uses: z.number().min(1, 'Minimum 1 utilisation'),
  valid_from: z.string().min(1, 'Date de début requise'),
  valid_until: z.string().min(1, 'Date de fin requise'),
  notes: z.string().optional(),
})

interface Plan {
  id: number
  name: string
  plan_type: string
  data_quota_gb: number
  time_quota_hours: number
  max_devices: number
  price: number
}

interface GeneratedVoucher {
  code: string
  id: number
  plan: Plan
  valid_from: string
  valid_until: string
  status: string
}

interface VoucherGeneratorProps {
  plans: Plan[]
  onGenerate: (data: any) => Promise<GeneratedVoucher[]>
  loading?: boolean
}

export function VoucherGenerator({ plans, onGenerate, loading }: VoucherGeneratorProps) {
  const [generatedVouchers, setGeneratedVouchers] = useState<GeneratedVoucher[]>([])
  const [showResults, setShowResults] = useState(false)

  const form = useForm({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      plan_id: '',
      quantity: 1,
      max_uses: 1,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    }
  })

  const selectedPlan = plans.find(p => p.id.toString() === form.watch('plan_id'))

  const handleSubmit = async (data: any) => {
    try {
      const vouchers = await onGenerate({
        ...data,
        plan_id: parseInt(data.plan_id),
      })
      setGeneratedVouchers(vouchers)
      setShowResults(true)
    } catch (error) {
      console.error('Error generating vouchers:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyAllCodes = () => {
    const codes = generatedVouchers.map(v => v.code).join('\n')
    copyToClipboard(codes)
  }

  const exportCodes = () => {
    const csv = [
      'Code,Plan,Valide du,Valide jusqu\'au,Utilisations max',
      ...generatedVouchers.map(v => 
        `${v.code},${v.plan.name},${v.valid_from},${v.valid_until},1`
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vouchers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (showResults) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-green-400" />
              Codes Générés ({generatedVouchers.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyAllCodes}>
                <Copy className="h-4 w-4 mr-2" />
                Copier Tous
              </Button>
              <Button variant="outline" onClick={exportCodes}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
              <Button onClick={() => setShowResults(false)}>
                Générer d'Autres Codes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {generatedVouchers.map((voucher) => (
              <Card key={voucher.id} className="bg-gray-800/50">
                <CardContent className="p-4">
                  <div className="text-center space-y-3">
                    <code className="text-2xl font-mono text-blue-300 bg-gray-900 px-4 py-2 rounded-lg block">
                      {voucher.code}
                    </code>
                    <div className="space-y-1 text-xs text-gray-400">
                      <p>{voucher.plan.name}</p>
                      <p>{voucher.plan.data_quota_gb} GB • {voucher.plan.time_quota_hours}h</p>
                      <p>Valide du {new Date(voucher.valid_from).toLocaleDateString('fr-FR')}</p>
                      <p>au {new Date(voucher.valid_until).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => copyToClipboard(voucher.code)}
                      className="w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-400" />
          Générer des Codes d'Accès Invités
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan d'Accès</Label>
                <Select onValueChange={(value) => form.setValue('plan_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.filter(p => p.plan_type === 'TEMPORARY').map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - {plan.data_quota_gb}GB / {plan.time_quota_hours}h
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.plan_id && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.plan_id.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Nombre de Codes</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="100"
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Utilisations Max</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    max="10"
                    {...form.register('max_uses', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valide à partir du</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    {...form.register('valid_from')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valide jusqu'au</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    {...form.register('valid_until')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes internes sur ces codes..."
                  {...form.register('notes')}
                />
              </div>
            </div>

            <div className="space-y-4">
              {selectedPlan && (
                <Card className="bg-gray-800/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Aperçu du Plan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <h4 className="font-semibold text-white">{selectedPlan.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-400">Données:</span>
                        <span className="text-white">{selectedPlan.data_quota_gb} GB</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span className="text-gray-400">Temps:</span>
                        <span className="text-white">{selectedPlan.time_quota_hours} heures</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-gray-400">Appareils:</span>
                        <span className="text-white">{selectedPlan.max_devices}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mt-2">
                      {selectedPlan.plan_type}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold text-blue-300 mb-2">Informations Importantes</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Les codes sont à usage unique par défaut</li>
                  <li>• Expiration automatique à la date limite</li>
                  <li>• Audit complet de l'utilisation</li>
                  <li>• Révocation possible à tout moment</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600" 
            disabled={loading || !selectedPlan}
          >
            {loading ? 'Génération...' : `Générer ${form.watch('quantity')} Code${form.watch('quantity') > 1 ? 's' : ''}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}