import React from 'react'
import { Shield, Wifi, Users, Clock, Database, CheckCircle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DemoCredentials } from './DemoCredentials'

interface WelcomePageProps {
  onGetStarted: () => void
}

export function WelcomePage({ onGetStarted }: WelcomePageProps) {
  const features = [
    {
      icon: Shield,
      title: 'Sécurité Enterprise',
      description: 'Authentification multi-facteurs, audit complet, et contrôle d\'accès granulaire'
    },
    {
      icon: Users,
      title: 'Gestion Multi-Rôles',
      description: 'SuperAdmin, Admin, Abonnés et Invités avec permissions adaptées'
    },
    {
      icon: Wifi,
      title: 'Portail Captif',
      description: 'Intégration OpenNDS/CoovaChilli pour contrôle réseau automatique'
    },
    {
      icon: Database,
      title: 'Quotas Intelligents',
      description: 'Gestion temps, données et appareils avec alertes automatiques'
    },
    {
      icon: Clock,
      title: 'Sessions Temps Réel',
      description: 'Monitoring live des connexions et usage réseau'
    },
    {
      icon: CheckCircle,
      title: 'Validation Admin',
      description: 'Processus d\'approbation sécurisé pour nouveaux comptes'
    }
  ]

  const plans = [
    {
      name: 'Abonnement Mensuel',
      price: '29.99€',
      period: '/mois',
      features: ['5 appareils max', '100 GB/mois', 'Support prioritaire', 'Accès 24/7'],
      popular: true
    },
    {
      name: 'Abonnement Hebdomadaire',
      price: '9.99€',
      period: '/semaine',
      features: ['3 appareils max', '25 GB/semaine', 'Support standard', 'Accès 24/7'],
      popular: false
    },
    {
      name: 'Accès Temporaire',
      price: '2.99€',
      period: '/jour',
      features: ['1 appareil', '5 GB/jour', 'Support de base', '24h d\'accès'],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-2xl mb-8">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              CaptiveNet
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Plateforme de gestion d'accès Internet via portail captif pour entreprises.
              Contrôle granulaire, sécurité renforcée, et monitoring temps réel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                onClick={onGetStarted}
              >
                Commencer la Démo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Documentation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Fonctionnalités Avancées
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Une solution complète pour la gestion d'accès Internet en entreprise
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-800 bg-gray-950/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <feature.icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Plans d'Abonnement
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <Card key={index} className={`border-gray-800 bg-gray-950/50 backdrop-blur relative ${plan.popular ? 'border-blue-500' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Populaire</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full mt-6 ${plan.popular ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  onClick={onGetStarted}
                >
                  Choisir ce Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Credentials */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Testez la Plateforme
            </h2>
            <p className="text-gray-400">
              Utilisez ces comptes de démonstration pour explorer toutes les fonctionnalités
            </p>
          </div>
          <DemoCredentials />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-white font-semibold">CaptiveNet</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}