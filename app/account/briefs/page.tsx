'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Loader2, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface UnlockedBrief {
  id: string
  unlocked_at: string
  entity_id: string
  entities: {
    name: string
    slug: string
    entity_type: string
  } | null
}

export default function PurchasedBriefsPage() {
  const [briefs, setBriefs] = useState<UnlockedBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }

      const { data } = await supabase
        .from('brief_unlocks')
        .select('id, unlocked_at, entity_id, entities(name, slug, entity_type)')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(200)

      if (!active) return
      setBriefs((data ?? []) as unknown as UnlockedBrief[])
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const filtered = briefs
    .filter(b => {
      if (!query) return true
      return b.entities?.name?.toLowerCase().includes(query.toLowerCase())
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.entities?.name ?? '').localeCompare(b.entities?.name ?? '')
      }
      return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
    })

  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Purchased Intelligence Briefs</h1>
          </div>
          <p className="text-sm text-ink-tertiary">All Intelligence Briefs you have unlocked.</p>
        </div>

        {/* Search + sort */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-quaternary" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search briefs…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-divider bg-white text-ink text-sm placeholder:text-ink-quaternary outline-none focus:border-brand transition-colors"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'name')}
            className="px-3 py-2.5 rounded-xl border border-divider bg-white text-ink text-sm outline-none focus:border-brand"
          >
            <option value="date">Sort: Most recent</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-divider rounded-2xl p-12 shadow-card text-center">
            <FileText className="w-10 h-10 text-ink-quaternary/40 mx-auto mb-3" />
            <p className="text-sm text-ink-tertiary">
              {query ? 'No briefs match your search.' : 'No Intelligence Briefs purchased yet.'}
            </p>
            {!query && (
              <Link href="/" className="inline-flex items-center gap-1.5 mt-4 text-xs text-brand hover:underline">
                Search employers to unlock briefs
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white border border-divider rounded-2xl shadow-card overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 border-b border-divider bg-surface-subdued">
              {['Company', 'Unlocked', ''].map(h => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-ink-quaternary">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-divider">
              {filtered.map((brief, i) => (
                <motion.div
                  key={brief.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="grid md:grid-cols-[1fr_auto_auto] gap-3 md:gap-4 px-5 py-4 items-center hover:bg-surface-subdued/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand/8 flex items-center justify-center text-[11px] font-bold text-brand flex-shrink-0">
                      {(brief.entities?.name ?? '??').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{brief.entities?.name ?? 'Unknown'}</p>
                      <p className="text-[11px] text-ink-quaternary capitalize">{brief.entities?.entity_type ?? 'employer'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-tertiary whitespace-nowrap">
                    {new Date(brief.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {brief.entities?.slug && (
                    <Link
                      href={`/brief/${brief.entities.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-[11px] font-semibold hover:bg-brand-hover transition-all whitespace-nowrap"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Brief
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AccountLayout>
  )
}
