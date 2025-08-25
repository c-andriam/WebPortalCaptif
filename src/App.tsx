import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { NotificationsProvider } from './hooks/useNotifications'
import { LoginForm } from './components/forms/LoginForm'
import { RegisterForm } from './components/forms/RegisterForm'
import { MainLayout } from './components/layouts/MainLayout'
import { WelcomePage } from './components/WelcomePage'
import { Dashboard } from './components/Dashboard'
import { DashboardStats } from './components/dashboard/DashboardStats'
import { Calendar } from './components/calendar/Calendar'
import { TaskBoard } from './components/tasks/TaskBoard'
import { FileManager } from './components/files/FileManager'
import { NotesManager } from './components/notes/NotesManager'
import { ContactsManager } from './components/contacts/ContactsManager'
import { Timeline } from './components/timeline/Timeline'
import { ProfileSettings } from './components/profile/ProfileSettings'
import { AdminPanel } from './components/AdminPanel'

function AppContent() {
  const { user, loading, error, login, voucherLogin, register, logout, clearError } = useAuth()
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register' | 'dashboard'>('welcome')

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      setCurrentView('dashboard')
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleVoucherLogin = async (code: string) => {
    try {
      await voucherLogin(code)
      setCurrentView('dashboard')
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleRegister = async (userData: {
    email: string
    username: string
    first_name: string
    last_name: string
    phone?: string
    password: string
    password_confirm: string
  }) => {
    try {
      await register(userData)
      setCurrentView('login')
      // Show success message here in production
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleLogout = async () => {
    await logout()
    setCurrentView('login')
  }

  // Show loading state
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated
  if (user && currentView === 'dashboard') {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <div className="p-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Tableau de Bord {user.role === 'SUPERADMIN' ? 'Super Administrateur' : user.role === 'ADMIN' ? 'Administrateur' : user.role === 'SUBSCRIBER' ? 'Abonné' : 'Invité'}
                  </h1>
                  <p className="text-gray-400">
                    {user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'Gérez les accès et surveillez l\'activité réseau' : user.role === 'SUBSCRIBER' ? 'Gérez vos appareils et consultez votre usage' : 'Votre session internet est maintenant active'}
                  </p>
                </div>
                <DashboardStats userRole={user.role} />
              </div>
            } />
            <Route path="profile" element={<div className="p-6"><ProfileSettings /></div>} />
            <Route path="timeline" element={<div className="p-6"><Timeline /></div>} />
            <Route path="calendar" element={<div className="p-6"><Calendar /></div>} />
            <Route path="tasks" element={<div className="p-6"><TaskBoard /></div>} />
            <Route path="files" element={<div className="p-6"><FileManager /></div>} />
            <Route path="notes" element={<div className="p-6"><NotesManager /></div>} />
            <Route path="contacts" element={<div className="p-6"><ContactsManager /></div>} />
            <Route path="users" element={<div className="p-6"><AdminPanel user={user} /></div>} />
            <Route path="vouchers" element={<div className="p-6"><AdminPanel user={user} /></div>} />
            <Route path="sessions" element={<div className="p-6"><AdminPanel user={user} /></div>} />
            <Route path="config" element={<div className="p-6"><AdminPanel user={user} /></div>} />
            <Route path="audit" element={<div className="p-6"><AdminPanel user={user} /></div>} />
          </Route>
        </Routes>
      </Router>
    )
  }

  // Show welcome page
  if (currentView === 'welcome') {
    return <WelcomePage onGetStarted={() => setCurrentView('login')} />
  }

  // Show authentication forms
  if (currentView === 'register') {
    return (
      <RegisterForm
        onRegister={handleRegister}
        onBack={() => {
          setCurrentView('login')
          clearError()
        }}
        loading={loading}
        error={error}
      />
    )
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      onVoucherLogin={handleVoucherLogin}
      onRegister={() => {
        setCurrentView('register')
        clearError()
      }}
      onForgotPassword={() => {
        // TODO: Implement forgot password flow
        console.log('Forgot password clicked')
      }}
      onBack={() => setCurrentView('welcome')}
      loading={loading}
      error={error}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </AuthProvider>
  )
}

export default App