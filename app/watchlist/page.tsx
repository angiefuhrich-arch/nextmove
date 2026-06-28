'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Trash2, ChevronRight, Settings, Megaphone, X, Mail, Loader2, TrendingUp,
} from 'lucide-react'
import { Footer } from '@/components/scarsian/Footer'
import { createBrowserClient } from '@supabase/ssr'

interface SavedCompany {
  id: string
  company_slug: string
  company_name: string
  created_at: string
}

interface SnapshotSummary {
  indexScore: number | null
  verdict: string | null
  confidence: number | null
}

type AlertType = 'score-change' | 'new-signals' | 'weekly-digest'

interface AlertSetting {
  type: AlertType
  label: string
  desc: string
  enabled: boolean
}

export default function WatchlistPage() {
  const router = useRouter()
  const [list, setList] = useState<SavedCompany[]>([])
  const [snapshots, setSnapshots] = useState<Record<string, SnapshotSummary>>({})
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { type: 'score-change', label: 'Score Changes', desc: "When an employer's Scarsian Index changes by more than 3 points", enabled: true },
    { type: 'new-signals', label: 'New Signals', desc: 'When new verified findings are added to any employer', enabled: true },
    { type: 'weekly-digest', label: 'Weekly Digest', desc: 'Every Monday: biggest movers, new signals, score changes', enabled: false },
  ])
  const [emailFreq, setEmailFreq] = useState<'realtime' | 'daily' | 'weekly'>('daily')

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const fetchList = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?next=/watchlist')
        return
      }
      const { data } = await supabase
        .from('saved_companies')
        .select('id, company_slug, company_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      const companies = data ?? []
      setList(companies)
      setLoading(false)

      // Enrich with live snapshot data
      const entries = await Promise.all(
        companies.map(async (c) => {
          try {
            const res = await fetch(`/api/briefs/${c.company_slug}/summary`)
            if (!res.ok) return [c.company_slug, null] as const
            const s = await res.json()
            return [c.company_slug, s as SnapshotSummary] as const
          } catch {
            return [c.company_slug, null] as const
          }
        })
      )
      setSnapshots(Object.fromEntries(entries.filter(([, v]) => v !== null)))
    }

    fetchList()
  }, [router])

  const removeItem = async (id: string, slug: string) => {
    setList(prev => prev.filter(c => c.id !== id))
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.from('saved_companies').delete().eq('id', id)
  }

  const toggleAlert = (type: AlertType) => {
    setAlertSettings(prev => prev.map(a => a.type === type ? { ...a, enabled: !a.enabled } : a))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-14 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface pt-14">
      <div className="max-w-[720px] mx-auto px-6 py-12 md:py-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-ink tracking-[-1px]">Your Watchlist</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-subdued text-xs text-ink-tertiary border border-divider">{list.length}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-divider text-[11px] text-ink-tertiary hover:text-brand hover:border-brand/30 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Alerts
          </button>
        </div>
        <p className="text-sm text-ink-tertiary mb-8">Employers you are tracking</p>

        {/* Alert Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white border border-divider rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand" />
                    <span className="text-sm font-semibold text-ink">Notification Preferences</span>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-1 rounded hover:bg-surface-subdued">
                    <X className="w-3.5 h-3.5 text-ink-quaternary" />
                  </button>
                </div>
                <div className="flex flex-col gap-3 mb-5">
                  {alertSettings.map(alert => (
                    <div key={alert.type} className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink">{alert.label}</div>
                        <div className="text-[11px] text-ink-tertiary">{alert.desc}</div>
                      </div>
                      <button
                        onClick={() => toggleAlert(alert.type)}
                        className={`w-10 h-[22px] rounded-full relative flex-shrink-0 transition-colors ${alert.enabled ? 'bg-brand' : 'bg-divider'}`}
                      >
                        <span className={`absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all ${alert.enabled ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-divider pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Mail className="w-3.5 h-3.5 text-ink-quaternary" />
                    <span className="text-xs font-medium text-ink-secondary">Email Frequency</span>
                  </div>
                  <div className="flex gap-2">
                    {(['realtime', 'daily', 'weekly'] as const).map(freq => (
                      <button
                        key={freq}
                        onClick={() => setEmailFreq(freq)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all ${
                          emailFreq === freq ? 'bg-brand-light text-brand' : 'text-ink-quaternary hover:text-ink-secondary bg-surface-subdued'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Watchlist grid */}
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-subdued border border-divider flex items-center justify-center">
              <Megaphone className="w-7 h-7 text-ink-quaternary" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Your watchlist is empty</p>
              <p className="text-sm text-ink-tertiary mt-1">Search for employers and bookmark them to track changes.</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 h-10 px-5 bg-brand-light border border-brand/20 text-brand rounded-xl text-sm font-semibold hover:bg-brand hover:text-white transition-colors"
            >
              Search employers
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-divider rounded-2xl p-5 flex items-center gap-4 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-surface-subdued border border-divider flex items-center justify-center text-xs font-bold text-ink-secondary flex-shrink-0">
                  {item.company_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink">{item.company_name}</div>
                  <div className="text-[11px] text-ink-quaternary">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                {snapshots[item.company_slug] ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {snapshots[item.company_slug].indexScore !== null && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-light border border-brand/20">
                        <TrendingUp className="w-3 h-3 text-brand" />
                        <span className="text-[11px] font-bold text-brand">
                          {Math.round(snapshots[item.company_slug].indexScore!)}
                        </span>
                      </div>
                    )}
                    {snapshots[item.company_slug].verdict && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
                        {snapshots[item.company_slug].verdict!.replace(/-/g, ' ')}
                      </span>
                    )}
                  </div>
                ) : null}
                <button
                  onClick={() => router.push(`/brief/${item.company_slug}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-brand border border-brand/20 hover:bg-brand-light transition-colors"
                >
                  View Brief
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeItem(item.id, item.company_slug)}
                  className="p-2 rounded-lg text-ink-quaternary hover:text-status-danger hover:bg-status-danger-bg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
