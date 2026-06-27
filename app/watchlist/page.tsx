'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bookmark, Search, ChevronRight } from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'

// Static demo watchlist — will come from DB (profiles.watchlist) in Phase 5
const WATCHLIST_IDS = ['stripe', 'netflix']

export default function WatchlistPage() {
  const router = useRouter()
  const watchlist = companies.filter(c => WATCHLIST_IDS.includes(c.id))

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark className="w-5 h-5 text-blue" />
            <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          </div>
          <p className="text-sm text-white/50">Companies you&apos;re tracking. Get alerted when scores change.</p>
        </motion.div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-white/40">
            <Bookmark className="w-12 h-12 text-white/20" />
            <p className="text-lg">Your watchlist is empty</p>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue/15 border border-blue/30 text-blue rounded-xl text-sm hover:bg-blue/25 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search companies
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
                className="scarsian-card p-5 text-left hover:border-blue/30 transition-colors duration-200 flex items-center gap-5"
              >
                {/* Logo */}
                <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {company.name.substring(0, 2).toUpperCase()}
                </div>

                {/* Name + industry */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{company.name}</div>
                  <div className="text-[11px] text-white/40">{company.industry} · {company.country}</div>
                </div>

                {/* Score */}
                <div className="text-center flex-shrink-0">
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Index</div>
                  <div className="text-2xl font-bold text-white">{company.indexScore}</div>
                </div>

                {/* Verdict */}
                <VerdictBadge verdict={company.verdict} size="sm" />

                {/* Trend */}
                <div className="flex-shrink-0 hidden sm:block">
                  <TrendArrow trend={company.trend} showLabel={false} />
                </div>

                <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
