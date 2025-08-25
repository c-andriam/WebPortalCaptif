import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { NotificationsProvider } from './hooks/useNotifications'
import { PortalLogin } from './components/portal/PortalLogin'
import { SessionStatus } from './components/portal/SessionStatus'
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
import { UserValidation } from './components/admin/UserValidation'
import { VoucherGenerator } from './components/admin/VoucherGenerator'
import { SessionMonitor } from './components/admin/SessionMonitor'
import { QuotaManager } from './components/admin/QuotaManager'
import { DeviceManager } from './components/subscriber/DeviceManager'
import { UsageStats } from './components/subscriber/UsageStats'
import { SystemMetrics } from './components/monitoring/SystemMetrics'
import { 
  mockPlans, 
  mockDevices, 
  mockActiveSessions, 
  mockUserQuotas, 
  mockSystemMetrics,
  mockUsageData,
  mockSessionData
} from './lib/mockData'

function AppContent() {
  const [searchParams] = useSearchParams()
  const { user, loading, error, login, voucherLogin, register, logout, clearError } = useAuth()
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register' | 'dashboard' | 'portal' | 'session'>(() => {
    // Check if this is a captive portal redirect
    const mac = searchParams.get('mac')
    const ip = searchParams.get('ip')
    if (mac && ip) {
      return 'portal'
    }
    return 'welcome'
  })
  const [sessionData, setSessionData] = useState(mockSessionData)

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
      // For guest users, show session status instead of dashboard
      setCurrentView('session')
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
    setCurrentView('welcome')
  }

  const handlePortalLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      setCurrentView('session')
    } catch (error) {
      // Error handled by auth context
    }
  }

  const handlePortalVoucherLogin = async (code: string) => {
    try {
      await voucherLogin(code)
      setCurrentView('session')
    } catch (error) {
      // Error handled by auth context
    }
  }

  const handleSessionLogout = () => {
    logout()
    setCurrentView('welcome')
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

  // Show session status for guest users or portal access
  if ((user && user.role === 'GUEST') || currentView === 'session') {
    return (
      <SessionStatus 
        sessionData={sessionData}
        onLogout={handleSessionLogout}
        onExtendSession={() => {
          // Mock extend session
          console.log('Extending session...')
        }}
      />
    )
  }

  // Show portal login for captive portal access
  if (currentView === 'portal') {
    return (
      <PortalLogin
        onVoucherLogin={handlePortalVoucherLogin}
        onCredentialsLogin={handlePortalLogin}
        onRegister={() => setCurrentView('register')}
        loading={loading}
        error={error}
      />
    )
  }

  // Show dashboard if user is authenticated
  if (user && currentView === 'dashboard') {
    return (
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
          <Route path="devices" element={
            <div className="p-6">
              <DeviceManager 
                devices={mockDevices}
                maxDevices={5}
                onAddDevice={async (device) => console.log('Add device:', device)}
                onUpdateDevice={async (id, data) => console.log('Update device:', id, data)}
                onRemoveDevice={async (id) => console.log('Remove device:', id)}
              />
            </div>
          } />
          <Route path="usage" element={
            <div className="p-6">
              <UsageStats 
                usage={mockUsageData}
                onRenewSubscription={() => console.log('Renew subscription')}
                onUpgradePlan={() => console.log('Upgrade plan')}
              />
            </div>
          } />
          <Route path="timeline" element={<div className="p-6"><Timeline /></div>} />
          <Route path="calendar" element={<div className="p-6"><Calendar /></div>} />
          <Route path="tasks" element={<div className="p-6"><TaskBoard /></div>} />
          <Route path="files" element={<div className="p-6"><FileManager /></div>} />
          <Route path="notes" element={<div className="p-6"><NotesManager /></div>} />
          <Route path="contacts" element={<div className="p-6"><ContactsManager /></div>} />
          <Route path="users" element={<div className="p-6"><AdminPanel user={user} /></div>} />
          <Route path="validation" element={
            <div className="p-6">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">Validation des Comptes</h1>
                {/* Mock pending user for demo */}
                <UserValidation
                  user={{
                    id: 999,
                    email: 'nouveau@example.com',
                    username: 'nouveau_user',
                    first_name: 'Nouveau',
                    last_name: 'Utilisateur',
                    phone: '+33123456789',
                    requested_plan: mockPlans[2],
                    created_at: '2024-01-15T10:00:00Z',
                    email_verified: true,
                    registration_ip: '192.168.1.100',
                    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                  }}
                  onValidate={async (id, notes) => console.log('Validate user:', id, notes)}
                  onReject={async (id, reason) => console.log('Reject user:', id, reason)}
                />
              </div>
            </div>
          } />
          <Route path="voucher-generator" element={
            <div className="p-6">
              <VoucherGenerator
                plans={mockPlans}
                onGenerate={async (data) => {
                  console.log('Generate vouchers:', data)
                  // Mock generated vouchers
                  return Array.from({ length: data.quantity }, (_, i) => ({
                    code: `TEST${String(i + 1).padStart(4, '0')}`,
                    id: i + 1,
                    plan: mockPlans.find(p => p.id === data.plan_id)!,
                    valid_from: data.valid_from,
                    valid_until: data.valid_until,
                    status: 'ACTIVE'
                  }))
                }}
              />
            </div>
          } />
          <Route path="session-monitor" element={
            <div className="p-6">
              <SessionMonitor
                sessions={mockActiveSessions}
                onTerminateSession={async (id) => console.log('Terminate session:', id)}
                onRefresh={() => console.log('Refresh sessions')}
              />
            </div>
          } />
          <Route path="quota-manager" element={
            <div className="p-6">
              <QuotaManager
                userQuotas={mockUserQuotas}
                onExtendQuota={async (userId, type, amount) => console.log('Extend quota:', userId, type, amount)}
                onSuspendUser={async (userId, reason) => console.log('Suspend user:', userId, reason)}
              />
            </div>
          } />
          <Route path="system-metrics" element={
            <div className="p-6">
              <SystemMetrics
                metrics={mockSystemMetrics}
                onRefresh={() => console.log('Refresh metrics')}
                onExportMetrics={() => console.log('Export metrics')}
              />
            </div>
          } />
          <Route path="vouchers" element={<div className="p-6"><AdminPanel user={user} /></div>} />
          <Route path="sessions" element={<div className="p-6"><AdminPanel user={user} /></div>} />
          <Route path="config" element={<div className="p-6"><AdminPanel user={user} /></div>} />
          <Route path="audit" element={<div className="p-6"><AdminPanel user={user} /></div>} />
        </Route>
      </Routes>
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
    <Router>
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App