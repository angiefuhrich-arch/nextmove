'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GitCompare, X, Plus, Search, Loader2 } from 'lucide-react'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { Footer } from '@/components/scarsian/Footer'
import { cn } from '@/lib/utils'

interface EntityResult {
  id: string
  slug: string
  name: string
  industry?: string
}

interface CompanyData {
  slug: string
  name: string
  industry?: string
  indexScore?: number
  verdict?: 'strong-move' | 'consider' | 'high-risk' | 'strong' | 'caution' | 'no-go'
  confidence?: number
  categories?: Array<{ name: string; score: number }>
}

export default function ComparePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<CompanyData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<EntityResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const displayResults = searchQuery.length < 2 ? [] : searchResults

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.length < 2) return
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (data.hit && data.results) {
          setSearchResults(data.results.filter((r: EntityResult) => !selected.find(s => s.slug === r.slug)))
        } else {
          setSearchResults([])
        }
      } catch { /* ignore */ }
      finally { setIsSearching(false) }
    }, 300)
  }, [searchQuery, selected])

  const addCompany = async (entity: EntityResult) => {
    if (selected.length >= 3) return
    // Optimistically add with metadata, then enrich with snapshot data
    const placeholder: CompanyData = { slug: entity.slug, name: entity.name, industry: entity.industry }
    setSelected(prev => [...prev, placeholder])
    setSearchQuery('')
    setSearchResults([])
    setShowSearch(false)
    try {
      const res = await fetch(`/api/briefs/${entity.slug}/summary`)
      if (res.ok) {
        const data = await res.json()
        setSelected(prev => prev.map(c => c.slug === entity.slug ? { ...c, ...data } : c))
      }
    } catch { /* keep placeholder */ }
  }

  const remove = (slug: string) => setSelected(prev => prev.filter(c => c.slug !== slug))

  const metricKeys = selected[0]?.categories?.map(c => c.name) ?? []

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[1000px] mx-auto px-6 py-12">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-brand" />
            <h1 className="text-title-lg text-ink font-bold">Compare Employers</h1>
          </div>
          <p className="text-body-sm text-ink-tertiary">Side-by-side intelligence across all dimensions. Up to 3 employers.</p>
        </motion.div>

        {/* Company selector */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          {selected.map(c => (
            <div key={c.slug} className="flex items-center gap-2 h-9 px-3 bg-brand-light border border-brand/20 rounded-lg text-body-sm text-brand">
              <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-label font-bold">
                {c.name.substring(0, 2).toUpperCase()}
              </div>
              {c.name}
              <button onClick={() => remove(c.slug)} className="text-brand/50 hover:text-brand transition-colors duration-fast">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selected.length < 3 && (
            <div className="relative">
              {showSearch ? (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-quaternary" />
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search employer…"
                      className="h-9 pl-8 pr-3 rounded-lg border border-brand/40 bg-white text-body-sm text-ink outline-none focus:border-brand w-48"
                    />
                    {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand animate-spin" />}
                  </div>
                  <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
                    className="p-1.5 rounded hover:bg-surface-subdued">
                    <X className="w-3.5 h-3.5 text-ink-quaternary" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 h-9 px-3 bg-surface-elevated border border-divider rounded-lg text-body-sm text-ink-tertiary hover:text-ink hover:border-brand/30 transition-colors duration-fast"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add employer
                </button>
              )}

              {displayResults.length > 0 && (
                <div className="absolute top-10 left-0 z-20 w-64 bg-white border border-divider rounded-xl shadow-elevated overflow-hidden">
                  {displayResults.slice(0, 6).map(r => (
                    <button
                      key={r.slug}
                      onClick={() => addCompany(r)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-subdued text-left transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-surface-subdued flex items-center justify-center text-[9px] font-bold text-ink-secondary">
                        {r.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-body-sm text-ink">{r.name}</div>
                        {r.industry && <div className="text-caption text-ink-quaternary">{r.industry}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {selected.length < 2 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-ink-quaternary">
            <Search className="w-10 h-10 text-ink-quaternary/50" />
            <p className="text-body-sm">Search and add at least 2 employers to compare</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-2xl border border-divider shadow-md">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-divider bg-surface-subdued/40">
                  <th className="px-4 py-3 text-label uppercase tracking-widest text-ink-tertiary font-semibold w-36">Dimension</th>
                  {selected.map(c => (
                    <th key={c.slug} className="px-4 py-3 text-center">
                      <button onClick={() => router.push(`/brief/${c.slug}`)} className="hover:text-brand transition-colors duration-fast">
                        <p className="text-body-sm font-bold text-ink">{c.name}</p>
                        <p className="text-caption text-ink-tertiary">{c.industry}</p>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Scarsian Index</td>
                  {selected.map(c => (
                    <td key={c.slug} className="px-4 py-3 text-center">
                      {c.indexScore != null
                        ? <span className="text-metric-md text-ink font-bold">{c.indexScore}</span>
                        : <span className="text-caption text-ink-quaternary">—</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Verdict</td>
                  {selected.map(c => (
                    <td key={c.slug} className="px-4 py-3 text-center">
                      {c.verdict
                        ? <VerdictBadge verdict={c.verdict} size="sm" />
                        : <span className="text-caption text-ink-quaternary">—</span>}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-divider">
                  <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">Confidence</td>
                  {selected.map(c => (
                    <td key={c.slug} className="px-4 py-3 text-center">
                      {c.confidence != null
                        ? <span className="text-body-sm font-semibold text-ink">{c.confidence}%</span>
                        : <span className="text-caption text-ink-quaternary">—</span>}
                    </td>
                  ))}
                </tr>
                {metricKeys.map((metric, mi) => (
                  <tr key={metric} className={cn('border-b border-divider last:border-0', mi % 2 === 0 && 'bg-surface/40')}>
                    <td className="px-4 py-3 text-label uppercase tracking-wider text-ink-tertiary font-semibold">{metric}</td>
                    {selected.map(c => {
                      const cat = c.categories?.find(x => x.name === metric)
                      const score = cat?.score
                      const best = Math.max(...selected.map(x => x.categories?.find(y => y.name === metric)?.score ?? 0))
                      return (
                        <td key={c.slug} className="px-4 py-3 text-center">
                          {score != null
                            ? <span className={cn('text-body-sm font-bold', score === best ? 'text-status-success' : 'text-ink-tertiary')}>{score}</span>
                            : <span className="text-caption text-ink-quaternary">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  )
}
