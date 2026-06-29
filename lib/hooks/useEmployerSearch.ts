'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export interface EmployerSearchState {
  isSearching: boolean
  error: string | null
}

export function useEmployerSearch() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string): Promise<boolean> => {
    const slug = slugify(query)
    setIsSearching(true)
    setError(null)
    console.log('[employer-search] query:', query, 'slug:', slug)

    try {
      const res = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entitySlug: slug, entityName: query.trim(), entityType: 'employer' }),
      })

      console.log('[employer-search] pipeline status:', res.status)

      if (res.status === 401) {
        const returnTo = encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')
        router.push(`/login?next=${returnTo}`)
        setIsSearching(false)
        return false
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('[employer-search] pipeline error:', errData)
        setError('Could not start research. Please try again.')
        setIsSearching(false)
        return false
      }

      const data = await res.json()
      console.log('[employer-search] pipeline response:', data)

      if (data.briefReady) {
        router.push(`/brief/${data.entitySlug ?? slug}`)
      } else if (data.runId) {
        router.push(`/building/${slug}?runId=${data.runId}`)
      } else {
        console.error('[employer-search] no runId and no briefReady:', data)
        setError('Could not start research. Please try again.')
        setIsSearching(false)
        return false
      }
      return true
    } catch (err) {
      console.error('[employer-search] unexpected error:', err)
      setError('Could not start research. Please try again.')
      setIsSearching(false)
      return false
    }
  }, [router])

  const clearError = useCallback(() => setError(null), [])

  return { search, isSearching, error, clearError }
}
