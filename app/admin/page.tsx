import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminLayout } from '@/components/layout/admin-layout'
import Link from 'next/link'
import { CheckCircle2, Clock, XCircle, ChevronRight, Activity, Database, FileSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const admin = createAdminClient()

  const [
    { data: snapshots },
    { count: entityCount },
    { count: evidenceCount },
    { data: recentRuns },
  ] = await Promise.all([
    admin
      .from('scarsian_snapshots')
      .select('id, status, scarsian_index, confidence, verdict, created_at, approved_at, entity_id, entities(name, slug, metadata)')
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('entities').select('*', { count: 'exact', head: true }),
    admin.from('evidence_records').select('*', { count: 'exact', head: true }),
    admin.from('pipeline_runs').select('id,entity_name,status,started_at').order('started_at', { ascending: false }).limit(5),
  ])

  const drafts = snapshots?.filter(s => s.status === 'draft').length ?? 0
  const approved = snapshots?.filter(s => s.status === 'approved').length ?? 0
  const rejected = snapshots?.filter(s => s.status === 'rejected').length ?? 0

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 size={14} className="text-status-success" />
    if (status === 'rejected') return <XCircle size={14} className="text-status-danger" />
    return <Clock size={14} className="text-status-warning" />
  }

  const statusCls = (status: string) => {
    if (status === 'approved') return 'bg-status-success-bg text-status-success'
    if (status === 'rejected') return 'bg-status-danger-bg text-status-danger'
    return 'bg-status-warning-bg text-status-warning'
  }

  return (
    <AdminLayout activePath="/admin">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-title-xl text-ink font-bold">Admin Overview</h1>
          <p className="text-body-sm text-ink-secondary mt-1">Intelligence Center operations dashboard</p>
        </div>
        <Link
          href="/admin/runs"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-brand text-white text-button font-semibold hover:bg-brand-hover transition-colors duration-fast"
        >
          <Activity size={15} />
          Pipeline Monitor
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Entities', value: entityCount ?? 0, icon: Database, color: 'text-ink' },
          { label: 'Pending Review', value: drafts, icon: Clock, color: 'text-status-warning' },
          { label: 'Published Briefs', value: approved, icon: CheckCircle2, color: 'text-status-success' },
          { label: 'Evidence Records', value: evidenceCount ?? 0, icon: FileSearch, color: 'text-brand' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-elevated border border-divider rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <p className="text-caption text-ink-tertiary">{label}</p>
            </div>
            <p className={cn('text-title-lg font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent pipeline runs */}
      {recentRuns && recentRuns.length > 0 && (
        <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-card mb-8">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-divider">
            <h2 className="text-body-sm font-semibold text-ink">Recent Pipeline Runs</h2>
            <Link href="/admin/runs" className="text-caption text-brand hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-divider">
            {recentRuns.map(run => (
              <div key={run.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-ink font-medium truncate">{run.entity_name}</p>
                  <p className="text-caption text-ink-quaternary">{new Date(run.started_at).toLocaleString()}</p>
                </div>
                <span className={cn('text-caption font-medium px-2 py-0.5 rounded-full', statusCls(run.status))}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshots pending review */}
      <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-card">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-divider">
          <h2 className="text-body-sm font-semibold text-ink">Intelligence Briefs</h2>
          <div className="flex items-center gap-3 text-caption text-ink-tertiary">
            <span>{drafts} pending</span>
            <span>·</span>
            <span>{approved} approved</span>
            <span>·</span>
            <span>{rejected} rejected</span>
          </div>
        </div>
        {!snapshots || snapshots.length === 0 ? (
          <div className="p-12 text-center text-ink-tertiary">
            <p className="text-body-sm">No Intelligence Briefs yet. Run the pipeline to generate them.</p>
          </div>
        ) : (
          <div className="divide-y divide-divider">
            {snapshots.map((snapshot) => {
              const entity = Array.isArray(snapshot.entities) ? snapshot.entities[0] : snapshot.entities as { name: string; slug: string; metadata?: { industry?: string } } | null
              return (
                <Link
                  key={snapshot.id}
                  href={`/admin/review/${snapshot.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-subdued transition-colors duration-fast group"
                >
                  <div className="w-8 h-8 bg-surface-subdued border border-divider rounded-lg flex items-center justify-center text-ink-secondary font-bold text-label shrink-0">
                    {entity?.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-ink truncate">{entity?.name ?? 'Unknown'}</p>
                    <p className="text-caption text-ink-quaternary">{entity?.metadata?.industry ?? ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {snapshot.scarsian_index != null && (
                      <span className="text-body-sm font-bold text-ink tabular-nums">{snapshot.scarsian_index}</span>
                    )}
                    {snapshot.confidence != null && (
                      <span className="text-caption text-ink-tertiary">{snapshot.confidence}% conf</span>
                    )}
                    <span className={cn('flex items-center gap-1 text-caption font-medium px-2 py-0.5 rounded-full', statusCls(snapshot.status))}>
                      {statusIcon(snapshot.status)}
                      {snapshot.status}
                    </span>
                    <span className="text-caption text-ink-quaternary">
                      {new Date(snapshot.created_at).toLocaleDateString()}
                    </span>
                    <ChevronRight size={14} className="text-ink-quaternary group-hover:text-brand transition-colors duration-fast" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
