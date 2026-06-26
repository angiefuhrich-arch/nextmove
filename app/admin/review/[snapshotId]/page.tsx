'use client'
import { use, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ArrowLeft, CheckCircle2, XCircle, Edit2, Save, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SignalScore {
  id: string
  signal_name: string
  score: number
  confidence: number
  reasoning: string
  review_status: string
  admin_override_score: number | null
  admin_notes: string | null
}

interface Source {
  id: string
  source_type: string
  source_title: string
  source_url: string
  reliability_score: number
  published_date: string | null
  raw_text: string
}

interface Snapshot {
  id: string
  status: string
  scarsian_score: number
  career_growth_score: number
  career_risk_score: number
  market_value_score: number
  career_fit_score: number
  gfi_score: number
  career_alpha: number
  confidence_score: number
  verdict: string
  analyst_note: string
  created_at: string
  approved_at: string | null
}

const SIGNAL_LABELS: Record<string, string> = {
  // CGS
  promotion_velocity: 'Promotion Velocity',
  skill_transferability: 'Skill Transferability',
  network_multiplier: 'Network Multiplier',
  // CRS
  layoff_resilience: 'Layoff Resilience',
  reputation_safety: 'Reputation Safety',
  financial_stability: 'Financial Stability',
  // MVS
  badge_premium: 'Badge Premium',
  talent_magnetism: 'Talent Magnetism',
  sector_optionality: 'Sector Optionality',
  // CFS
  culture_alignment: 'Culture Alignment',
  // GFI
  communication_accessibility: 'Communication Accessibility',
  visa_accessibility: 'Visa Accessibility',
  international_leadership: 'International Leadership',
  expat_retention: 'Expat Retention',
  language_accessibility: 'Language Accessibility',
  regional_autonomy: 'Regional Autonomy',
  // Adjustment
  momentum_score: 'Momentum Score (50=neutral)',
  volatility_score: 'Volatility Score (0=stable)',
  // Confidence inputs
  evidence_coverage: 'Evidence Coverage',
  data_freshness: 'Data Freshness',
  cross_source_agreement: 'Cross-Source Agreement',
  sample_reliability: 'Sample Reliability',
  // Legacy labels (kept for backward compat)
  financial_runway: 'Financial Runway',
  ladder_speed: 'Ladder Speed',
  skill_depreciation_risk: 'Skill Depreciation Risk',
  layoff_convexity: 'Layoff Convexity',
  reputation_stain_risk: 'Reputation Stain Risk',
  cultural_velocity_match: 'Cultural Velocity Match',
  global_mobility_index: 'Global Mobility Index',
  english_working_language: 'English Working Language',
  visa_sponsorship_history: 'Visa Sponsorship History',
  international_leadership_ratio: 'International Leadership',
  expat_retention_rate: 'Expat Retention Rate',
  cantonese_requirement_level: 'Cantonese Requirement',
  regional_office_culture: 'Regional Office Culture',
}

const SIGNAL_GROUPS: Record<string, string[]> = {
  'Career Growth Score (CGS)': ['promotion_velocity', 'skill_transferability', 'network_multiplier'],
  'Career Risk Score (CRS)': ['layoff_resilience', 'reputation_safety', 'financial_stability'],
  'Market Value Score (MVS)': ['badge_premium', 'talent_magnetism', 'sector_optionality'],
  'Career Fit Score (CFS)': ['culture_alignment'],
  'Global Fit Index (GFI)': ['communication_accessibility', 'visa_accessibility', 'international_leadership', 'expat_retention', 'language_accessibility', 'regional_autonomy'],
  'Adjustment Layer': ['momentum_score', 'volatility_score'],
  'Confidence Inputs': ['evidence_coverage', 'data_freshness', 'cross_source_agreement', 'sample_reliability'],
}

function ScoreBar({ score, confidence }: { score: number; confidence: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-900 w-8 text-right">{score}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-300 rounded-full" style={{ width: `${confidence}%` }} />
        </div>
        <span className="text-xs text-slate-400">{confidence}% conf</span>
      </div>
    </div>
  )
}

export default function ReviewPage({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = use(params)
  const router = useRouter()

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [signals, setSignals] = useState<SignalScore[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [companyName, setCompanyName] = useState('')
  const [companySlug, setCompanySlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState('')
  const [editingScore, setEditingScore] = useState<string | null>(null)
  const [overrideValue, setOverrideValue] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')
  const [showSources, setShowSources] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()

    const { data: snap } = await supabase
      .from('company_score_snapshots')
      .select('*, companies(name, slug)')
      .eq('id', snapshotId)
      .single()

    if (!snap) { setLoading(false); return }

    const company = snap.companies as { name: string; slug: string } | null
    setCompanyName(company?.name ?? '')
    setCompanySlug(company?.slug ?? '')
    setSnapshot(snap as Snapshot)
    setNote(snap.analyst_note ?? '')

    const { data: sigs } = await supabase
      .from('company_signal_scores')
      .select('*')
      .eq('snapshot_id', snapshotId)
      .order('signal_name')

    setSignals(sigs ?? [])

    if (snap.company_id) {
      const { data: srcs } = await supabase
        .from('company_sources')
        .select('*')
        .eq('company_id', snap.company_id)
        .order('reliability_score', { ascending: false })
      setSources(srcs ?? [])
    }

    setLoading(false)
  }, [snapshotId])

  useEffect(() => { load() }, [load])

  const handleAction = async (action: 'approve' | 'reject') => {
    setActing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/snapshots/${snapshotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) { setError('Action failed'); setActing(false); return }
      router.push('/admin')
    } catch {
      setError('Network error')
      setActing(false)
    }
  }

  const saveNote = async () => {
    const res = await fetch(`/api/admin/snapshots/${snapshotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_note', note }),
    })
    if (res.ok) setEditingNote(false)
  }

  const saveOverride = async (scoreId: string) => {
    const val = parseInt(overrideValue)
    if (isNaN(val) || val < 0 || val > 100) return
    const res = await fetch(`/api/admin/scores/${scoreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_override_score: val, admin_notes: overrideNotes }),
    })
    if (res.ok) {
      setEditingScore(null)
      setSignals(prev => prev.map(s => s.id === scoreId
        ? { ...s, admin_override_score: val, admin_notes: overrideNotes, review_status: 'overridden' }
        : s
      ))
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading review...</div>
      </DashboardLayout>
    )
  }

  if (!snapshot) {
    return (
      <DashboardLayout>
        <div className="text-slate-500 text-sm">Report not found.</div>
      </DashboardLayout>
    )
  }

  const isDraft = snapshot.status === 'draft'
  const verdictColor = snapshot.verdict === 'strong' ? 'text-green-600 bg-green-50 border-green-200'
    : snapshot.verdict === 'no-go' ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-amber-600 bg-amber-50 border-amber-200'

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-3">
              <ArrowLeft size={14} />
              Back to Admin
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{companyName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${verdictColor}`}>
                {snapshot.verdict.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400">
                {snapshot.status === 'draft' ? 'Draft — pending review' :
                  snapshot.status === 'approved' ? `Approved ${snapshot.approved_at ? new Date(snapshot.approved_at).toLocaleDateString() : ''}` :
                  'Rejected'}
              </span>
            </div>
          </div>
          {isDraft && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleAction('reject')}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle size={15} />
                Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={acting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                Approve & Publish
              </button>
            </div>
          )}
          {!isDraft && companySlug && (
            <Link
              href={`/company/${companySlug}`}
              className="text-sm text-slate-500 hover:text-slate-900 underline"
            >
              View published report →
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Score summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Calculated Scores</h2>
            {snapshot.confidence_score < 50 && (
              <span className="text-xs font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={11} />
                Insufficient Data — score will not display publicly
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Scarsian Index', value: snapshot.scarsian_score, highlight: true },
              { label: 'Career Growth (CGS)', value: snapshot.career_growth_score },
              { label: 'Career Risk (CRS)', value: snapshot.career_risk_score },
              { label: 'Market Value (MVS)', value: snapshot.market_value_score },
              { label: 'Career Fit (CFS)', value: snapshot.career_fit_score },
              { label: 'GFI Score', value: snapshot.gfi_score },
              { label: 'Career Alpha', value: snapshot.career_alpha, signed: true },
              { label: 'Confidence', value: snapshot.confidence_score, pct: true },
            ].map(({ label, value, highlight, signed, pct }) => (
              <div key={label} className={`rounded-lg p-3 ${highlight ? 'bg-slate-900 text-white' : 'bg-slate-50'}`}>
                <p className={`text-xs mb-1 ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-slate-900'}`}>
                  {snapshot.confidence_score < 50 && highlight
                    ? 'N/A'
                    : `${signed && value > 0 ? '+' : ''}${value}${pct ? '%' : ''}`}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <AlertTriangle size={11} />
            All scores are calculated by the backend formula. AI never computes the final score. Admin overrides are applied before recalculation on approval.
          </p>
        </div>

        {/* Analyst Note */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Analyst Note</h2>
            {!editingNote ? (
              <button onClick={() => setEditingNote(true)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
                <Edit2 size={12} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={saveNote} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium">
                  <Save size={12} /> Save
                </button>
                <button onClick={() => setEditingNote(false)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
          </div>
          {editingNote ? (
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          ) : (
            <p className="text-sm text-slate-600 leading-relaxed">{note || 'No analyst note.'}</p>
          )}
        </div>

        {/* Signal Scores */}
        {Object.entries(SIGNAL_GROUPS).map(([groupName, signalNames]) => {
          const groupSignals = signals.filter(s => signalNames.includes(s.signal_name))
          if (groupSignals.length === 0) return null
          return (
            <div key={groupName} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">{groupName}</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {groupSignals.map(sig => {
                  const effectiveScore = sig.review_status === 'overridden' && sig.admin_override_score != null
                    ? sig.admin_override_score
                    : sig.score
                  const isEditing = editingScore === sig.id

                  return (
                    <div key={sig.id} className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-900">
                              {SIGNAL_LABELS[sig.signal_name] ?? sig.signal_name}
                            </span>
                            {sig.review_status === 'overridden' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                Admin override: {sig.admin_override_score} (AI: {sig.score})
                              </span>
                            )}
                          </div>
                          <ScoreBar score={effectiveScore} confidence={sig.confidence} />
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sig.reasoning}</p>
                          {sig.admin_notes && (
                            <p className="text-xs text-blue-600 mt-1 italic">Admin: {sig.admin_notes}</p>
                          )}
                        </div>
                        {isDraft && !isEditing && (
                          <button
                            onClick={() => {
                              setEditingScore(sig.id)
                              setOverrideValue(String(effectiveScore))
                              setOverrideNotes(sig.admin_notes ?? '')
                            }}
                            className="shrink-0 text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 mt-1"
                          >
                            <Edit2 size={11} /> Override
                          </button>
                        )}
                      </div>
                      {isEditing && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-blue-800 w-24">New score (0–100)</label>
                            <input
                              type="number"
                              min={0} max={100}
                              value={overrideValue}
                              onChange={e => setOverrideValue(e.target.value)}
                              className="w-20 border border-blue-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-blue-800 w-24">Admin note</label>
                            <input
                              type="text"
                              value={overrideNotes}
                              onChange={e => setOverrideNotes(e.target.value)}
                              placeholder="Reason for override..."
                              className="flex-1 border border-blue-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveOverride(sig.id)}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700"
                            >
                              Save Override
                            </button>
                            <button
                              onClick={() => setEditingScore(null)}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Sources */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources(!showSources)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 text-left"
          >
            <h2 className="text-sm font-semibold text-slate-900">Evidence Sources ({sources.length})</h2>
            {showSources ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>
          {showSources && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {sources.length === 0 ? (
                <p className="px-6 py-4 text-sm text-slate-400">No sources recorded.</p>
              ) : sources.map(src => (
                <div key={src.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {src.source_type}
                        </span>
                        <span className="text-xs text-slate-400">{src.reliability_score}/100 reliability</span>
                        {src.published_date && (
                          <span className="text-xs text-slate-400">{src.published_date}</span>
                        )}
                      </div>
                      <a
                        href={src.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline truncate block"
                      >
                        {src.source_title}
                      </a>
                      {src.raw_text && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{src.raw_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom approve/reject */}
        {isDraft && (
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={15} />
              Reject Report
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={acting}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              Approve & Publish
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
