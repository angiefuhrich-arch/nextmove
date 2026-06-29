'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, AlertCircle } from 'lucide-react'

interface SearchResult {
  id: string
  slug: string
  name: string
  industry?: string
  indexScore?: number
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const displayResults = results.length > 0 ? results : []

  const searchAPI = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setIsSearching(true)
    setError(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) { setResults([]); return }
      const data = await res.json()
      console.log('[search] query:', q, 'response:', data)
      if (data.hit && data.results) {
        setResults(data.results.map((r: { id: string; slug: string; name: string; industry?: string }) => ({ ...r })))
      } else {
        setResults([])
      }
    } catch (err) {
      console.warn('[search] fetch error:', err)
      setResults([])
    } finally { setIsSearching(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAPI(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, searchAPI])

  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      inputRef.current?.focus()
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false
      setQuery('')
      setResults([])
      setError(null)
    }
  }, [open])

  const startPipeline = useCallback(async (slug: string, name: string): Promise<boolean> => {
    console.log('[pipeline] starting for:', { slug, name })
    const res = await fetch('/api/pipeline/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entitySlug: slug, entityName: name, entityType: 'employer' }),
    })

    console.log('[pipeline] response status:', res.status)

    if (res.status === 401) {
      // Not logged in — redirect to login, preserve return URL
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
      router.push(`/login?next=${returnTo}`)
      return false
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error('[pipeline] error response:', errData)
      setError('Could not start research. Please try again.')
      setIsLaunching(false)
      return false
    }

    const data = await res.json()
    console.log('[pipeline] success response:', data)

    if (data.briefReady) {
      const dest = `/brief/${data.entitySlug ?? slug}`
      console.log('[pipeline] cache hit → routing to', dest)
      router.push(dest)
    } else if (data.runId) {
      const dest = `/building/${slug}?runId=${data.runId}`
      console.log('[pipeline] running → routing to', dest)
      router.push(dest)
    } else {
      console.error('[pipeline] no runId and no briefReady in response:', data)
      setError('Could not start research. Please try again.')
      setIsLaunching(false)
      return false
    }
    return true
  }, [router])

  const navigate = useCallback(async (slug: string, name: string) => {
    onClose()
    setIsLaunching(true)
    setError(null)
    try {
      await startPipeline(slug, name)
    } catch (err) {
      console.error('[pipeline] unexpected error:', err)
      setError('Could not start research. Please try again.')
      setIsLaunching(false)
    }
  }, [onClose, startPipeline])

  const handleSubmitQuery = useCallback(async () => {
    if (!query.trim()) return
    const slug = query.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setIsLaunching(true)
    setError(null)

    // If we already have results from the live search, navigate to the top hit
    if (displayResults.length > 0) {
      onClose()
      await startPipeline(displayResults[0].slug, displayResults[0].name)
      return
    }

    // No cached results — kick off pipeline for the typed query
    onClose()
    console.log('[search] no results for query, starting pipeline:', { query: query.trim(), slug })
    await startPipeline(slug, query.trim())
  }, [query, displayResults, onClose, startPipeline])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(p => (p + 1) % Math.max(displayResults.length, 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(p => (p - 1 + Math.max(displayResults.length, 1)) % Math.max(displayResults.length, 1))
    } else if (e.key === 'Enter') {
      if (displayResults[selectedIndex]) {
        navigate(displayResults[selectedIndex].slug, displayResults[selectedIndex].name)
      } else if (query.trim().length >= 2) {
        handleSubmitQuery()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[400] flex items-start justify-center pt-[120px]"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            role="combobox"
            aria-expanded={displayResults.length > 0}
            aria-haspopup="listbox"
            aria-controls="search-results-listbox"
            aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
            className="relative w-full max-w-[640px] mx-4 bg-navy-dark border border-navy-light rounded-3xl shadow-modal overflow-hidden"
          >
            {/* Live region for screen readers */}
            <div aria-live="polite" className="sr-only">
              {query.length >= 2 ? `${displayResults.length} results available` : ''}
            </div>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-light">
              {isSearching || isLaunching
                ? <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
                : <Search className="w-5 h-5 text-white/50 flex-shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); setError(null) }}
                onKeyDown={handleKeyDown}
                placeholder="Search any employer…"
                aria-autocomplete="list"
                aria-controls="search-results-listbox"
                aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
                className="flex-1 bg-transparent text-white text-lg placeholder-white/30 outline-none"
              />
              <button onClick={onClose} aria-label="Close search" className="p-1 rounded-md hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div id="search-results-listbox" role="listbox" aria-label="Search results" className="max-h-[400px] overflow-y-auto p-2">
              {error ? (
                <div className="flex items-center gap-3 px-4 py-4 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              ) : displayResults.length > 0 ? displayResults.map((company, i) => (
                <button
                  key={company.slug}
                  id={`result-${i}`}
                  role="option"
                  aria-selected={selectedIndex === i}
                  onClick={() => navigate(company.slug, company.name)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 ${
                    i === selectedIndex
                      ? 'bg-blue/20 border border-blue/40'
                      : 'hover:bg-white/[0.08] border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">{company.name}</div>
                    {company.industry && <div className="text-xs text-white/50">{company.industry}</div>}
                  </div>
                  {company.indexScore && (
                    <div className="text-sm font-bold text-white">{company.indexScore}</div>
                  )}
                </button>
              )) : query.length >= 2 ? (
                <button
                  onClick={handleSubmitQuery}
                  disabled={isLaunching}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/[0.06] border border-dashed border-navy-light transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    {isLaunching
                      ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      : <Search className="w-4 h-4 text-blue-400" />
                    }
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">
                      {isLaunching ? 'Starting research…' : `Build Intelligence Brief for "${query}"`}
                    </div>
                    <div className="text-xs text-white/40">No cached brief found — run on-demand pipeline (~20s)</div>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-white/50">
                  <Search className="w-10 h-10 text-white/20" />
                  <p className="text-sm">Search any company, startup, or employer</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
