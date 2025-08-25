import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: 'SUPERADMIN' | 'ADMIN' | 'SUBSCRIBER' | 'GUEST'
  status: string
  phone?: string
  email_verified: boolean
  mfa_enabled: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  voucherLogin: (code: string) => Promise<void>
  register: (userData: {
    email: string
    username: string
    first_name: string
    last_name: string
    phone?: string
    password: string
    password_confirm: string
  }) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await api.getProfile()
      setUser(response.user || response)
    } catch (error) {
      // Not authenticated
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.login(email, password)
      setUser(response.user)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const voucherLogin = async (code: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock implementation - in production this would use the captive portal API
      // For demo purposes, we'll simulate a guest user
      const mockGuestUser: User = {
        id: 999,
        email: `guest-${code.toLowerCase()}@temp.local`,
        username: `guest_${code.toLowerCase()}`,
        first_name: 'Invité',
        last_name: `#${code}`,
        role: 'GUEST',
        status: 'ACTIVE',
        email_verified: true,
        mfa_enabled: false,
        created_at: new Date().toISOString()
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (code.length !== 8) {
        throw new Error('Le code doit contenir exactement 8 caractères')
      }
      
      // Mock validation - in production this would validate against the voucher API
      setUser(mockGuestUser)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid voucher code')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: {
    email: string
    username: string
    first_name: string
    last_name: string
    phone?: string
    password: string
    password_confirm: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      await api.register(userData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null)
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    voucherLogin,
    register,
    logout,
    clearError
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}