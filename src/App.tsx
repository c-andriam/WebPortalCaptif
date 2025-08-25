import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import { Toaster } from 'react-hot-toast'
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
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading, error, login, voucherLogin, register, logout, clearError } = useAuth()
  
  // Check if this is a captive portal redirect
  const isPortalAccess = location.search.includes('mac=') && location.search.includes('ip=')

  useEffect(() => {
    // Handle portal redirects
    if (isPortalAccess && !user) {
      navigate('/portal', { replace: true })
    }
  }, [isPortalAccess, user, navigate])

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleVoucherLogin = async (code: string) => {
    try {
      await voucherLogin(code)
      navigate('/session', { replace: true })
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
      navigate('/login?registered=true', { replace: true })
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
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

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<WelcomePage onGetStarted={() => navigate('/login')} />} />
      <Route path="/portal" element={
        <PortalLogin
          onVoucherLogin={handleVoucherLogin}
          onCredentialsLogin={handleLogin}
          onRegister={() => navigate('/register')}
          loading={loading}
          error={error}
        />
      } />
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : (
          <LoginForm
            onLogin={handleLogin}
            onVoucherLogin={handleVoucherLogin}
            onRegister={() => navigate('/register')}
            onForgotPassword={() => navigate('/forgot-password')}
            onBack={() => navigate('/')}
            loading={loading}
            error={error}
          />
        )
      } />
      <Route path="/register" element={
        user ? <Navigate to="/dashboard" replace /> : (
          <RegisterForm
            onRegister={handleRegister}
            onBack={() => navigate('/login')}
            loading={loading}
            error={error}
          />
        )
      } />

      {/* Session status for guests */}
      <Route path="/session" element={
        <SessionStatus 
          sessionData={mockSessionData}
          onLogout={handleLogout}
          onExtendSession={() => {
            console.log('Extending session...')
          }}
        />
      } />

      {/* Protected routes */}
      <Route path="/*" element={
        user ? <MainLayout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard user={user!} />} />
        <Route path="profile" element={<ProfileSettings />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="files" element={<FileManager />} />
        <Route path="notes" element={<NotesManager />} />
        <Route path="contacts" element={<ContactsManager />} />
        
        {/* Subscriber routes */}
        <Route path="devices" element={
          user?.role === 'SUBSCRIBER' ? (
            <DeviceManager 
              devices={mockDevices}
              maxDevices={5}
              onAddDevice={async (device) => console.log('Add device:', device)}
              onUpdateDevice={async (id, data) => console.log('Update device:', id, data)}
              onRemoveDevice={async (id) => console.log('Remove device:', id)}
            />
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="usage" element={
          user?.role === 'SUBSCRIBER' ? (
            <UsageStats 
              usage={mockUsageData}
              onRenewSubscription={() => console.log('Renew subscription')}
              onUpgradePlan={() => console.log('Upgrade plan')}
            />
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="sessions" element={
          user?.role === 'SUBSCRIBER' ? (
            <div className="p-6">
              <h1 className="text-3xl font-bold text-white mb-6">Mes Sessions</h1>
              <p className="text-gray-400">Historique de vos connexions</p>
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />

        {/* Admin routes */}
        <Route path="users" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <AdminPanel user={user} />
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="validation" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <div className="p-6">
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">Validation des Comptes</h1>
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
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="voucher-generator" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <div className="p-6">
              <VoucherGenerator
                plans={mockPlans}
                onGenerate={async (data) => {
                  console.log('Generate vouchers:', data)
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
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="session-monitor" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <div className="p-6">
              <SessionMonitor
                sessions={mockActiveSessions}
                onTerminateSession={async (id) => console.log('Terminate session:', id)}
                onRefresh={() => console.log('Refresh sessions')}
              />
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="quota-manager" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <div className="p-6">
              <QuotaManager
                userQuotas={mockUserQuotas}
                onExtendQuota={async (userId, type, amount) => console.log('Extend quota:', userId, type, amount)}
                onSuspendUser={async (userId, reason) => console.log('Suspend user:', userId, reason)}
              />
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="vouchers" element={
          (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') ? (
            <AdminPanel user={user} />
          ) : <Navigate to="/dashboard" replace />
        } />

        {/* SuperAdmin only routes */}
        <Route path="system-metrics" element={
          user?.role === 'SUPERADMIN' ? (
            <div className="p-6">
              <SystemMetrics
                metrics={mockSystemMetrics}
                onRefresh={() => console.log('Refresh metrics')}
                onExportMetrics={() => console.log('Export metrics')}
              />
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="config" element={
          user?.role === 'SUPERADMIN' ? (
            <div className="p-6">
              <h1 className="text-3xl font-bold text-white mb-6">Configuration Système</h1>
              <p className="text-gray-400">Paramètres système (SuperAdmin uniquement)</p>
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />
        <Route path="audit" element={
          user?.role === 'SUPERADMIN' ? (
            <div className="p-6">
              <h1 className="text-3xl font-bold text-white mb-6">Logs d'Audit</h1>
              <p className="text-gray-400">Historique immuable des actions (SuperAdmin uniquement)</p>
            </div>
          ) : <Navigate to="/dashboard" replace />
        } />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationsProvider>
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f9fafb',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f9fafb',
                },
              },
            }}
          />
        </NotificationsProvider>
      </AuthProvider>
    </Router>
  )
}

export default App