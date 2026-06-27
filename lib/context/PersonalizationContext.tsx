'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface PersonalizationProfile {
  role: string
  priorities: string[]
  hasCompletedOnboarding: boolean
}

interface PersonalizationState {
  profile: PersonalizationProfile
  setRole: (role: string) => void
  togglePriority: (priority: string) => void
  completeOnboarding: () => void
  getWeightedScore: (scores: Record<string, number>) => number
}

const DEFAULT_PROFILE: PersonalizationProfile = {
  role: '',
  priorities: [],
  hasCompletedOnboarding: false,
}

const PersonalizationContext = createContext<PersonalizationState | undefined>(undefined)

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<PersonalizationProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scarsian_profile')
      if (stored) setProfile(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const save = (p: PersonalizationProfile) => {
    setProfile(p)
    try { localStorage.setItem('scarsian_profile', JSON.stringify(p)) } catch { /* ignore */ }
  }

  const setRole = (role: string) => save({ ...profile, role })

  const togglePriority = (priority: string) => {
    const priorities = profile.priorities.includes(priority)
      ? profile.priorities.filter(p => p !== priority)
      : [...profile.priorities, priority]
    save({ ...profile, priorities })
  }

  const completeOnboarding = () => save({ ...profile, hasCompletedOnboarding: true })

  const getWeightedScore = (scores: Record<string, number>): number => {
    if (profile.priorities.length === 0) return Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    let total = 0
    let weight = 0
    profile.priorities.forEach((p, i) => {
      const w = profile.priorities.length - i
      const score = scores[p] ?? 50
      total += score * w
      weight += w
    })
    return Math.round(weight > 0 ? total / weight : 50)
  }

  return (
    <PersonalizationContext.Provider value={{ profile, setRole, togglePriority, completeOnboarding, getWeightedScore }}>
      {children}
    </PersonalizationContext.Provider>
  )
}

export function usePersonalization() {
  const ctx = useContext(PersonalizationContext)
  if (!ctx) throw new Error('usePersonalization must be used within PersonalizationProvider')
  return ctx
}
