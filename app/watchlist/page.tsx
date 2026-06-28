'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Trash2, ChevronRight, Settings, TrendingUp,
  Zap, Mail, Megaphone, X,
} from 'lucide-react'
import { companies } from '@/lib/data/mockData'
import { VerdictBadge } from '@/components/scarsian/VerdictBadge'
import { TrendArrow } from '@/components/scarsian/TrendArrow'
import { Footer } from '@/components/scarsian/Footer'

type AlertType = 'score-change' | 'new-signals' | 'weekly-digest'

interface AlertSetting {
  type: AlertType
  label: string
  desc: string
  enabled: boolean
}

const INITIAL_LIST = ['stripe', 'netflix', 'airbnb', 'meta'].filter(id => companies.find(c => c.id === id))

export default function WatchlistPage() {
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { type: 'score-change', label: 'Score Changes', desc: 'When an employer\'s Scarsian Index changes by more than 3 points', enabled: true },
    { type: 'new-signals', label: 'New Signals', desc: 'When new verified findings are added to any employer', enabled: true },
    { type: 'weekly-digest', label: 'Weekly Digest', desc: 'Every Monday: biggest movers, new signals, score changes', enabled: false },
  ])
  const [emailFreq, setEmailFreq] = useState<'realtime' | 'daily' | 'weekly'>('daily')
  const [list, setList] = useState(companies.filter(c => INITIAL_LIST.includes(c.id)))

  const toggleAlert = (type: AlertType) => {
    setAlertSettings(prev => prev.map(a => a.type === type ? { ...a, enabled: !a.enabled } : a))
  }

  const removeItem = (id: string) => setList(prev => prev.filter(c => c.id !== id))

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

        {/* Biggest Movers */}
        {list.filter(c => c.trend.direction === 'up').length > 0 && (
          <div className="mb-6 bg-white border border-divider rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Biggest Movers This Week</span>
            </div>
            <div className="flex flex-col gap-2">
              {list.filter(c => c.trend.direction === 'up').slice(0, 2).map(c => (
                <button key={c.id} onClick={() => router.push(`/brief/${c.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-subdued/50 transition-colors text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-surface-subdued flex items-center justify-center text-[9px] font-bold text-ink-secondary">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-ink-secondary">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600">{c.trend.value}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white border border-divider rounded-2xl p-5 flex flex-col gap-3 shadow-card hover:shadow-elevated transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-subdued border border-divider flex items-center justify-center text-xs font-bold text-ink-secondary">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">{c.name}</div>
                      <div className="text-[11px] text-ink-tertiary">{c.industry}</div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(c.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group">
                    <Trash2 className="w-3.5 h-3.5 text-ink-quaternary group-hover:text-red-500" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-ink-tertiary uppercase tracking-wider">Scarsian Index™</div>
                    <div className="text-2xl font-bold text-ink">{c.indexScore}</div>
                  </div>
                  <VerdictBadge verdict={c.verdict} size="sm" />
                </div>
                <TrendArrow trend={c.trend} />
                <div className="flex items-center gap-1.5 text-xs text-brand">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{c.signals.length} new signals</span>
                </div>
                <button onClick={() => router.push(`/brief/${c.id}`)}
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-0.5 pt-1">
                  View Brief <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Signals */}
        {list.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-3.5 h-3.5 text-brand" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">Recent Signals</span>
            </div>
            <div className="bg-white border border-divider rounded-2xl overflow-hidden shadow-card">
              {list.flatMap(c => c.signals.slice(0, 1)).slice(0, 4).map((s, i, arr) => (
                <div key={`${s.id}-${i}`} className={`px-4 py-3 flex items-start gap-2.5 ${i < arr.length - 1 ? 'border-b border-divider' : ''} hover:bg-surface-subdued/30 transition-colors`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${s.sentiment === 'positive' ? 'bg-emerald-400' : s.sentiment === 'negative' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-ink-secondary leading-snug">{s.text}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-quaternary">
                      <span>{s.category}</span>
                      <span>·</span>
                      <span>{s.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
