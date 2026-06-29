'use client'

import { useState, useEffect, useRef, useCallback, useId } from 'react'
import { Search, Loader2, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { useEmployerSearch } from '@/lib/hooks/useEmployerSearch'

const POPULAR_EMPLOYERS = [
  'HSBC Hong Kong',
  'Google',
  'OpenAI',
  'Deloitte',
  'Cathay Pacific',
  'Tencent',
]

const RECENT_KEY = 'scarsian_recent_searches'
const MAX_RECENT = 5

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch { return [] }
}

function saveRecent(query: string) {
  if (typeof window === 'undefined') return
  try {
    const prev = loadRecent().filter(q => q !== query)
    localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)))
  } catch { /* ignore */ }
}

interface SearchResult {
  id: string
  slug: string
  name: string
  industry?: string
}

interface SearchBoxProps {
  id?: string
  placeholder?: string
  size?: 'hero' | 'compact'
  autoFocus?: boolean
  inputRef?: React.RefObject<HTMLInputElement | null>
}

export function SearchBox({ id, placeholder = 'Search any employer…', size = 'hero', autoFocus, inputRef: externalInputRef }: SearchBoxProps) {
  const listboxId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recent, setRecent] = useState<string[]>(() => loadRecent())
  const internalInputRef = useRef<HTMLInputElement>(null)
  const inputRef = externalInputRef ?? internalInputRef
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { search, isSearching: isLaunching, error, clearError } = useEmployerSearch()

  // Debounced API search
  const searchAPI = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) { setResults([]); return }
      const data = await res.json()
      if (data.hit && data.results) {
        setResults(data.results as SearchResult[])
      } else {
        setResults([])
      }
    } catch { setResults([]) }
    finally { setIsSearching(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => searchAPI(query), 300)
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, searchAPI])

  // Derived: clear results when query is too short
  const activeResults = query.length >= 2 ? results : []

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const launch = useCallback(async (name: string) => {
    saveRecent(name)
    setRecent(loadRecent())
    clearError()
    setSelectedIndex(-1)
    const ok = await search(name)
    // On success, navigation takes over. On failure, keep dropdown open so the error is visible.
    if (ok) {
      setOpen(false)
      setQuery('')
    }
  }, [search, clearError])

  // Build the ordered list of items shown in dropdown
  const hasQuery = query.trim().length >= 2
  const dropdownItems: Array<{ type: 'result' | 'recent' | 'popular' | 'generate'; label: string; sub?: string }> = []

  if (hasQuery) {
    activeResults.forEach(r => dropdownItems.push({ type: 'result', label: r.name, sub: r.industry }))
    dropdownItems.push({ type: 'generate', label: `Generate Intelligence Brief for "${query.trim()}"`, sub: 'On-demand pipeline · ~20s' })
  } else {
    recent.forEach(r => dropdownItems.push({ type: 'recent', label: r }))
    POPULAR_EMPLOYERS.forEach(p => dropdownItems.push({ type: 'popular', label: p }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key !== 'Escape') setOpen(true); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(p => Math.min(p + 1, dropdownItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(p => Math.max(p - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && dropdownItems[selectedIndex]) {
        const item = dropdownItems[selectedIndex]
        launch(item.type === 'generate' ? query.trim() : item.label)
      } else if (query.trim().length >= 2) {
        launch(query.trim())
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSelectedIndex(-1)
    }
  }

  const isHero = size === 'hero'

  return (
    <div ref={containerRef} className="relative w-full" id={id}>
      {/* Input */}
      <div
        className={`flex items-center gap-3 bg-white border rounded-2xl transition-all duration-200 ${
          open
            ? 'border-brand/40 shadow-elevated'
            : 'border-divider shadow-card hover:border-brand/20 hover:shadow-search'
        } ${isHero ? 'px-6 py-[17px]' : 'px-4 py-2.5'}`}
      >
        {isSearching || isLaunching
          ? <Loader2 className={`flex-shrink-0 text-brand animate-spin ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
          : <Search className={`flex-shrink-0 text-ink-quaternary ${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
        }
        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          role="combobox"
          aria-haspopup="listbox"
          aria-activedescendant={selectedIndex >= 0 ? `sb-item-${selectedIndex}` : undefined}
          onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); clearError(); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent text-ink placeholder-ink-quaternary outline-none ${isHero ? 'text-base' : 'text-sm'}`}
        />
        {!isHero && (
          <div className="hidden md:flex items-center gap-0.5 text-[9px] text-ink-quaternary border border-divider rounded px-1.5 py-0.5 flex-shrink-0">
            <span>⌘K</span>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute z-[300] top-full mt-2 left-0 right-0 bg-white border border-divider rounded-2xl shadow-elevated overflow-hidden"
        >
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 text-red-500 text-sm border-b border-divider">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Section label */}
          {!hasQuery && (recent.length > 0 || POPULAR_EMPLOYERS.length > 0) && (
            <div className="px-4 pt-3 pb-1">
              {recent.length > 0 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary mb-1">Recent</p>
              )}
            </div>
          )}

          <div className="py-1.5 max-h-[340px] overflow-y-auto">
            {dropdownItems.map((item, i) => {
              const isPopularHeader = item.type === 'popular' && (i === 0 || dropdownItems[i - 1].type === 'recent')
              return (
                <div key={`${item.type}-${i}`}>
                  {isPopularHeader && (
                    <div className="px-4 pt-2 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">Popular</p>
                    </div>
                  )}
                  <button
                    id={`sb-item-${i}`}
                    role="option"
                    aria-selected={selectedIndex === i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onMouseDown={e => { e.preventDefault(); launch(item.type === 'generate' ? query.trim() : item.label) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      selectedIndex === i ? 'bg-brand/5' : 'hover:bg-surface-subdued'
                    } ${item.type === 'generate' ? 'border-t border-divider mt-1 pt-3' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                      item.type === 'generate' ? 'bg-brand/10' :
                      item.type === 'recent' ? 'bg-surface-subdued' :
                      item.type === 'popular' ? 'bg-surface-subdued' :
                      'bg-surface-subdued'
                    }`}>
                      {item.type === 'generate'
                        ? (isLaunching ? <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" /> : <Search className="w-3.5 h-3.5 text-brand" />)
                        : item.type === 'recent'
                        ? <Clock className="w-3.5 h-3.5 text-ink-quaternary" />
                        : item.type === 'popular'
                        ? <TrendingUp className="w-3.5 h-3.5 text-ink-quaternary" />
                        : <span className="text-[10px] font-bold text-ink-secondary">{item.label.substring(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${item.type === 'generate' ? 'text-brand font-medium' : 'text-ink font-medium'}`}>
                        {isLaunching && item.type === 'generate' ? 'Starting research…' : item.label}
                      </p>
                      {item.sub && <p className="text-xs text-ink-quaternary truncate">{item.sub}</p>}
                    </div>
                  </button>
                </div>
              )
            })}

            {hasQuery && activeResults.length === 0 && isSearching && (
              <div className="px-4 py-3 text-sm text-ink-tertiary flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" /> Searching…
              </div>
            )}

            {!hasQuery && dropdownItems.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-ink-quaternary">
                Start typing to search employers
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
