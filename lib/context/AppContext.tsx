'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { Toast } from '@/lib/types/ui'

interface AppState {
  commandPaletteOpen: boolean
  credits: number
  isAdmin: boolean
  toasts: Toast[]
  openCommandPalette: () => void
  closeCommandPalette: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  addCredits: (amount: number) => void
  useCredit: () => boolean
}

const AppContext = createContext<AppState | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [credits, setCredits] = useState(3)
  const [isAdmin] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), [])
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev.slice(-2), { ...toast, id }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addCredits = useCallback((amount: number) => {
    setCredits(prev => prev + amount)
  }, [])

  const useCredit = useCallback(() => {
    if (credits > 0) {
      setCredits(prev => prev - 1)
      return true
    }
    return false
  }, [credits])

  // Cmd+K global handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AppContext.Provider value={{
      commandPaletteOpen, credits, isAdmin, toasts,
      openCommandPalette, closeCommandPalette,
      addToast, removeToast, addCredits, useCredit,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
