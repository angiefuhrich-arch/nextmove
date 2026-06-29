'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Bell, Loader2, Check, AlertCircle } from 'lucide-react'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface NotifPrefs {
  weekly_digest: boolean
  watchlist_alerts: boolean
  report_refresh: boolean
  credit_warnings: boolean
  product_announcements: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  weekly_digest: true,
  watchlist_alerts: true,
  report_refresh: true,
  credit_warnings: true,
  product_announcements: false,
}

const NOTIF_OPTIONS: { key: keyof NotifPrefs; label: string; desc: string }[] = [
  { key: 'weekly_digest', label: 'Weekly Intelligence Digest', desc: 'Every Monday: biggest score movers, new signals, and market highlights.' },
  { key: 'watchlist_alerts', label: 'Watchlist Alerts', desc: "Immediate alerts when a saved employer's Scarsian Index changes significantly." },
  { key: 'report_refresh', label: 'Report Refresh Completed', desc: 'Notification when an Intelligence Brief you have accessed is refreshed with new data.' },
  { key: 'credit_warnings', label: 'Credit Balance Warnings', desc: 'Alert when your Career Wallet balance drops below 2 credits.' },
  { key: 'product_announcements', label: 'Product Announcements', desc: 'New features, methodology updates, and platform news.' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-brand' : 'bg-ink-quaternary/30'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0'}`} />
    </button>
  )
}

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<'ok' | 'err' | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) { setLoading(false); return }
      const { data } = await supabase.from('profiles').select('notification_prefs').eq('id', user.id).single()
      if (!active) return
      if (data?.notification_prefs) {
        setPrefs({ ...DEFAULT_PREFS, ...data.notification_prefs })
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const handleToggle = useCallback((key: keyof NotifPrefs, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
    setSaveMsg(null)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/account/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      setSaveMsg(res.ok ? 'ok' : 'err')
    } catch { setSaveMsg('err') }
    setSaving(false)
  }

  return (
    <AccountLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Notifications</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Choose which alerts and emails you receive from Scarsian.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
        ) : (
          <div className="bg-white border border-divider rounded-2xl shadow-card divide-y divide-divider">
            {NOTIF_OPTIONS.map(opt => (
              <div key={opt.key} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{opt.label}</p>
                  <p className="text-xs text-ink-tertiary mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
                <Toggle checked={prefs[opt.key]} onChange={v => handleToggle(opt.key, v)} />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-hover transition-all disabled:opacity-60 flex items-center gap-1.5"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save preferences
          </button>
          {saveMsg === 'ok' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600"><Check className="w-3.5 h-3.5" />Saved</span>
          )}
          {saveMsg === 'err' && (
            <span className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" />Could not save. Try again.</span>
          )}
        </div>
      </motion.div>
    </AccountLayout>
  )
}
