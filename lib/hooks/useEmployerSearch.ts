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
    const q = query.trim()
    if (!q) return false
    const slug = slugify(q)
    setIsSearching(true)
    setError(null)

    try {
      // Cache-first: check if company already exists before hitting the pipeline
      const searchRes = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (searchRes.ok) {
        const searchData = await searchRes.json() as { hit?: boolean; results?: Array<{ slug: string }> }
        if (searchData.hit && searchData.results?.[0]) {
          router.push(`/brief/${searchData.results[0].slug}`)
          setIsSearching(false)
          return true
        }
      }

      // Cache miss: start the research pipeline
      const res = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entitySlug: slug, entityName: q, entityType: 'employer' }),
      })

      // Middleware redirects unauthenticated /api/pipeline/* requests to /login via 307.
      // fetch() follows the redirect automatically, landing on the login page (200 HTML).
      // We detect this by checking res.redirected or a non-JSON content-type.
      const contentType = res.headers.get('content-type') ?? ''
      const isJson = contentType.includes('application/json')

      if (res.status === 401 || (res.redirected && !isJson)) {
        const returnTo = encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')
        router.push(`/login?next=${returnTo}`)
        setIsSearching(false)
        return false
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        const msg = (errData as { error?: string }).error ?? 'Could not start research. Please try again.'
        setError(msg)
        setIsSearching(false)
        return false
      }

      if (!isJson) {
        // Unexpected non-JSON success response — defensive
        setError('Unexpected server response. Please try again.')
        setIsSearching(false)
        return false
      }

      const data = await res.json() as {
        briefReady?: boolean
        entitySlug?: string
        runId?: string
        duplicate?: boolean
      }

      if (data.briefReady) {
        router.push(`/brief/${data.entitySlug ?? slug}`)
        return true
      }

      if (data.runId) {
        router.push(`/building/${slug}?runId=${data.runId}`)
        return true
      }

      setError('Could not start research. Please try again.')
      setIsSearching(false)
      return false
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error. Please check your connection.'
      setError(msg.includes('fetch') || msg.includes('network') ? 'Network error. Please check your connection.' : 'Could not start research. Please try again.')
      setIsSearching(false)
      return false
    }
  }, [router])

  const clearError = useCallback(() => setError(null), [])

  return { search, isSearching, error, clearError }
}
