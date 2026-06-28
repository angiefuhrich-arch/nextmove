'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Shield, ArrowLeft, Check, ExternalLink, Bookmark,
  Mail, MessageSquare, Globe, FileText, Newspaper, Search, Building2, Link2,
} from 'lucide-react'

const checkedSources = [
  { icon: Globe, label: 'Official website' },
  { icon: FileText, label: 'Public records' },
  { icon: Newspaper, label: 'Business news' },
  { icon: Search, label: 'Job market sources' },
  { icon: FileText, label: 'SEC EDGAR Filings' },
  { icon: Building2, label: 'Corporate registries' },
]

export default function InsufficientPage() {
  const { entitySlug } = useParams<{ entitySlug: string }>()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [notified, setNotified] = useState(false)
  const [saved, setSaved] = useState(false)
  const name = (entitySlug as string).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 pt-16">
      <div className="max-w-[480px] w-full pb-20">
        {/* Back link */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-[11px] text-ink-tertiary hover:text-brand transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to search
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-surface-subdued border border-divider flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-ink-quaternary" />
          </div>

          <h1 className="text-xl font-bold text-ink mb-3">
            We&apos;re still researching {name}
          </h1>
          <p className="text-sm text-ink-secondary leading-relaxed mb-8">
            We searched trusted public sources but could not find enough reliable evidence to generate a trustworthy Intelligence Brief. This is not a failure — it is a commitment to accuracy.
          </p>

          {/* What we checked */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-3">What we checked</p>
            <div className="bg-white border border-divider rounded-xl overflow-hidden shadow-card">
              {checkedSources.map((src, i) => (
                <div key={src.label} className={`flex items-center gap-3 px-4 py-2.5 ${i < checkedSources.length - 1 ? 'border-b border-divider' : ''}`}>
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <src.icon className="w-3.5 h-3.5 text-ink-quaternary flex-shrink-0" />
                  <span className="text-sm text-ink-secondary flex-1">{src.label}</span>
                  <span className="text-[10px] text-ink-quaternary uppercase">No data</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-1">What you can do</p>

            {/* Submit source */}
            <button
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-divider hover:border-brand/30 hover:shadow-card transition-all text-left w-full group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink group-hover:text-brand transition-colors">Submit a website or source</div>
                <div className="text-[11px] text-ink-tertiary">Help us find verified information</div>
              </div>
              <Link2 className="w-3.5 h-3.5 text-ink-quaternary group-hover:text-brand transition-colors" />
            </button>

            {/* Save to watchlist */}
            <button
              onClick={() => setSaved(true)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left w-full group ${
                saved ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-divider hover:border-brand/30 hover:shadow-card'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${saved ? 'bg-emerald-100' : 'bg-brand-light'}`}>
                <Bookmark className={`w-3.5 h-3.5 ${saved ? 'text-emerald-600' : 'text-brand'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium transition-colors ${saved ? 'text-emerald-700' : 'text-ink group-hover:text-brand'}`}>
                  {saved ? 'Saved to watchlist' : 'Save to watchlist'}
                </div>
                <div className={`text-[11px] ${saved ? 'text-emerald-600' : 'text-ink-tertiary'}`}>
                  {saved ? 'You will be notified when research is complete' : 'Get notified when the Brief is ready'}
                </div>
              </div>
            </button>

            {/* Email notify */}
            {!notified ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-subdued border border-divider text-sm text-ink placeholder:text-ink-quaternary outline-none focus:border-brand transition-all"
                />
                <button
                  onClick={() => email.includes('@') && setNotified(true)}
                  className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white font-medium rounded-xl text-sm transition-all flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Notify me
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-emerald-700">You will be notified at {email}</p>
              </motion.div>
            )}
          </div>

          {/* Trust statement */}
          <div className="flex items-start gap-2 p-4 rounded-xl bg-surface-subdued border border-divider">
            <MessageSquare className="w-4 h-4 text-ink-quaternary mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-ink-quaternary leading-relaxed">
              Scarsian never fabricates data. Every score is derived from verified evidence. If the evidence is not there, we say so — and we keep looking.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
