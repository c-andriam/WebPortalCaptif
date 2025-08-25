import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff, Mail, User, Phone, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

interface RegisterFormProps {
  onRegister: (userData: RegisterFormData) => Promise<void>
  onBack: () => void
  loading?: boolean
  error?: string
}

export function RegisterForm({ onRegister, onBack, loading, error }: RegisterFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    if (strength < 2) return t('Weak')
    if (strength < 4) return t('Medium')
    return t('Strong')
  }

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      await onRegister(data)
      toast({
        title: t('Registration successful'),
        description: t('Your account has been created and is pending validation'),
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: t('Registration failed'),
        description: error instanceof Error ? error.message : t('An error occurred'),
        variant: 'destructive',
      })
    }
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
                aria-label={t('common.back')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{t('Create subscriber account')}</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">{t('First name')}</Label>
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
                      {t(form.formState.errors.first_name.message!)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">{t('Last name')}</Label>
                  <Input
                    id="last_name"
                    placeholder="Dupont"
                    disabled={loading}
                    {...form.register('last_name')}
                    aria-describedby={form.formState.errors.last_name ? 'last-name-error' : undefined}
                  />
                  {form.formState.errors.last_name && (
                    <p id="last-name-error" className="text-sm text-red-400" role="alert">
                      {t(form.formState.errors.last_name.message!)}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t('Username')}</Label>
                <Input
                  id="username"
                  placeholder="jean.dupont"
                  disabled={loading}
                  {...form.register('username')}
                  aria-describedby={form.formState.errors.username ? 'username-error' : undefined}
                />
                {form.formState.errors.username && (
                  <p id="username-error" className="text-sm text-red-400" role="alert">
                    {t(form.formState.errors.username.message!)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
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
                    {t(form.formState.errors.email.message!)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('Phone (optional)')}</Label>
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
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('Minimum 12 characters')}
                    className="pl-10 pr-10"
                    disabled={loading}
                    {...form.register('password')}
                    aria-describedby={form.formState.errors.password ? 'password-error' : 'password-help'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showPassword ? t('Hide password') : t('Show password')}
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
                        • {t('Minimum 12 characters')}
                      </p>
                      <p className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-400' : ''}>
                        • {t('Uppercase and lowercase letters')}
                      </p>
                      <p className={/\d/.test(password) ? 'text-green-400' : ''}>
                        • {t('At least one number')}
                      </p>
                      <p className={/[!@#$%^&*]/.test(password) ? 'text-green-400' : ''}>
                        • {t('At least one special character')}
                      </p>
                    </div>
                  </div>
                )}
                
                {form.formState.errors.password && (
                  <p id="password-error" className="text-sm text-red-400" role="alert">
                    {t(form.formState.errors.password.message!)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirm">{t('auth.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="password_confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('Confirm your password')}
                    className="pl-10 pr-10"
                    disabled={loading}
                    {...form.register('password_confirm')}
                    aria-describedby={form.formState.errors.password_confirm ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    aria-label={showConfirmPassword ? t('Hide password') : t('Show password')}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password_confirm && (
                  <p id="confirm-password-error" className="text-sm text-red-400" role="alert">
                    {t(form.formState.errors.password_confirm.message!)}
                  </p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required 
                  className="mt-1 accent-blue-500 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  {t('I accept the')}{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {t('Terms of Service')}
                  </a>{' '}
                  {t('and the')}{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                    {t('Privacy Policy')}
                  </a>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500" 
                disabled={loading || passwordStrength < 3}
              >
                {loading ? t('common.loading') : t('Create my account')}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300 text-center">
                <strong>{t('Validation required')}:</strong> {t('Your account must be validated by an administrator before you can access the internet')}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}