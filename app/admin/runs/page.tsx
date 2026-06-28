import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminLayout } from '@/components/layout/admin-layout'
import { Activity, CheckCircle2, XCircle, RefreshCw, Clock } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PipelineRun {
  id: string
  entity_name: string
  entity_type: string
  status: string
  pipeline_version: string
  ai_model_version: string | null
  requested_by: string | null
  started_at: string
  completed_at: string | null
  evidence_count: number | null
  event_count: number | null
  signal_count: number | null
  error_message: string | null
  current_step: string | null
  progress: number | null
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  queued:                { label: 'Queued',       dot: 'bg-ink-quaternary',    text: 'text-ink-tertiary',   bg: 'bg-surface-subdued'     },
  discovering:           { label: 'Discovering',  dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  verifying:             { label: 'Verifying',    dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  collecting:            { label: 'Collecting',   dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  extracting:            { label: 'Extracting',   dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  detecting_events:      { label: 'Events',       dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  generating_signals:    { label: 'Signals',      dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  running_engines:       { label: 'Engines',      dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  scoring:               { label: 'Scoring',      dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  generating_brief:      { label: 'Brief',        dot: 'bg-brand',             text: 'text-brand',          bg: 'bg-brand-light'         },
  completed:             { label: 'Completed',    dot: 'bg-status-success',    text: 'text-status-success', bg: 'bg-status-success-bg'   },
  insufficient_evidence: { label: 'Insufficient', dot: 'bg-status-warning',    text: 'text-status-warning', bg: 'bg-status-warning-bg'   },
  failed:                { label: 'Failed',       dot: 'bg-status-danger',     text: 'text-status-danger',  bg: 'bg-status-danger-bg'    },
  needs_user_clarification: { label: 'Clarify',  dot: 'bg-status-warning',    text: 'text-status-warning', bg: 'bg-status-warning-bg'   },
}

const TERMINAL = new Set(['completed', 'insufficient_evidence', 'failed', 'needs_user_clarification'])

function isActive(status: string) {
  return !TERMINAL.has(status)
}

function durationLabel(start: string, end: string | null): string {
  const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime()
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default async function PipelineMonitorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/runs')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const admin = createAdminClient()
  const { data: runs } = await admin
    .from('pipeline_runs')
    .select('id,entity_name,entity_type,status,pipeline_version,ai_model_version,requested_by,started_at,completed_at,evidence_count,event_count,signal_count,error_message,current_step,progress')
    .order('started_at', { ascending: false })
    .limit(200)

  const allRuns = (runs ?? []) as PipelineRun[]
  const activeRuns    = allRuns.filter(r => isActive(r.status))
  const completedRuns = allRuns.filter(r => r.status === 'completed')
  const failedRuns    = allRuns.filter(r => r.status === 'failed')

  return (
    <AdminLayout activePath="/admin/runs">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title-xl text-ink font-bold">Pipeline Monitor</h1>
          <p className="text-body-sm text-ink-secondary mt-1">{allRuns.length} total runs</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill label="Active" count={activeRuns.length} dot="bg-brand" />
          <StatusPill label="Done" count={completedRuns.length} dot="bg-status-success" />
          <StatusPill label="Failed" count={failedRuns.length} dot="bg-status-danger" />
        </div>
      </div>

      {/* Active Runs */}
      {activeRuns.length > 0 && (
        <RunSection
          title="Active Runs"
          icon={<Activity size={16} className="text-brand" />}
          runs={activeRuns}
          variant="active"
        />
      )}

      {/* Completed Runs */}
      {completedRuns.length > 0 && (
        <RunSection
          title="Completed"
          icon={<CheckCircle2 size={16} className="text-status-success" />}
          runs={completedRuns}
          variant="completed"
        />
      )}

      {/* Failed Runs */}
      {failedRuns.length > 0 && (
        <RunSection
          title="Failed Runs"
          icon={<XCircle size={16} className="text-status-danger" />}
          runs={failedRuns}
          variant="failed"
          bordered
        />
      )}

      {allRuns.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clock size={40} className="text-ink-quaternary mb-4" />
          <p className="text-title-sm text-ink">No pipeline runs yet</p>
          <p className="text-body-sm text-ink-tertiary mt-1">Runs will appear here once you start analysing companies</p>
          <Link href="/admin" className="mt-6 h-10 px-5 rounded-lg bg-brand text-white text-button font-semibold hover:bg-brand-hover transition-colors duration-fast inline-flex items-center">
            Go to Admin
          </Link>
        </div>
      )}
    </AdminLayout>
  )
}

function StatusPill({ label, count, dot }: { label: string; count: number; dot: string }) {
  return (
    <div className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-surface-elevated border border-divider text-caption">
      <span className={cn('w-2 h-2 rounded-full', dot)} />
      <span className="text-ink-secondary font-medium">{label}</span>
      <span className="text-ink font-bold">{count}</span>
    </div>
  )
}

function RunSection({
  title, icon, runs, variant, bordered
}: {
  title: string
  icon: React.ReactNode
  runs: PipelineRun[]
  variant: 'active' | 'completed' | 'failed'
  bordered?: boolean
}) {
  return (
    <section className={cn('mb-8', bordered && 'border border-status-danger/20 rounded-xl p-1')}>
      <div className="flex items-center gap-2 mb-3 px-1">
        {icon}
        <h2 className="text-title-sm text-ink font-semibold">{title}</h2>
        <span className="text-caption text-ink-tertiary ml-1">({runs.length})</span>
      </div>
      <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-divider">
              <Th>Company</Th>
              <Th>Status</Th>
              <Th className="hidden md:table-cell">Step</Th>
              {variant === 'active' && <Th className="hidden lg:table-cell">Progress</Th>}
              {variant === 'completed' && <Th className="hidden md:table-cell">Signals</Th>}
              {variant === 'failed' && <Th>Error</Th>}
              <Th className="hidden sm:table-cell">Duration</Th>
              <Th>Started</Th>
              {variant === 'failed' && <Th></Th>}
            </tr>
          </thead>
          <tbody>
            {runs.map((run, i) => {
              const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG.queued
              return (
                <tr key={run.id} className={cn('border-b border-divider last:border-0 hover:bg-surface-subdued/40 transition-colors duration-fast', i % 2 === 1 && 'bg-surface/30')}>
                  <td className="px-3 py-3">
                    <p className="text-body-sm text-ink font-medium">{run.entity_name}</p>
                    <p className="text-caption text-ink-quaternary capitalize">{run.entity_type}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-caption font-medium', cfg.bg, cfg.text)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot, isActive(run.status) && 'animate-pulse')} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <p className="text-caption text-ink-secondary">{run.current_step ?? '—'}</p>
                  </td>
                  {variant === 'active' && (
                    <td className="px-3 py-3 hidden lg:table-cell w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-subdued rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full transition-all duration-slow"
                            style={{ width: `${run.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-caption text-ink-quaternary w-8 text-right">{run.progress ?? 0}%</span>
                      </div>
                    </td>
                  )}
                  {variant === 'completed' && (
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-body-sm text-ink-secondary">{run.signal_count ?? '—'}</span>
                    </td>
                  )}
                  {variant === 'failed' && (
                    <td className="px-3 py-3 max-w-[200px]">
                      <p className="text-caption text-status-danger truncate">{run.error_message ?? 'Unknown error'}</p>
                    </td>
                  )}
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className="text-caption text-ink-tertiary">{durationLabel(run.started_at, run.completed_at)}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-caption text-ink-quaternary">{timeAgo(run.started_at)}</span>
                  </td>
                  {variant === 'failed' && (
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin?retry=${run.id}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-caption text-brand border border-brand/20 hover:bg-brand-light transition-colors duration-fast"
                      >
                        <RefreshCw size={11} />
                        Retry
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-3 py-2.5 text-caption uppercase tracking-[0.05em] text-ink-tertiary font-semibold', className)}>
      {children}
    </th>
  )
}
