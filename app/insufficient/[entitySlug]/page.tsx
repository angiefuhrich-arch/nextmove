'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, ChevronLeft } from 'lucide-react'

const checkedSources = [
  'Official website',
  'Public records',
  'Business news',
  'Job market sources',
  'SEC EDGAR Filings',
  'Corporate registries',
]

export default function InsufficientPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const name = entitySlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <div className="min-h-screen bg-surface pt-14 px-4">
      <div className="max-w-lg mx-auto pt-10 pb-20">
        {/* Back link */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-ink-tertiary hover:text-ink-secondary transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to search
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Shield icon */}
          <div className="w-16 h-16 rounded-2xl bg-surface-subdued border border-divider flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-ink-tertiary" />
          </div>

          <h1 className="text-2xl font-bold text-ink mb-3">
            We&apos;re still researching {name}
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed mb-8">
            We couldn&apos;t find enough verified public intelligence to produce a reliable brief for{' '}
            <span className="font-medium text-ink">{name}</span>. This can happen for private companies or recently founded employers.
          </p>

          {/* What we checked */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary mb-3">What We Checked</p>
            <div className="border border-divider rounded-2xl bg-surface-elevated overflow-hidden divide-y divide-divider">
              {checkedSources.map(src => (
                <div key={src} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-verdict-green flex-shrink-0" />
                    <span className="text-sm text-ink">{src}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-ink-tertiary tracking-wider">NO DATA</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notify card */}
          <div className="bg-brand-light border border-brand/20 rounded-2xl p-6 mb-8">
            <p className="text-sm font-semibold text-ink mb-1">Get notified when research is complete</p>
            <p className="text-xs text-ink-secondary mb-4">We&apos;ll email you the moment we have enough data for a full brief.</p>
            {submitted ? (
              <p className="text-sm text-brand font-medium">✓ You&apos;re on the list! We&apos;ll notify you at {email}.</p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-divider bg-white text-sm text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button
                  onClick={() => email && setSubmitted(true)}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Notify me
                </button>
              </div>
            )}
          </div>

          <p className="text-[11px] text-ink-tertiary text-center leading-relaxed">
            Scarsian only publishes briefs backed by sufficient verified evidence. We do not publish incomplete or low-confidence reports.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
