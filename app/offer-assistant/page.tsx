'use client'
import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
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
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offer Decision Assistant</h1>
          <p className="text-slate-500 text-sm mt-1">Input your offer details and get AI-powered accept/negotiate/decline guidance.</p>
        </div>

        <form onSubmit={analyze} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="e.g. Google" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Title</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="e.g. Senior Engineer" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Offered Salary (USD)</label>
              <input
                type="number"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.salary} onChange={e => set('salary', e.target.value)}
                placeholder="150000" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Salary (USD)</label>
              <input
                type="number"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.currentSalary} onChange={e => set('currentSalary', e.target.value)}
                placeholder="120000" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.location} onChange={e => set('location', e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Mode</label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={form.workMode} onChange={e => set('workMode', e.target.value)}
              >
                {WORK_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Top Priority</label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set('priority', p)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                    form.priority === p
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" />Analyzing offer...</> : <><Briefcase size={16} />Analyze My Offer</>}
          </button>
        </form>

        {result && (
          <div className="space-y-4">
            {/* Main recommendation */}
            <div className={`rounded-xl border-2 p-6 ${recColors[result.recommendation].bg}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-3xl font-bold ${recColors[result.recommendation].text}`}>
                  {recColors[result.recommendation].label}
                </div>
              </div>
              <p className="text-slate-700">{result.explanation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {result.negotiation_tips.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-500" />
                    Negotiation Tips
                  </h3>
                  <ul className="space-y-2">
                    {result.negotiation_tips.map((tip, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.risk_warnings.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-yellow-500" />
                    Risk Warnings
                  </h3>
                  <ul className="space-y-2">
                    {result.risk_warnings.map((w, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-1.5 shrink-0" />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <TrendingUp size={15} />3-Year Career Outlook
              </h3>
              <p className="text-slate-300 text-sm">{result.career_outlook}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
