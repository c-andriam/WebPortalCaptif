import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff, Mail, User, Phone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import toast from 'react-hot-toast'

interface RegisterFormProps {
  onRegister: (userData: RegisterFormData) => Promise<void>
  onBack: () => void
  loading?: boolean
  error?: string
}

export function RegisterForm({ onRegister, onBack, loading, error }: RegisterFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      phone: '',
      password: '',
      password_confirm: '',
    },
  })

  const password = form.watch('password')
  const passwordStrength = calculatePasswordStrength(password)

  function calculatePasswordStrength(password: string): number {
    let strength = 0
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[!@#$%^&*]/.test(password)) strength += 1
    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return 'bg-red-500'
    if (strength < 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = (strength: number) => {
    if (strength < 2) return 'Faible'
    if (strength < 4) return 'Moyen'
    return 'Fort'
  }

  const handleSubmit = async (data: RegisterFormData) => {
    if (!termsAccepted) {
      toast.error('Vous devez accepter les conditions d\'utilisation')
      return
    }

    try {
      await onRegister(data)
      toast.success('Inscription réussie ! Votre compte est en attente de validation.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription')
    }
  }

  const handleTermsClick = () => {
    toast.success('CGU en cours de développement')
  }

  const handlePrivacyClick = () => {
    toast.success('Politique de confidentialité en cours de développement')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                className="text-gray-400 hover:text-white focus:ring-2 focus:ring-blue-500"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Créer un compte abonné</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="first_name"
                      placeholder="Jean"
                      className="pl-10"
                      disabled={loading}
                      {...form.register('first_name')}
                      aria-describedby={form.formState.errors.first_name ? 'first-name-error' : undefined}
                    />
                  </div>
                  {form.formState.errors.first_name && (
                    <p id="first-name-error" className="text-sm text-red-400" role="alert">
                      {form.formState.errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    placeholder="Dupont"
                    disabled={loading}
                    {...form.register('last_name')}
                    aria-describedby={form.formState.errors.last_name ? 'last-name-error' : undefined}
                  />
                  {form.formState.errors.last_name && (
                    <p id="last-name-error" className="text-sm text-red-400" role="alert">
                      {form.formState.errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  placeholder="jean.dupont"
                  disabled={loading}
                  {...form.register('username')}
                  aria-describedby={form.formState.errors.username ? 'username-error' : undefined}
                />
                {form.formState.errors.username && (
                  <p id="username-error" className="text-sm text-red-400" role="alert">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean.dupont@example.com"
                    className="pl-10"
                    disabled={loading}
                    {...form.register('email')}
                    aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                  />
                </div>
                {form.formState.errors.email && (
                  <p id="email-error" className="text-sm text-red-400" role="alert">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone (optionnel)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 1 23 45 67 89"
                    className="pl-10"
                    disabled={loading}
                    {...form.register('phone')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 12 caractères"
                    className="pl-10 pr-10"
                    disabled={loading}
                    {...form.register('password')}
                    aria-describedby={form.formState.errors.password ? 'password-error' : 'password-help'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                        <div 
                          className={`h-full rounded-full transition-all ${getStrengthColor(passwordStrength)}`}
                          style={{ width: `${(passwordStrength / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{getStrengthText(passwordStrength)}</span>
                    </div>
                    <div id="password-help" className="text-xs text-gray-500 space-y-1">
                      <p className={password.length >= 12 ? 'text-green-400' : ''}>
                        • Minimum 12 caractères
                      </p>
                      <p className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-400' : ''}>
                        • Lettres majuscules et minuscules
                      </p>
                      <p className={/\d/.test(password) ? 'text-green-400' : ''}>
                        • Au moins un chiffre
                      </p>
                      <p className={/[!@#$%^&*]/.test(password) ? 'text-green-400' : ''}>
                        • Au moins un caractère spécial
                      </p>
                    </div>
                  </div>
                )}
                
                {form.formState.errors.password && (
                  <p id="password-error" className="text-sm text-red-400" role="alert">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password_confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmez votre mot de passe"
                    className="pl-10 pr-10"
                    disabled={loading}
                    {...form.register('password_confirm')}
                    aria-describedby={form.formState.errors.password_confirm ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password_confirm && (
                  <p id="confirm-password-error" className="text-sm text-red-400" role="alert">
                    {form.formState.errors.password_confirm.message}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-blue-500 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  J'accepte les{' '}
                  <button 
                    type="button"
                    onClick={handleTermsClick}
                    className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded underline"
                  >
                    Conditions d'Utilisation
                  </button>{' '}
                  et la{' '}
                  <button 
                    type="button"
                    onClick={handlePrivacyClick}
                    className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded underline"
                  >
                    Politique de Confidentialité
                  </button>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500" 
                disabled={loading || passwordStrength < 3 || !termsAccepted}
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 text-center">
                <strong>Validation requise :</strong> Votre compte doit être validé par un administrateur avant de pouvoir accéder à Internet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}