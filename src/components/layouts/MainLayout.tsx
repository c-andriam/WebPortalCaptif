import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useAuth } from '@/hooks/useAuth'

export function MainLayout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <TopBar user={user} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}