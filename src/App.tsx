import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { NotificationsProvider } from '@/hooks/useNotifications'
import { ThemeProvider } from '@/hooks/useTheme'

// Import components
import MainLayout from '@/components/layouts/MainLayout'
import WelcomePage from '@/components/WelcomePage'
import LoginForm from '@/components/forms/LoginForm'
import RegisterForm from '@/components/forms/RegisterForm'
import Dashboard from '@/components/Dashboard'
import AdminPanel from '@/components/AdminPanel'
import ProfileSettings from '@/components/profile/ProfileSettings'

// Import guest components
import GuestWelcome from '@/components/guest/GuestWelcome'
import GuestLogin from '@/components/guest/GuestLogin'
import GuestDashboard from '@/components/guest/GuestDashboard'
import GuestProfile from '@/components/guest/GuestProfile'
import GuestLayout from '@/components/guest/GuestLayout'

// Import i18n
import '@/lib/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'SUPERADMIN') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// Guest Route Component
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  
  if (isAuthenticated && user?.role !== 'GUEST') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

// App Content Component
const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      
      {/* Guest Routes */}
      <Route path="/guest" element={<GuestRoute><GuestWelcome /></GuestRoute>} />
      <Route path="/guest/login" element={<GuestRoute><GuestLogin /></GuestRoute>} />
      <Route 
        path="/guest/dashboard" 
        element={
          <GuestRoute>
            <GuestLayout>
              <GuestDashboard />
            </GuestLayout>
          </GuestRoute>
        } 
      />
      <Route 
        path="/guest/profile" 
        element={
          <GuestRoute>
            <GuestLayout>
              <GuestProfile />
            </GuestLayout>
          </GuestRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfileSettings />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <MainLayout>
              <AdminPanel />
            </MainLayout>
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all route */}
      <Route 
        path="*" 
        element={
          isAuthenticated ? (
            user?.role === 'GUEST' ? (
              <Navigate to="/guest/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
    </Routes>
  )
}

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <NotificationsProvider>
              <AppContent />
              <Toaster />
            </NotificationsProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App