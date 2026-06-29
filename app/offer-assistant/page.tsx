'use client'
import { useState } from 'react'
import { Briefcase, CheckCircle2, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'
import { OfferAnalysis } from '@/types'

const PRIORITIES = ['money', 'growth', 'stability', 'flexibility', 'prestige']
const WORK_MODES = ['remote', 'hybrid', 'office']

export default function OfferAssistantPage() {
  const [form, setForm] = useState({
    company: '', role: '', salary: '', currentSalary: '',
    location: '', workMode: 'hybrid', priority: 'growth'
  })
  const [result, setResult] = useState<OfferAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const analyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/offers/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const recColors = {
    accept: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Accept Offer' },
    negotiate: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'Negotiate First' },
    decline: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Decline Offer' },
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-title-lg text-ink font-bold">Offer Decision Assistant</h1>
          <p className="text-body-sm text-ink-tertiary mt-1">Input your offer details and get AI-powered accept/negotiate/decline guidance.</p>
        </div>

        <form onSubmit={analyze} className="bg-white rounded-xl border border-divider p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Company Name</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="e.g. Google" required
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Role Title</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="e.g. Senior Engineer" required
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Offered Salary (USD)</label>
              <input
                type="number"
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                value={form.salary} onChange={e => set('salary', e.target.value)}
                placeholder="150000" required
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Current Salary (USD)</label>
              <input
                type="number"
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)}
                placeholder="120000" required
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Location</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-body-sm font-medium text-ink mb-1.5">Work Mode</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-divider text-body-sm focus:outline-none focus:ring-2 focus:ring-brand/30 bg-white"
                value={form.workMode} onChange={e => set('workMode', e.target.value)}
              >
                {WORK_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-ink mb-2">Your Top Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`px-4 py-1.5 rounded-full text-body-sm font-medium border transition-colors capitalize ${
                    form.priority === p
                      ? 'bg-brand border-brand text-white'
                      : 'bg-white border-divider text-ink-secondary hover:border-brand/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-body-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand hover:bg-brand/90 text-white rounded-lg font-semibold text-body-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing offer…</> : <><Briefcase size={16} />Analyze My Offer</>}
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            <div className={`rounded-xl border-2 p-6 ${recColors[result.recommendation].bg}`}>
              <div className={`text-3xl font-bold mb-3 ${recColors[result.recommendation].text}`}>
                {recColors[result.recommendation].label}
              </div>
              <p className="text-ink-secondary">{result.explanation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {result.negotiation_tips.length > 0 && (
                <div className="bg-white rounded-xl border border-divider p-5">
                  <h3 className="text-body-sm font-semibold text-ink mb-3 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-status-success" />
                    Negotiation Tips
                  </h3>
                  <ul className="space-y-2">
                    {result.negotiation_tips.map((tip, i) => (
                      <li key={i} className="text-body-sm text-ink-secondary flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-status-success rounded-full mt-1.5 shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.risk_warnings.length > 0 && (
                <div className="bg-white rounded-xl border border-divider p-5">
                  <h3 className="text-body-sm font-semibold text-ink mb-3 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-status-warning" />
                    Risk Warnings
                  </h3>
                  <ul className="space-y-2">
                    {result.risk_warnings.map((w, i) => (
                      <li key={i} className="text-body-sm text-ink-secondary flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-status-warning rounded-full mt-1.5 shrink-0" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-brand rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <TrendingUp size={15} />3-Year Career Outlook
              </h3>
              <p className="text-white/80 text-body-sm">{result.career_outlook}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
