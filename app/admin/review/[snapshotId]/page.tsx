'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  ArrowLeft, CheckCircle2, XCircle, Edit2, Save, X, AlertTriangle,
  ChevronDown, ChevronUp, ExternalLink, Shield,
} from 'lucide-react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'

interface SnapshotData {
  id: string
  entity_id: string
  status: string
  scarsian_score: number
  cgs_score: number | null
  crs_score: number | null
  mvs_score: number | null
  cfs_score: number | null
  gfi_score: number | null
  confidence_score: number
  verdict: string | null
  analyst_note: string | null
  created_at: string
  approved_at: string | null
  insufficient_data: boolean | null
}

interface SignalItem {
  id: string
  signal_name: string | null
  category: string
  direction: string
  magnitude: number
  confidence: number | null
  explanation: string
  created_at: string
}

interface EvidenceItem {
  id: string
  evidence_type: string
  content_summary: string | null
  source_url: string | null
  source_title: string | null
  source_type: string
  evidence_date: string | null
  collected_at: string
}

interface EntityData {
  name: string
  slug: string
  metadata: Record<string, string> | null
}

const SCORE_DIMS: Array<{ key: keyof SnapshotData; label: string }> = [
  { key: 'cgs_score', label: 'Culture & Growth' },
  { key: 'crs_score', label: 'Comp & Retention' },
  { key: 'mvs_score', label: 'Mission & Vision' },
  { key: 'cfs_score', label: 'Career Fit' },
  { key: 'gfi_score', label: 'GFI' },
]

function ScoreBar({ score }: { score: number }) {
  const colorClass = score >= 70 ? 'bg-status-success' : score >= 45 ? 'bg-status-warning' : 'bg-status-danger'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-surface-subdued rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', colorClass)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-body-sm font-bold text-ink w-8 text-right tabular-nums">{score}</span>
    </div>
  )
}

function statusClasses(status: string) {
  if (status === 'approved') return 'bg-status-success-bg text-status-success border-status-success/20'
  if (status === 'rejected') return 'bg-status-danger-bg text-status-danger border-status-danger/20'
  return 'bg-status-warning-bg text-status-warning border-status-warning/20'
}

