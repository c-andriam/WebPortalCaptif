import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Wifi, Shield, Clock, Database, Users, CheckCircle, ArrowRight, Gift } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export function GuestWelcome() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleGetStarted = () => {
    navigate('/guest/login')
    toast.success(t('guest.welcome.redirecting') || 'Redirection vers la connexion invité')
  }

  const handleViewPlans = () => {
    toast.success(t('guest.welcome.viewingPlans') || 'Consultation des plans disponibles')
  }

  const guestPlans = [
    {
      name: t('guest.plans.hourly.name') || 'Accès 1 Heure',
      price: t('guest.plans.hourly.price') || 'Gratuit',
      duration: '1h',
      data: '1 GB',
      devices: '1',
      features: [
        t('guest.plans.hourly.feature1') || 'Navigation web standard',
        t('guest.plans.hourly.feature2') || 'Réseaux sociaux',
        t('guest.plans.hourly.feature3') || 'Email et messagerie'
      ],
      color: 'text-green-400',
      popular: false
    },
    {
      name: t('guest.plans.daily.name') || 'Accès 24 Heures',
      price: '2.99€',
      duration: '24h',
      data: '5 GB',
      devices: '1',
      features: [
        t('guest.plans.daily.feature1') || 'Navigation illimitée',
        t('guest.plans.daily.feature2') || 'Streaming vidéo',
        t('guest.plans.daily.feature3') || 'Téléchargements',
        t('guest.plans.daily.feature4') || 'Jeux en ligne'
      ],
      color: 'text-blue-400',
      popular: true
    },
    {
      name: t('guest.plans.weekly.name') || 'Accès 7 Jours',
      price: '9.99€',
      duration: '168h',
      data: '25 GB',
      devices: '3',
      features: [
        t('guest.plans.weekly.feature1') || 'Multi-appareils',
        t('guest.plans.weekly.feature2') || 'Streaming HD',
        t('guest.plans.weekly.feature3') || 'Support prioritaire',
        t('guest.plans.weekly.feature4') || 'Accès étendu'
      ],
      color: 'text-purple-400',
      popular: false
    }
  ]

  const benefits = [
    {
      icon: Shield,
      title: t('guest.benefits.security.title') || 'Connexion Sécurisée',
      description: t('guest.benefits.security.desc') || 'Chiffrement WPA3 et protection des données personnelles'
    },
    {
      icon: Clock,
      title: t('guest.benefits.instant.title') || 'Accès Instantané',
      description: t('guest.benefits.instant.desc') || 'Connexion immédiate avec votre code d\'accès'
    },
    {
      icon: Database,
      title: t('guest.benefits.quotas.title') || 'Quotas Transparents',
      description: t('guest.benefits.quotas.desc') || 'Suivi en temps réel de votre consommation'
    },
    {
      icon: Users,
      title: t('guest.benefits.support.title') || 'Support Disponible',
      description: t('guest.benefits.support.desc') || 'Assistance technique en cas de problème'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20"></div>
        <div className="relative container mx-auto px-4 py-12 sm:py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-2xl mb-6 sm:mb-8">
              <Wifi className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              {t('guest.welcome.title') || 'Accès Internet Wi-Fi'}
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-4">
              {t('guest.welcome.subtitle') || 'Connectez-vous rapidement avec votre code d\'accès invité pour profiter d\'Internet en toute sécurité.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 sm:px-8 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                onClick={handleGetStarted}
              >
                {t('guest.welcome.getStarted') || 'Commencer'}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-600 text-white hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                onClick={handleViewPlans}
              >
                {t('guest.welcome.viewPlans') || 'Voir les Offres'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t('guest.benefits.title') || 'Pourquoi Choisir Notre Service'}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto px-4">
            {t('guest.benefits.subtitle') || 'Une expérience Internet optimale avec sécurité et simplicité'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-gray-800 bg-gray-950/50 backdrop-blur hover:bg-gray-900/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-sm sm:text-base">{benefit.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400 text-sm">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            {t('guest.plans.title') || 'Offres d\'Accès Invité'}
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto px-4">
            {t('guest.plans.subtitle') || 'Choisissez la durée d\'accès qui vous convient'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {guestPlans.map((plan, index) => (
            <Card key={index} className={`border-gray-800 bg-gray-950/50 backdrop-blur relative hover:bg-gray-900/50 transition-colors ${plan.popular ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    {t('guest.plans.popular') || 'Populaire'}
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-lg sm:text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-2xl sm:text-3xl font-bold ${plan.color}`}>{plan.price}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded bg-gray-800/50">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-green-400" />
                    <p className="text-white font-medium">{plan.duration}</p>
                    <p className="text-xs text-gray-400">Temps</p>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50">
                    <Database className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                    <p className="text-white font-medium">{plan.data}</p>
                    <p className="text-xs text-gray-400">Données</p>
                  </div>
                  <div className="p-2 rounded bg-gray-800/50">
                    <Wifi className="h-4 w-4 mx-auto mb-1 text-purple-400" />
                    <p className="text-white font-medium">{plan.devices}</p>
                    <p className="text-xs text-gray-400">Appareil</p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full focus:ring-2 focus:ring-blue-500 ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  onClick={handleGetStarted}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {t('guest.plans.select') || 'Choisir cette Offre'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                {t('guest.cta.title') || 'Prêt à vous connecter ?'}
              </h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                {t('guest.cta.description') || 'Utilisez votre code d\'accès de 8 caractères pour commencer votre session Internet immédiatement.'}
              </p>
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                onClick={handleGetStarted}
              >
                {t('guest.cta.button') || 'Saisir mon Code d\'Accès'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
              <span className="text-white font-semibold">CaptiveNet Guest</span>
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-400 justify-center">
              <button 
                onClick={() => toast.success(t('guest.footer.terms') || 'CGU en cours de développement')}
                className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('guest.footer.termsLink') || 'Conditions d\'utilisation'}
              </button>
              <button 
                onClick={() => toast.success(t('guest.footer.privacy') || 'Politique de confidentialité en cours de développement')}
                className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('guest.footer.privacyLink') || 'Politique de confidentialité'}
              </button>
              <button 
                onClick={() => toast.success(t('guest.footer.support') || 'Support: support@captivenet.com')}
                className="hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {t('guest.footer.supportLink') || 'Support'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}