'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Settings, Loader2, Check, AlertCircle } from 'lucide-react'
import { AccountLayout } from '@/components/scarsian/AccountLayout'

interface Preferences {
  default_market: string
  email_frequency: string
  default_report_view: string
  language: string
}

const DEFAULT_PREFS: Preferences = {
  default_market: 'HK',
  email_frequency: 'weekly',
  default_report_view: 'summary',
  language: 'en',
}

const MARKETS = [
  { value: 'HK', label: 'Hong Kong' },
  { value: 'US', label: 'United States' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AU', label: 'Australia' },
]

const EMAIL_FREQS = [
  { value: 'realtime', label: 'Real-time (as events happen)' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
  { value: 'never', label: 'No emails' },
]

const REPORT_VIEWS = [
  { value: 'summary', label: 'Executive Summary first' },
  { value: 'scores', label: 'Scores & dimensions first' },
  { value: 'full', label: 'Full report expanded' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
]

function SelectField({ label, desc, value, onChange, options }: {
  label: string
  desc: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-tertiary mt-0.5">{desc}</p>
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-divider bg-white text-ink text-sm outline-none focus:border-brand transition-colors flex-shrink-0"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS)
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
      const { data } = await supabase.from('profiles').select('preferences').eq('id', user.id).single()
      if (!active) return
      if (data?.preferences) setPrefs({ ...DEFAULT_PREFS, ...data.preferences })
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  const set = (key: keyof Preferences) => (value: string) => {
    setPrefs(prev => ({ ...prev, [key]: value }))
    setSaveMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/account/preferences', {
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
            <Settings className="w-5 h-5 text-brand" />
            <h1 className="text-2xl font-bold text-ink tracking-tight">Preferences</h1>
          </div>
          <p className="text-sm text-ink-tertiary">Customize how Scarsian works for you.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
        ) : (
          <div className="bg-white border border-divider rounded-2xl shadow-card divide-y divide-divider">
            <SelectField
              label="Language"
              desc="Display language for the Scarsian platform."
              value={prefs.language}
              onChange={set('language')}
              options={LANGUAGES}
            />
            <SelectField
              label="Default Market"
              desc="Primary employer market for search defaults and Intelligence Brief context."
              value={prefs.default_market}
              onChange={set('default_market')}
              options={MARKETS}
            />
            <SelectField
              label="Email Frequency"
              desc="How often Scarsian sends summary and digest emails."
              value={prefs.email_frequency}
              onChange={set('email_frequency')}
              options={EMAIL_FREQS}
            />
            <SelectField
              label="Default Report View"
              desc="Which section is expanded first when you open an Intelligence Brief."
              value={prefs.default_report_view}
              onChange={set('default_report_view')}
              options={REPORT_VIEWS}
            />
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-ink">Theme</p>
                <p className="text-xs text-ink-tertiary mt-0.5">Light and dark mode preferences.</p>
              </div>
              <span className="px-2.5 py-1 bg-surface-subdued border border-divider text-[10px] font-bold text-ink-quaternary uppercase rounded-full self-start">Coming Soon</span>
            </div>
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
          {saveMsg === 'ok' && <span className="flex items-center gap-1.5 text-xs text-emerald-600"><Check className="w-3.5 h-3.5" />Saved</span>}
          {saveMsg === 'err' && <span className="flex items-center gap-1.5 text-xs text-red-500"><AlertCircle className="w-3.5 h-3.5" />Could not save.</span>}
        </div>
      </motion.div>
    </AccountLayout>
  )
}
