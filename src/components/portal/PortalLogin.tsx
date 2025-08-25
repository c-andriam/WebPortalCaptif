import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wifi, Shield, Clock, Database, Users, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const voucherSchema = z.object({
  code: z.string().length(8, 'Le code doit contenir exactement 8 caractères'),
})

const credentialsSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

interface PortalLoginProps {
  onVoucherLogin: (code: string) => Promise<void>
  onCredentialsLogin: (email: string, password: string) => Promise<void>
  onRegister: () => void
  loading?: boolean
  error?: string
}

export function PortalLogin({ 
  onVoucherLogin, 
  onCredentialsLogin, 
  onRegister, 
  loading, 
  error 
}: PortalLoginProps) {
  const [activeTab, setActiveTab] = useState('voucher')

  const voucherForm = useForm({
    resolver: zodResolver(voucherSchema),
    defaultValues: { code: '' }
  })

  const credentialsForm = useForm({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' }
  })

  const handleVoucherSubmit = async (data: { code: string }) => {
    await onVoucherLogin(data.code)
  }

  const handleCredentialsSubmit = async (data: { email: string; password: string }) => {
    await onCredentialsLogin(data.email, data.password)
  }

  const plans = [
    {
      name: 'Accès Invité',
      duration: '1-24h',
      data: '1-5 GB',
      devices: '1 appareil',
      price: 'Gratuit',
      color: 'text-blue-400'
    },
    {
      name: 'Abonnement Mensuel',
      duration: '720h',
      data: '100 GB',
      devices: '5 appareils',
      price: '29.99€',
      color: 'text-green-400'
    },
    {
      name: 'Abonnement Premium',
      duration: 'Illimité',
      data: '250 GB',
      devices: '10 appareils',
      price: '49.99€',
      color: 'text-purple-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-6">
            <Wifi className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Accès Internet Wi-Fi
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Connectez-vous pour accéder à Internet. Choisissez votre mode d'accès ci-dessous.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Login Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-blue-400" />
                  Connexion Sécurisée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="voucher">Code d'Accès Invité</TabsTrigger>
                    <TabsTrigger value="credentials">Compte Abonné</TabsTrigger>
                  </TabsList>

                  <TabsContent value="voucher" className="space-y-4">
                    <div className="text-center py-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Accès Temporaire
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Utilisez un code d'accès de 8 caractères pour une connexion temporaire
                      </p>
                    </div>

                    <form onSubmit={voucherForm.handleSubmit(handleVoucherSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="voucher-code">Code d'Accès</Label>
                        <Input
                          id="voucher-code"
                          placeholder="ABC12345"
                          className="text-center text-xl tracking-widest font-mono uppercase"
                          maxLength={8}
                          disabled={loading}
                          {...voucherForm.register('code')}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase()
                            voucherForm.setValue('code', value)
                          }}
                        />
                        {voucherForm.formState.errors.code && (
                          <p className="text-sm text-red-400">
                            {voucherForm.formState.errors.code.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-500 hover:bg-blue-600" 
                        disabled={loading}
                      >
                        {loading ? 'Connexion...' : 'Se Connecter'}
                      </Button>
                    </form>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-300 mb-2">
                        <strong>Codes de test disponibles :</strong>
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <code className="text-blue-200 bg-gray-900 px-2 py-1 rounded">DEMO1234</code>
                        <code className="text-blue-200 bg-gray-900 px-2 py-1 rounded">TEST5678</code>
                        <code className="text-blue-200 bg-gray-900 px-2 py-1 rounded">GUEST999</code>
                        <code className="text-blue-200 bg-gray-900 px-2 py-1 rounded">INVITE01</code>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="credentials" className="space-y-4">
                    <div className="text-center py-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Compte Abonné
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Connectez-vous avec votre compte abonné validé
                      </p>
                    </div>

                    <form onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Adresse e-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="votre@email.com"
                          disabled={loading}
                          {...credentialsForm.register('email')}
                        />
                        {credentialsForm.formState.errors.email && (
                          <p className="text-sm text-red-400">
                            {credentialsForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••••••"
                          disabled={loading}
                          {...credentialsForm.register('password')}
                        />
                        {credentialsForm.formState.errors.password && (
                          <p className="text-sm text-red-400">
                            {credentialsForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        disabled={loading}
                      >
                        {loading ? 'Connexion...' : 'Se Connecter'}
                      </Button>
                    </form>

                    <div className="space-y-4">
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-300 mb-2">
                          <strong>Comptes de démonstration :</strong>
                        </p>
                        <div className="space-y-1 text-sm">
                          <div>Admin: <code className="text-green-200">admin@captivenet.com</code> / <code className="text-green-200">AdminPassword123!</code></div>
                          <div>User: <code className="text-green-200">user@example.com</code> / <code className="text-green-200">UserPassword123!</code></div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button 
                          onClick={onRegister}
                          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                        >
                          Pas encore de compte ? Créer un compte abonné
                        </button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plans Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />
                  Plans Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{plan.name}</h4>
                        <span className={`text-sm font-bold ${plan.color}`}>{plan.price}</span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{plan.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span>{plan.data}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wifi className="h-3 w-3" />
                          <span>{plan.devices}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Avantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Connexion sécurisée et chiffrée
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Gestion intelligente des quotas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Support technique disponible
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Accès multi-appareils
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          En vous connectant, vous acceptez nos{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">
            Conditions d'Utilisation
          </a>{' '}
          et notre{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">
            Politique de Confidentialité
          </a>
        </div>
      </div>
    </div>
  )
}