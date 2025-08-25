const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    // En mode développement, simuler les réponses API
    if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
      return this.mockRequest<T>(endpoint, options)
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session auth
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const method = options.method || 'GET'
    
    // Simuler les réponses selon l'endpoint
    if (endpoint === '/auth/login/' && method === 'POST') {
      const body = JSON.parse(options.body as string)
      if (body.email === 'admin@captivenet.com' && body.password === 'AdminPassword123!') {
        return {
          user: {
            id: 1,
            email: 'admin@captivenet.com',
            username: 'admin',
            first_name: 'Admin',
            last_name: 'Principal',
            role: 'ADMIN',
            status: 'ACTIVE',
            email_verified: true,
            mfa_enabled: false,
            created_at: new Date().toISOString()
          }
        } as T
      } else if (body.email === 'superadmin@captivenet.com' && body.password === 'SuperAdmin123!') {
        return {
          user: {
            id: 2,
            email: 'superadmin@captivenet.com',
            username: 'superadmin',
            first_name: 'Super',
            last_name: 'Administrateur',
            role: 'SUPERADMIN',
            status: 'ACTIVE',
            email_verified: true,
            mfa_enabled: true,
            created_at: new Date().toISOString()
          }
        } as T
      } else if (body.email === 'user@example.com' && body.password === 'UserPassword123!') {
        return {
          user: {
            id: 3,
            email: 'user@example.com',
            username: 'user_demo',
            first_name: 'Jean',
            last_name: 'Dupont',
            role: 'SUBSCRIBER',
            status: 'ACTIVE',
            email_verified: true,
            mfa_enabled: false,
            created_at: new Date().toISOString()
          }
        } as T
      } else {
        throw new Error('Identifiants invalides')
      }
    }
    
    if (endpoint === '/auth/register/' && method === 'POST') {
      return {
        message: 'Inscription réussie. Votre compte est en attente de validation par un administrateur.',
        user: {
          id: Date.now(),
          email: JSON.parse(options.body as string).email,
          status: 'PENDING_VALIDATION'
        }
      } as T
    }
    
    if (endpoint === '/auth/profile/') {
      // Retourner un utilisateur par défaut si pas de session
      return {
        id: 1,
        email: 'demo@captivenet.com',
        username: 'demo',
        first_name: 'Utilisateur',
        last_name: 'Démo',
        role: 'SUBSCRIBER',
        status: 'ACTIVE',
        email_verified: true,
        mfa_enabled: false,
        created_at: new Date().toISOString()
      } as T
    }
    
    if (endpoint === '/auth/logout/' && method === 'POST') {
      return { message: 'Déconnexion réussie' } as T
    }
    
    throw new Error(`Endpoint non implémenté: ${endpoint}`)
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: {
    email: string
    username: string
    first_name: string
    last_name: string
    phone?: string
    password: string
    password_confirm: string
  }) {
    return this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request('/auth/logout/', { method: 'POST' })
  }

  async getProfile() {
    return this.request('/auth/profile/')
  }

  // Portal endpoints
  async portalLogin(data: { mac: string; ip: string; code?: string; url?: string }) {
    return this.request('/portal/login/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)