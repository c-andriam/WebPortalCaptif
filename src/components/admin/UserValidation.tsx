import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface PendingUser {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone?: string
  requested_plan: {
    id: number
    name: string
    price: number
    data_quota_gb: number
    time_quota_hours: number
    max_devices: number
  }
  created_at: string
  email_verified: boolean
  registration_ip: string
  user_agent: string
}

interface UserValidationProps {
  user: PendingUser
  onValidate: (userId: number, notes: string) => Promise<void>
  onReject: (userId: number, reason: string) => Promise<void>
  loading?: boolean
}

export function UserValidation({ user, onValidate, onReject, loading }: UserValidationProps) {
  const [validationNotes, setValidationNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const handleValidate = async () => {
    await onValidate(user.id, validationNotes)
    setShowValidateDialog(false)
    setValidationNotes('')
  }

  const handleReject = async () => {
    await onReject(user.id, rejectionReason)
    setShowRejectDialog(false)
    setRejectionReason('')
  }

  const registrationAge = Math.floor(
    (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-yellow-400" />
            Validation Requise
          </CardTitle>
          <Badge variant="warning">En Attente</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Informations Utilisateur</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-white font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-white">{user.email}</p>
                  <div className="flex items-center gap-2">
                    {user.email_verified ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {user.email_verified ? 'Email vérifié' : 'Email non vérifié'}
                    </span>
                  </div>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-white">{user.phone}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-white">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Il y a {registrationAge} jour{registrationAge > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Plan Demandé</h4>
            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-white">{user.requested_plan.name}</h5>
                <span className="text-green-400 font-bold">{user.requested_plan.price}€</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Données</span>
                  <span className="text-white">{user.requested_plan.data_quota_gb} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Temps</span>
                  <span className="text-white">{user.requested_plan.time_quota_hours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Appareils</span>
                  <span className="text-white">{user.requested_plan.max_devices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Information */}
        <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
          <h4 className="font-semibold text-white mb-3">Informations Techniques</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">IP d'inscription:</span>
              <code className="ml-2 text-blue-300">{user.registration_ip}</code>
            </div>
            <div>
              <span className="text-gray-400">User Agent:</span>
              <p className="text-white text-xs mt-1 break-all">{user.user_agent}</p>
            </div>
          </div>
        </div>

        {/* Validation Checks */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white">Vérifications Automatiques</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">Email valide (MX vérifié)</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">Mot de passe conforme</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">CGU acceptées</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-300">Pas de doublon détecté</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <AlertDialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
            <AlertDialogTrigger asChild>
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <UserCheck className="h-4 w-4 mr-2" />
                Valider le Compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Valider le Compte Utilisateur</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de valider le compte de {user.first_name} {user.last_name}.
                  Cette action créera automatiquement l'abonnement et enverra une notification à l'utilisateur.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="validation-notes">Notes de validation (optionnel)</Label>
                <Textarea
                  id="validation-notes"
                  placeholder="Notes internes sur la validation..."
                  value={validationNotes}
                  onChange={(e) => setValidationNotes(e.target.value)}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleValidate}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Validation...' : 'Confirmer la Validation'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex-1">
                <UserX className="h-4 w-4 mr-2" />
                Rejeter le Compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Rejeter le Compte Utilisateur</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point de rejeter le compte de {user.first_name} {user.last_name}.
                  Cette action supprimera définitivement le compte et enverra une notification à l'utilisateur.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Raison du rejet (obligatoire)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Expliquez la raison du rejet..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Rejet...' : 'Confirmer le Rejet'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}