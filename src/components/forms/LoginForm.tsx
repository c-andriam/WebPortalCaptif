import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, Wifi, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { loginSchema, voucherLoginSchema, type LoginFormData, type VoucherLoginFormData } from '@/lib/validations'

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>
  onVoucherLogin: (code: string) => Promise<void>
  onRegister: () => void
  onBack?: () => void
  onForgotPassword?: () => void
  loading?: boolean
  error?: string
}

export function LoginForm({ 
  onLogin, 
  onVoucherLogin, 
  onRegister, 
  onBack, 
  onForgotPassword,
  loading, 
  error 
}: LoginFormProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [loginMode, setLoginMode] = useState<'account' | 'voucher'>('account')
  const [showPassword, setShowPassword] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)

  const accountForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const voucherForm = useForm<VoucherLoginFormData>({
    resolver: zodResolver(voucherLoginSchema),
    defaultValues: {
      code: '',
    },
  })

  const handleAccountSubmit = async (data: LoginFormData) => {
    try {
      await onLogin(data.email, data.password)
      toast({
        title: t('auth.loginSuccess'),
        description: t('Welcome back!'),
        variant: 'success',
      })
    } catch (error) {
      setAttemptCount(prev => prev + 1)
      toast({
        title: t('auth.loginError'),
        description: error instanceof Error ? error.message : t('auth.invalidCredentials'),
        variant: 'destructive',
      })
    }
  }

  const handleVoucherSubmit = async (data: VoucherLoginFormData) => {
    try {
      await onVoucherLogin(data.code)
      toast({
        title: t('auth.loginSuccess'),
        description: t('Guest access granted'),
        variant: 'success',
      })
    } catch (error) {
      setAttemptCount(prev => prev + 1)
      toast({
        title: t('auth.loginError'),
        description: error instanceof Error ? error.message : t('Invalid voucher code'),
        variant: 'destructive',
      })
    }
  }

  const isBlocked = attemptCount >= 5

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          {onBack && (
            <button 
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-white mb-2 block transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="inline w-4 h-4 mr-1" />
              {t('Back to home')}
            </button>
          )}
          <h1 className="text-2xl font-bold text-white">{t('Internet Access')}</h1>
          <p className="text-gray-400">{t('Connect to access the internet')}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex space-x-2" role="tablist">
              <button
                role="tab"
                aria-selected={loginMode === 'account'}
                onClick={() => setLoginMode('account')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loginMode === 'account'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {t('Subscriber Account')}
              </button>
              <button
                role="tab"
                aria-selected={loginMode === 'voucher'}
                onClick={() => setLoginMode('voucher')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loginMode === 'voucher'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {t('Guest Code')}
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {isBlocked && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">
                  {t('Account temporarily locked due to multiple failed attempts. Please try again later.')}
                </p>
              </div>
            )}

            {loginMode === 'account' ? (
              <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="pl-10"
                      disabled={loading || isBlocked}
                      {...accountForm.register('email')}
                      aria-describedby={accountForm.formState.errors.email ? 'email-error' : undefined}
                    />
                  </div>
                  {accountForm.formState.errors.email && (
                    <p id="email-error" className="text-sm text-red-400" role="alert">
                      {t(accountForm.formState.errors.email.message!)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10"
                      disabled={loading || isBlocked}
                      {...accountForm.register('password')}
                      aria-describedby={accountForm.formState.errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label={showPassword ? t('Hide password') : t('Show password')}
                      disabled={loading || isBlocked}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {accountForm.formState.errors.password && (
                    <p id="password-error" className="text-sm text-red-400" role="alert">
                      {t(accountForm.formState.errors.password.message!)}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500" 
                  disabled={loading || isBlocked}
                >
                  {loading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            ) : (
              <form onSubmit={voucherForm.handleSubmit(handleVoucherSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucher">{t('auth.voucherCode')}</Label>
                  <Input
                    id="voucher"
                    type="text"
                    placeholder={t('Enter your 8-character code')}
                    maxLength={8}
                    className="text-center text-lg tracking-widest font-mono uppercase"
                    disabled={loading || isBlocked}
                    {...voucherForm.register('code')}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      voucherForm.setValue('code', value)
                    }}
                    aria-describedby={voucherForm.formState.errors.code ? 'code-error' : undefined}
                  />
                  {voucherForm.formState.errors.code && (
                    <p id="code-error" className="text-sm text-red-400" role="alert">
                      {t(voucherForm.formState.errors.code.message!)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    {t('The code consists of 8 alphanumeric characters')}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500" 
                  disabled={loading || isBlocked}
                >
                  {loading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>
            )}

            {loginMode === 'account' && (
              <div className="mt-6 space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-300 mb-2">
                    <strong>{t('Demo accounts')}:</strong>
                  </p>
                  <div className="space-y-1 text-xs">
                    <div>Admin: <code className="text-blue-200">admin@captivenet.com</code> / <code className="text-blue-200">AdminPassword123!</code></div>
                    <div>User: <code className="text-blue-200">user@example.com</code> / <code className="text-blue-200">UserPassword123!</code></div>
                  </div>
                </div>
                
                <div className="text-center">
                  {onForgotPassword && (
                    <button 
                      onClick={onForgotPassword}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-gray-950 px-2 text-gray-400">{t('New?')}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full focus:ring-2 focus:ring-blue-500" 
                  onClick={onRegister}
                  disabled={loading}
                >
                  {t('Create subscriber account')}
                </Button>
              </div>
            )}
            
            {loginMode === 'voucher' && (
              <div className="mt-6">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-300 mb-2">
                    <strong>{t('Test codes')}:</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <code className="text-yellow-200">DEMO1234</code>
                    <code className="text-yellow-200">TEST5678</code>
                    <code className="text-yellow-200">GUEST999</code>
                    <code className="text-yellow-200">INVITE01</code>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          {t('By connecting, you accept our')}{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
            {t('Terms of Service')}
          </a>
        </div>
      </div>
    </div>
  )
}