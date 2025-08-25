import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const resources = {
  fr: {
    translation: {
      // Navigation
      'nav.dashboard': 'Tableau de Bord',
      'nav.profile': 'Mon Profil',
      'nav.timeline': 'Timeline',
      'nav.calendar': 'Calendrier',
      'nav.tasks': 'Tâches',
      'nav.files': 'Fichiers',
      'nav.notes': 'Notes',
      'nav.contacts': 'Contacts',
      'nav.users': 'Utilisateurs',
      'nav.vouchers': 'Codes Invités',
      'nav.sessions': 'Sessions',
      'nav.config': 'Configuration',
      'nav.audit': 'Audit',
      
      // Guest Navigation
      'guest.welcome.title': 'Accès Internet Wi-Fi',
      'guest.welcome.subtitle': 'Connectez-vous rapidement avec votre code d\'accès invité pour profiter d\'Internet en toute sécurité.',
      'guest.welcome.getStarted': 'Commencer',
      'guest.welcome.viewPlans': 'Voir les Offres',
      'guest.welcome.redirecting': 'Redirection vers la connexion invité',
      'guest.welcome.viewingPlans': 'Consultation des plans disponibles',
      
      // Guest Benefits
      'guest.benefits.title': 'Pourquoi Choisir Notre Service',
      'guest.benefits.subtitle': 'Une expérience Internet optimale avec sécurité et simplicité',
      'guest.benefits.security.title': 'Connexion Sécurisée',
      'guest.benefits.security.desc': 'Chiffrement WPA3 et protection des données personnelles',
      'guest.benefits.instant.title': 'Accès Instantané',
      'guest.benefits.instant.desc': 'Connexion immédiate avec votre code d\'accès',
      'guest.benefits.quotas.title': 'Quotas Transparents',
      'guest.benefits.quotas.desc': 'Suivi en temps réel de votre consommation',
      'guest.benefits.support.title': 'Support Disponible',
      'guest.benefits.support.desc': 'Assistance technique en cas de problème',
      
      // Guest Plans
      'guest.plans.title': 'Offres d\'Accès Invité',
      'guest.plans.subtitle': 'Choisissez la durée d\'accès qui vous convient',
      'guest.plans.popular': 'Populaire',
      'guest.plans.select': 'Choisir cette Offre',
      'guest.plans.hourly.name': 'Accès 1 Heure',
      'guest.plans.hourly.price': 'Gratuit',
      'guest.plans.daily.name': 'Accès 24 Heures',
      'guest.plans.weekly.name': 'Accès 7 Jours',
      
      // Guest Login
      'guest.login.title': 'Code d\'Accès Invité',
      'guest.login.subtitle': 'Saisissez votre code de 8 caractères pour accéder à Internet',
      'guest.login.back': 'Retour à l\'accueil',
      'guest.login.cardTitle': 'Connexion Sécurisée',
      'guest.login.codeLabel': 'Code d\'Accès (8 caractères)',
      'guest.login.codeFormat': 'Format: 8 caractères alphanumériques',
      'guest.login.connect': 'Se Connecter',
      'guest.login.connecting': 'Connexion...',
      'guest.login.success': 'Connexion réussie ! Redirection...',
      'guest.login.invalidCode': 'Code invalide, expiré ou déjà utilisé',
      'guest.login.blocked': 'Trop de tentatives échouées. Veuillez patienter 5 minutes.',
      'guest.login.unblocked': 'Vous pouvez maintenant réessayer',
      'guest.login.autoSubmit': 'Connexion automatique...',
      'guest.login.demoCodes': 'Codes de Démonstration',
      'guest.login.demoHelp': 'Cliquez sur un code pour le tester',
      'guest.login.help.title': 'Besoin d\'Aide ?',
      'guest.login.help.step1': 'Votre code se trouve sur votre ticket d\'accès',
      'guest.login.help.step2': 'Saisissez les 8 caractères sans espaces',
      'guest.login.help.step3': 'La connexion se fait automatiquement',
      'guest.login.help.step4': 'Chaque code n\'est utilisable qu\'une seule fois',
      'guest.login.help.contactLink': 'Contacter le Support',
      
      // Guest Dashboard
      'guest.dashboard.title': 'Session Invité Active',
      'guest.dashboard.loading': 'Chargement de votre session...',
      'guest.dashboard.noSession': 'Session Introuvable',
      'guest.dashboard.sessionExpired': 'Votre session a expiré ou est invalide',
      'guest.dashboard.reconnect': 'Se Reconnecter',
      'guest.dashboard.status': 'Statut',
      'guest.dashboard.connected': 'Connecté',
      'guest.dashboard.since': 'Depuis',
      'guest.dashboard.timeRemaining': 'Temps Restant',
      'guest.dashboard.expires': 'Expire à',
      'guest.dashboard.dataRemaining': 'Données Restantes',
      'guest.dashboard.of': 'sur',
      'guest.dashboard.connection': 'Connexion',
      'guest.dashboard.dataUsage': 'Consommation Données',
      'guest.dashboard.timeUsage': 'Temps de Connexion',
      'guest.dashboard.usedOf': 'utilisé sur',
      'guest.dashboard.normal': 'Normal',
      'guest.dashboard.warning': 'Attention',
      'guest.dashboard.critical': 'Critique',
      'guest.dashboard.dataWarning': 'Attention : quota données bientôt atteint. Connexion automatiquement coupée à 100%.',
      'guest.dashboard.timeWarning': 'Attention : quota temps bientôt atteint. Connexion automatiquement coupée à 100%.',
      'guest.dashboard.networkInfo': 'Informations Réseau',
      'guest.dashboard.ipAddress': 'Adresse IP',
      'guest.dashboard.macAddress': 'MAC Address',
      'guest.dashboard.speed': 'Vitesse',
      'guest.dashboard.device': 'Appareil',
      'guest.dashboard.sessionTimeline': 'Chronologie de Session',
      'guest.dashboard.sessionStart': 'Début de Session',
      'guest.dashboard.lastActivity': 'Dernière Activité',
      'guest.dashboard.sessionExpires': 'Expiration',
      'guest.dashboard.voucherDetails': 'Détails du Code d\'Accès',
      'guest.dashboard.voucherCode': 'Code',
      'guest.dashboard.plan': 'Plan',
      'guest.dashboard.usage': 'Utilisation',
      'guest.dashboard.codeStatus': 'Statut Code',
      'guest.dashboard.expired': 'Expiré',
      'guest.dashboard.active': 'Actif',
      'guest.dashboard.voucherUsed': 'Code d\'Accès Utilisé',
      'guest.dashboard.voucherInfo': 'Votre code',
      'guest.dashboard.voucherExpired': 'a été utilisé et est maintenant expiré. Votre session reste active jusqu\'à épuisement des quotas.',
      'guest.dashboard.codeExpired': 'Code Expiré',
      'guest.dashboard.cannotExtend': 'Impossible d\'étendre une session invité. Le code est à usage unique.',
      'guest.dashboard.profile': 'Profil',
      'guest.dashboard.refresh': 'Actualiser',
      'guest.dashboard.refreshing': 'Actualisation...',
      'guest.dashboard.refreshed': 'Session actualisée',
      'guest.dashboard.logout': 'Déconnexion',
      'guest.dashboard.confirmLogout': 'Êtes-vous sûr de vouloir vous déconnecter ?',
      'guest.dashboard.loggedOut': 'Déconnexion réussie',
      'guest.dashboard.viewingProfile': 'Affichage du profil',
      'guest.dashboard.terms.title': 'Conditions d\'Utilisation',
      'guest.dashboard.terms.rule1': 'Usage personnel et conforme à la législation',
      'guest.dashboard.terms.rule2': 'Interdiction de contenus illégaux',
      'guest.dashboard.terms.rule3': 'Respect des quotas alloués',
      'guest.dashboard.terms.rule4': 'Déconnexion automatique à épuisement des quotas',
      'guest.dashboard.terms.rule5': 'Code d\'accès à usage unique - impossible de se reconnecter',
      
      // Auth
      'auth.login': 'Se connecter',
      'auth.logout': 'Déconnexion',
      'auth.register': 'S\'inscrire',
      'auth.email': 'Adresse e-mail',
      'auth.password': 'Mot de passe',
      'auth.confirmPassword': 'Confirmer le mot de passe',
      'auth.forgotPassword': 'Mot de passe oublié ?',
      'auth.voucherCode': 'Code d\'accès invité',
      'auth.loginSuccess': 'Connexion réussie',
      'auth.loginError': 'Erreur de connexion',
      'auth.invalidCredentials': 'Identifiants invalides',
      
      // Dashboard
      'dashboard.title': 'Tableau de Bord',
      'dashboard.stats.totalUsers': 'Utilisateurs Totaux',
      'dashboard.stats.activeConnections': 'Connexions Actives',
      'dashboard.stats.dataTransferred': 'Données Transférées',
      'dashboard.stats.uptime': 'Disponibilité',
      
      // Common
      'common.save': 'Sauvegarder',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.add': 'Ajouter',
      'common.search': 'Rechercher',
      'common.filter': 'Filtrer',
      'common.loading': 'Chargement...',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'common.confirm': 'Confirmer',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markAsRead': 'Marquer comme lu',
      'notifications.noNotifications': 'Aucune notification',
      
      // Errors
      'error.required': 'Ce champ est requis',
      'error.invalidEmail': 'Adresse e-mail invalide',
      'error.passwordTooShort': 'Le mot de passe doit contenir au moins 12 caractères',
      'error.passwordMismatch': 'Les mots de passe ne correspondent pas',
      'error.networkError': 'Erreur de connexion réseau',
      'error.serverError': 'Erreur serveur',
      'error.unauthorized': 'Non autorisé',
      'error.forbidden': 'Accès interdit',
    }
  },
  en: {
    translation: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.profile': 'My Profile',
      'nav.timeline': 'Timeline',
      'nav.calendar': 'Calendar',
      'nav.tasks': 'Tasks',
      'nav.files': 'Files',
      'nav.notes': 'Notes',
      'nav.contacts': 'Contacts',
      'nav.users': 'Users',
      'nav.vouchers': 'Guest Codes',
      'nav.sessions': 'Sessions',
      'nav.config': 'Configuration',
      'nav.audit': 'Audit',
      
      // Auth
      'auth.login': 'Login',
      'auth.logout': 'Logout',
      'auth.register': 'Register',
      'auth.email': 'Email address',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm password',
      'auth.forgotPassword': 'Forgot password?',
      'auth.voucherCode': 'Guest access code',
      'auth.loginSuccess': 'Login successful',
      'auth.loginError': 'Login error',
      'auth.invalidCredentials': 'Invalid credentials',
      
      // Dashboard
      'dashboard.title': 'Dashboard',
      'dashboard.stats.totalUsers': 'Total Users',
      'dashboard.stats.activeConnections': 'Active Connections',
      'dashboard.stats.dataTransferred': 'Data Transferred',
      'dashboard.stats.uptime': 'Uptime',
      
      // Common
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.confirm': 'Confirm',
      
      // Notifications
      'notifications.title': 'Notifications',
      'notifications.markAsRead': 'Mark as read',
      'notifications.noNotifications': 'No notifications',
      
      // Errors
      'error.required': 'This field is required',
      'error.invalidEmail': 'Invalid email address',
      'error.passwordTooShort': 'Password must be at least 12 characters',
      'error.passwordMismatch': 'Passwords do not match',
      'error.networkError': 'Network connection error',
      'error.serverError': 'Server error',
      'error.unauthorized': 'Unauthorized',
      'error.forbidden': 'Access forbidden',
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  })

export default i18n