export default function ReviewPage({ params }: { params: Promise<{ snapshotId: string }> }) {
  const { snapshotId } = use(params)
  const router = useRouter()

  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null)
  const [entity, setEntity] = useState<EntityData | null>(null)
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState('')
  const [showEvidence, setShowEvidence] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [refreshKey] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: snap } = await supabase
        .from('scarsian_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single()

      if (!active) return
      if (!snap) { setLoading(false); return }
      setSnapshot(snap as SnapshotData)
      setNote(snap.analyst_note ?? '')

      const { data: entityData } = await supabase
        .from('entities')
        .select('name, slug, metadata')
        .eq('id', snap.entity_id)
        .single()
      if (!active) return
      if (entityData) setEntity(entityData as EntityData)

      const [{ data: sigs }, { data: evs }] = await Promise.all([
        supabase.from('intelligence_signals')
          .select('id,signal_name,category,direction,magnitude,confidence,explanation,created_at')
          .eq('entity_id', snap.entity_id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('evidence_records')
          .select('id,evidence_type,content_summary,source_url,source_title,source_type,evidence_date,collected_at')
          .eq('entity_id', snap.entity_id)
          .order('collected_at', { ascending: false })
          .limit(30),
      ])

      if (!active) return
      setSignals((sigs ?? []) as SignalItem[])
      setEvidence((evs ?? []) as EvidenceItem[])
      setLoading(false)
    })()
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, refreshKey])

  const handleAction = async (action: 'approve' | 'reject') => {
    setActing(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/briefs/${snapshotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, analystNote: note || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Action failed')
        setActing(false)
        return
      }
      router.push('/admin')
    } catch {
      setError('Network error')
      setActing(false)
    }
  }

  const saveNote = async () => {
    const res = await fetch(`/api/admin/briefs/${snapshotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_note', note }),
    })
    if (res.ok) setEditingNote(false)
  }

  if (loading) {
    return (
      <AdminLayout activePath="/admin">
        <div className="flex items-center justify-center h-64 text-ink-tertiary text-body-sm">Loading…</div>
      </AdminLayout>
    )
  }

  if (!snapshot) {
    return (
      <AdminLayout activePath="/admin">
        <div className="text-ink-tertiary text-body-sm">Intelligence Brief not found.</div>
      </AdminLayout>
    )
  }

  const isDraft = snapshot.status === 'draft'
  const confidencePct = Math.round((snapshot.confidence_score ?? 0) * 100)
  const categories = Array.from(new Set(signals.map(s => s.category)))

  return (
    <AdminLayout activePath="/admin">
      <div className="max-w-[860px] space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin" className="flex items-center gap-1.5 text-caption text-ink-tertiary hover:text-brand transition-colors duration-fast mb-4">
              <ArrowLeft size={13} />
              Back to Admin
            </Link>
            <h1 className="text-title-lg text-ink font-bold">{entity?.name ?? 'Unknown employer'}</h1>
            <div className="flex items-center gap-3 mt-2">
              {entity?.metadata?.industry && (
                <span className="text-caption text-ink-tertiary">{entity.metadata.industry}</span>
              )}
              <span className={cn('text-caption font-semibold px-2 py-0.5 rounded-full border', statusClasses(snapshot.status))}>
                {snapshot.status}
              </span>
              {snapshot.approved_at && (
                <span className="text-caption text-ink-quaternary">
                  Approved {new Date(snapshot.approved_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {isDraft && (
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => handleAction('reject')}
                disabled={acting}
                className="flex items-center gap-1.5 h-9 px-4 border border-status-danger/30 text-status-danger rounded-lg text-button font-medium hover:bg-status-danger-bg disabled:opacity-50 transition-colors duration-fast"
              >
                <XCircle size={14} />
                Reject
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={acting}
                className="flex items-center gap-1.5 h-9 px-4 bg-status-success text-white rounded-lg text-button font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity duration-fast"
              >
                <CheckCircle2 size={14} />
                Approve & Publish
              </button>
            </div>
          )}

          {!isDraft && entity?.slug && (
            <Link
              href={`/brief/${entity.slug}`}
              className="flex items-center gap-1.5 text-caption text-brand hover:underline mt-2"
            >
              View published Brief
              <ExternalLink size={12} />
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-status-danger-bg border border-status-danger/20 rounded-xl px-4 py-3 text-body-sm text-status-danger flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Score summary */}
        <div className="bg-surface-elevated border border-divider rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-body-sm font-semibold text-ink">Scarsian Index</h2>
            {snapshot.insufficient_data && (
              <span className="text-caption font-semibold bg-status-danger-bg text-status-danger border border-status-danger/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle size={11} />
                Insufficient Data — will not publish
              </span>
            )}
          </div>

          {/* Main score */}
          <div className="flex items-center gap-6 mb-6">
            <div className="text-[56px] font-bold text-ink leading-none tabular-nums">
              {snapshot.scarsian_score}
            </div>
            <div>
              <div className="text-body-sm font-semibold text-ink mb-1">{snapshot.verdict ?? 'No verdict'}</div>
              <div className="text-caption text-ink-tertiary">Evidence Confidence: {confidencePct}%</div>
            </div>
          </div>

          {/* Dimension bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SCORE_DIMS.map(({ key, label }) => {
              const raw = snapshot[key] as number | null
              if (raw === null) return null
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-caption text-ink-tertiary">{label}</span>
                  </div>
                  <ScoreBar score={Math.round(raw)} />
                </div>
              )
            })}
          </div>

          <p className="text-caption text-ink-quaternary mt-5 flex items-center gap-1.5">
            <Shield size={11} />
            Scores calculated by the backend formula engine. AI interprets structured intelligence only — it never computes scores directly.
          </p>
        </div>

        {/* Analyst Note */}
        <div className="bg-surface-elevated border border-divider rounded-xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-body-sm font-semibold text-ink">Analyst Note</h2>
            {!editingNote ? (
              <button onClick={() => setEditingNote(true)} className="flex items-center gap-1 text-caption text-ink-tertiary hover:text-brand transition-colors duration-fast">
                <Edit2 size={12} /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={saveNote} className="flex items-center gap-1 text-caption text-status-success hover:opacity-80 font-medium">
                  <Save size={12} /> Save
                </button>
                <button onClick={() => setEditingNote(false)} className="flex items-center gap-1 text-caption text-ink-tertiary hover:text-ink">
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
              className="w-full border border-divider rounded-xl px-3 py-2.5 text-body-sm text-ink bg-surface-subdued focus:outline-none focus:border-brand transition-colors"
              placeholder="Add analyst note…"
            />
          ) : (
            <p className="text-body-sm text-ink-secondary leading-relaxed">{note || 'No analyst note.'}</p>
          )}
        </div>

        {/* Signals by category */}
        {signals.length > 0 && (
          <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-card">
            <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
              <h2 className="text-body-sm font-semibold text-ink">Intelligence Signals</h2>
              <span className="text-caption text-ink-tertiary">{signals.length} signals</span>
            </div>
            {categories.map(cat => {
              const catSignals = signals.filter(s => s.category === cat)
              return (
                <div key={cat}>
                  <div className="px-5 py-2 bg-surface-subdued/50 border-b border-divider">
                    <span className="text-label uppercase tracking-widest text-ink-tertiary font-semibold">{cat}</span>
                  </div>
                  {catSignals.map(sig => {
                    const dirColor = sig.direction === 'positive' ? 'text-status-success' : sig.direction === 'negative' ? 'text-status-danger' : 'text-status-warning'
                    const dotColor = sig.direction === 'positive' ? 'bg-status-success' : sig.direction === 'negative' ? 'bg-status-danger' : 'bg-status-warning'
                    return (
                      <div key={sig.id} className="flex items-start gap-3 px-5 py-3 border-b border-divider last:border-0 hover:bg-surface-subdued/30 transition-colors">
                        <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', dotColor)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm text-ink-secondary leading-snug">{sig.explanation}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {sig.signal_name && <span className="text-caption text-ink-quaternary">{sig.signal_name}</span>}
                            <span className="text-caption text-ink-quaternary">
                              {new Date(sig.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <span className={cn('text-body-sm font-bold tabular-nums flex-shrink-0', dirColor)}>
                          {sig.magnitude}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Evidence records (collapsible) */}
        <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-card">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-subdued/30 transition-colors text-left"
          >
            <h2 className="text-body-sm font-semibold text-ink">Evidence Records ({evidence.length})</h2>
            {showEvidence ? <ChevronUp size={15} className="text-ink-quaternary" /> : <ChevronDown size={15} className="text-ink-quaternary" />}
          </button>
          {showEvidence && (
            <div className="border-t border-divider divide-y divide-divider">
              {evidence.length === 0 ? (
                <p className="px-5 py-6 text-body-sm text-ink-tertiary">No evidence records.</p>
              ) : evidence.map(ev => (
                <div key={ev.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-label px-2 py-0.5 rounded-full bg-surface-subdued text-ink-tertiary border border-divider capitalize">
                          {ev.evidence_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-caption text-ink-quaternary">
                          {ev.evidence_date
                            ? new Date(ev.evidence_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            : new Date(ev.collected_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-body-sm text-ink-secondary leading-snug">{ev.content_summary}</p>
                      {ev.source_url && (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-caption text-brand hover:underline mt-1"
                        >
                          <ExternalLink size={10} />
                          {ev.source_title ?? ev.source_url}
                        </a>
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
          <div className="flex items-center justify-end gap-3 pt-2 pb-10">
            <button
              onClick={() => handleAction('reject')}
              disabled={acting}
              className="flex items-center gap-1.5 h-10 px-5 border border-status-danger/30 text-status-danger rounded-xl text-button font-medium hover:bg-status-danger-bg disabled:opacity-50 transition-colors duration-fast"
            >
              <XCircle size={14} />
              Reject
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={acting}
              className="flex items-center gap-1.5 h-10 px-5 bg-status-success text-white rounded-xl text-button font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity duration-fast"
            >
              <CheckCircle2 size={14} />
              Approve & Publish
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
