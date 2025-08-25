import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, Wifi, Shield, Key, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const voucherSchema = z.object({
  code: z.string()
    .length(8, 'Le code doit contenir exactement 8 caractères')
    .regex(/^[A-Z0-9]+$/, 'Le code ne peut contenir que des lettres et chiffres')
})

type VoucherFormData = z.infer<typeof voucherSchema>

export function GuestLogin() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { voucherLogin, loading, error } = useAuth()
  const [attemptCount, setAttemptCount] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0)

  const form = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      code: ''
    }
  })

  const code = form.watch('code')
  const isCodeComplete = code.length === 8
  const isCodeValid = voucherSchema.safeParse({ code }).success

  // Auto-submit when code is complete and valid
  useEffect(() => {
    if (isCodeComplete && isCodeValid && !loading && !isBlocked) {
      handleSubmit({ code })
    }
  }, [isCodeComplete, isCodeValid, loading, isBlocked])

  // Handle blocking after failed attempts
  useEffect(() => {
    if (attemptCount >= 5) {
      setIsBlocked(true)
      setBlockTimeRemaining(300) // 5 minutes
      toast.error(t('guest.login.blocked') || 'Trop de tentatives échouées. Veuillez patienter 5 minutes.')
    }
  }, [attemptCount])

  // Countdown for block time
  useEffect(() => {
    if (blockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setBlockTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isBlocked && blockTimeRemaining === 0) {
      setIsBlocked(false)
      setAttemptCount(0)
      toast.success(t('guest.login.unblocked') || 'Vous pouvez maintenant réessayer')
    }
  }, [blockTimeRemaining, isBlocked])

  const handleSubmit = async (data: VoucherFormData) => {
    if (isBlocked) return

    try {
      await voucherLogin(data.code)
      toast.success(t('guest.login.success') || 'Connexion réussie ! Redirection...')
      navigate('/guest/dashboard', { replace: true })
    } catch (error) {
      setAttemptCount(prev => prev + 1)
      const errorMessage = error instanceof Error ? error.message : t('guest.login.invalidCode') || 'Code invalide ou expiré'
      toast.error(errorMessage)
    }
  }

  const handleBack = () => {
    navigate('/guest')
    toast.success(t('guest.login.backToWelcome') || 'Retour à l\'accueil invité')
  }

  const handleDemoCode = (demoCode: string) => {
    form.setValue('code', demoCode)
    toast.success(t('guest.login.demoCodeFilled') || `Code de démo ${demoCode} rempli`)
  }

  const formatBlockTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const demoCodes = ['DEMO1234', 'TEST5678', 'GUEST999', 'INVITE01']

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-sm text-gray-400 hover:text-white mb-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={t('guest.login.backButton') || 'Retour à l\'accueil'}
          >
            <ArrowLeft className="inline w-4 h-4 mr-1" />
            {t('guest.login.back') || 'Retour à l\'accueil'}
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {t('guest.login.title') || 'Code d\'Accès Invité'}
          </h1>
          <p className="text-gray-400 px-4">
            {t('guest.login.subtitle') || 'Saisissez votre code de 8 caractères pour accéder à Internet'}
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Shield className="h-5 w-5 text-blue-400" />
              {t('guest.login.cardTitle') || 'Connexion Sécurisée'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Block Warning */}
            {isBlocked && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-400">
                    {t('guest.login.blockedMessage') || 'Accès temporairement bloqué'}
                  </p>
                  <p className="text-xs text-red-300">
                    {t('guest.login.timeRemaining') || 'Temps restant'}: {formatBlockTime(blockTimeRemaining)}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="voucher-code" className="text-center block">
                  {t('guest.login.codeLabel') || 'Code d\'Accès (8 caractères)'}
                </Label>
                <div className="relative">
                  <Input
                    id="voucher-code"
                    type="text"
                    placeholder="ABC12345"
                    maxLength={8}
                    className="text-center text-xl sm:text-2xl tracking-widest font-mono uppercase h-12 sm:h-14"
                    disabled={loading || isBlocked}
                    {...form.register('code')}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      form.setValue('code', value)
                    }}
                    aria-describedby={form.formState.errors.code ? 'code-error' : 'code-help'}
                  />
                  {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  )}
                </div>
                
                <div id="code-help" className="text-center">
                  <div className="flex justify-center gap-1 mb-2">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-1 rounded-full transition-colors ${
                          index < code.length 
                            ? 'bg-blue-500' 
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('guest.login.codeFormat') || 'Format: 8 caractères alphanumériques'}
                  </p>
                </div>

                {form.formState.errors.code && (
                  <p id="code-error" className="text-sm text-red-400 text-center" role="alert">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>

              {/* Auto-submit indicator */}
              {isCodeComplete && isCodeValid && !isBlocked && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t('guest.login.autoSubmit') || 'Connexion automatique...'}</span>
                </div>
              )}

              {/* Manual submit button (backup) */}
              <Button 
                type="submit" 
                className="w-full bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 h-12" 
                disabled={loading || !isCodeValid || isBlocked}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('guest.login.connecting') || 'Connexion...'}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    {t('guest.login.connect') || 'Se Connecter'}
                  </>
                )}
              </Button>
            </form>

            {/* Demo Codes */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300 mb-3 text-center font-medium">
                {t('guest.login.demoCodes') || 'Codes de Démonstration'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoCodes.map((demoCode) => (
                  <button
                    key={demoCode}
                    type="button"
                    onClick={() => handleDemoCode(demoCode)}
                    disabled={loading || isBlocked}
                    className="text-yellow-200 hover:text-yellow-100 bg-gray-900 px-3 py-2 rounded font-mono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {demoCode}
                  </button>
                ))}
              </div>
              <p className="text-xs text-yellow-200 mt-2 text-center">
                {t('guest.login.demoHelp') || 'Cliquez sur un code pour le tester'}
              </p>
            </div>

            {/* Error Display */}
            {error && !loading && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Attempt Counter */}
            {attemptCount > 0 && attemptCount < 5 && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                <p className="text-sm text-yellow-300">
                  {t('guest.login.attemptsRemaining') || 'Tentatives restantes'}: {5 - attemptCount}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">
              {t('guest.login.help.title') || 'Besoin d\'Aide ?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-400 space-y-2">
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.login.help.step1') || 'Votre code se trouve sur votre ticket d\'accès'}
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.login.help.step2') || 'Saisissez les 8 caractères sans espaces'}
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {t('guest.login.help.step3') || 'La connexion se fait automatiquement'}
              </p>
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                {t('guest.login.help.step4') || 'Chaque code n\'est utilisable qu\'une seule fois'}
              </p>
            </div>
            <div className="text-center pt-2">
              <button 
                onClick={() => toast.success(t('guest.login.help.contact') || 'Support: support@captivenet.com')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('guest.login.help.contactLink') || 'Contacter le Support'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}