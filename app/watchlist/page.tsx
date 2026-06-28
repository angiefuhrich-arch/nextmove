'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bookmark, Search, ChevronRight } from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'
import { cn } from '@/lib/utils'

const WATCHLIST_IDS = ['stripe', 'netflix']

export default function WatchlistPage() {
  const router = useRouter()
  const watchlist = companies.filter(c => WATCHLIST_IDS.includes(c.id))

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[900px] mx-auto px-6 py-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-brand" />
            <h1 className="text-title-lg text-ink font-bold">Watchlist</h1>
          </div>
          <p className="text-body-sm text-ink-tertiary">Employers you&apos;re tracking. Get alerted when scores change.</p>
        </motion.div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-subdued border border-divider flex items-center justify-center">
              <Bookmark className="w-7 h-7 text-ink-quaternary" />
            </div>
            <div>
              <p className="text-title-sm text-ink font-semibold">Your watchlist is empty</p>
              <p className="text-body-sm text-ink-tertiary mt-1">Search for employers and bookmark them to track changes.</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 h-10 px-5 bg-brand-light border border-brand/20 text-brand rounded-lg text-button-sm font-semibold hover:bg-brand hover:text-white transition-colors duration-fast"
            >
              <Search className="w-4 h-4" />
              Search employers
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {watchlist.map((company, i) => (
              <motion.button
                key={company.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => router.push(`/report/${company.id}`)}
                className={cn(
                  'bg-surface-elevated border border-divider rounded-2xl shadow-md p-5',
                  'text-left flex items-center gap-5',
                  'hover:border-brand/30 hover:shadow-lg hover:-translate-y-0.5',
                  'transition-all duration-base ease-default'
                )}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-surface-subdued border border-divider flex items-center justify-center text-body-sm font-bold text-ink-secondary flex-shrink-0">
                  {company.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Name + industry */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-semibold text-ink">{company.name}</p>
                  <p className="text-caption text-ink-tertiary">{company.industry} · {company.country}</p>
                </div>

                {/* Score */}
                <div className="text-center flex-shrink-0">
                  <p className="text-label text-ink-quaternary uppercase tracking-wider mb-0.5">Index</p>
                  <p className="text-metric-sm text-ink font-bold">{company.indexScore}</p>
                </div>

                <VerdictBadge verdict={company.verdict} size="sm" />

                <div className="flex-shrink-0 hidden sm:block">
                  <TrendArrow trend={company.trend} showLabel={false} />
                </div>

                <ChevronRight className="w-4 h-4 text-ink-quaternary flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
