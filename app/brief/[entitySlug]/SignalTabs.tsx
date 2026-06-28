'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SignalItem {
  id: string
  signal_name: string
  signal_category: string
  score: number
  confidence: number
  reasoning: string | null
  created_at: string
}

interface SignalTabsProps {
  signals: SignalItem[]
}

const sentimentFromScore = (score: number) => {
  if (score >= 65) return 'positive'
  if (score >= 40) return 'neutral'
  return 'negative'
}

const sentimentColors = {
  positive: { dot: 'bg-verdict-green', badge: 'text-verdict-green bg-verdict-green/10' },
  negative: { dot: 'bg-verdict-red',   badge: 'text-verdict-red bg-verdict-red/10'     },
  neutral:  { dot: 'bg-verdict-amber', badge: 'text-verdict-amber bg-verdict-amber/10'  },
} as const

const CATEGORY_LABELS: Record<string, string> = {
  cgs: 'Culture & Growth',
  crs: 'Comp & Retention',
  mvs: 'Mission & Vision',
  cfs: 'Career Fit',
  gfi: 'GFI',
  confidence: 'Confidence',
  adjustment: 'Adjustment',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function SignalTabs({ signals }: SignalTabsProps) {
  const categories = Array.from(new Set(signals.map(s => s.signal_category)))
  const tabs = ['All', ...categories]
  const [active, setActive] = useState('All')

  const filtered = active === 'All' ? signals : signals.filter(s => s.signal_category === active)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-button-sm whitespace-nowrap transition-colors duration-fast',
              active === tab
                ? 'bg-brand/10 text-brand border border-brand/20'
                : 'text-ink-tertiary hover:text-ink-secondary border border-transparent'
            )}
          >
            {CATEGORY_LABELS[tab] ?? tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {filtered.map((s, i) => {
          const sentiment = sentimentFromScore(s.score)
          const colors = sentimentColors[sentiment]
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-3 py-3 border-b border-divider last:border-0 hover:bg-surface-subdued -mx-2 px-2 rounded-lg transition-colors duration-fast cursor-default group"
            >
              <div className={cn('w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0', colors.dot)} />
              <div className="flex-1 min-w-0">
                <p className="text-body-sm text-ink-secondary leading-snug group-hover:text-ink transition-colors duration-fast">
                  {s.reasoning ?? s.signal_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-label uppercase text-ink-tertiary">{CATEGORY_LABELS[s.signal_category] ?? s.signal_category}</span>
                  <span className="text-caption text-ink-quaternary">{formatDate(s.created_at)}</span>
                </div>
              </div>
              <span className={cn('text-label px-2 py-0.5 rounded-full flex-shrink-0 font-medium', colors.badge)}>
                {s.score}
              </span>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-body-sm text-ink-tertiary">No signals in this category.</p>
        )}
      </div>
    </div>
  )
}
