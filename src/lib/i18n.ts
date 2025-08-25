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