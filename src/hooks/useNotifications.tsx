import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  timestamp: string
  actionUrl?: string
}

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
  removeNotification: (id: number) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Mock notifications based on user role
  useEffect(() => {
    if (user) {
      const mockNotifications: Notification[] = [
        {
          id: 1,
          title: 'Quota Alert',
          message: 'Your data usage is at 80%',
          type: 'warning',
          isRead: false,
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'New User Registration',
          message: 'A new user has registered and needs validation',
          type: 'info',
          isRead: false,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          title: 'System Maintenance',
          message: 'Scheduled maintenance tonight at 2 AM',
          type: 'info',
          isRead: true,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ]

      // Filter notifications based on user role
      const filteredNotifications = mockNotifications.filter(notification => {
        if (user.role === 'GUEST') {
          return notification.type === 'warning' && notification.title.includes('Quota')
        }
        if (user.role === 'SUBSCRIBER') {
          return notification.type === 'warning' || notification.title.includes('System')
        }
        return true // Admin and SuperAdmin see all notifications
      })

      setNotifications(filteredNotifications)
    }
  }, [user])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      isRead: false,
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification,
      removeNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}