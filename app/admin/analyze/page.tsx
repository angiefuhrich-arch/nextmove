'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import Link from 'next/link'

const MARKETS = [
  'Hong Kong', 'Singapore', 'United Kingdom', 'United States', 'Australia',
  'Germany', 'Japan', 'Canada', 'UAE', 'Global',
]

export default function AnalyzePage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [market, setMarket] = useState('Hong Kong')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) return

    setLoading(true)
    setError('')
    setStatus('Collecting public data sources...')

    try {
      const res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: companyName.trim(), market }),
      })

      setStatus('Analyzing signals with AI...')
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed')
        setLoading(false)
        return
      }

      setStatus('Done! Redirecting to review...')
      router.push(`/admin/review/${data.snapshotId}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg">
        <div className="mb-6">
          <Link href="/admin" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft size={14} />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Analyze Company</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter a company name and market. The pipeline will collect public data, analyze signals with AI, and generate a draft report for your review.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="e.g. HSBC, Airwallex, Goldman Sachs"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Market / Region</label>
            <select
              value={market}
              onChange={e => setMarket(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              disabled={loading}
            >
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Used to contextualize international fit scores</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && status && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin shrink-0" />
              {status}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
            <strong>Note:</strong> AI proposes scores based on public data only. All scores require your review and approval before publishing.
          </div>

          <button
            type="submit"
            disabled={loading || !companyName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing... (30–60 seconds)
              </>
            ) : (
              <>
                <Search size={16} />
                Analyze Company
              </>
            )}
          </button>
        </form>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">Pipeline steps:</p>
          <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
            <li>Collect data from Wikipedia, Brave Search, NewsAPI</li>
            <li>Save raw sources to Supabase</li>
            <li>AI analyzes evidence → proposes 17 signal scores</li>
            <li>Backend formula calculates Scarsian Index (no AI)</li>
            <li>AI generates editable analyst note</li>
            <li>Draft saved — you review and approve</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  )
}
