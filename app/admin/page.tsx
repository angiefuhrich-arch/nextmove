import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminLayout } from '@/components/layout/admin-layout'
import {
  Activity, AlertTriangle, BarChart2, CheckCircle, Clock,
  Database, DollarSign, RefreshCw, Search, Shield, TrendingUp, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')
}

function StatCard({
  label, value, sub, icon: Icon, accent = false, warning = false,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: boolean; warning?: boolean
}) {
  return (
    <div className={cn(
      'bg-white border rounded-xl p-5 flex items-start gap-4',
      warning ? 'border-status-warning/40' : 'border-divider',
    )}>
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        accent  ? 'bg-brand-light'        : '',
        warning ? 'bg-status-warning/10'  : '',
        !accent && !warning ? 'bg-surface-subdued' : '',
      )}>
        <Icon className={cn(
          'w-4 h-4',
          accent  ? 'text-brand'          : '',
          warning ? 'text-status-warning' : '',
          !accent && !warning ? 'text-ink-tertiary' : '',
        )} />
      </div>
      <div className="min-w-0">
        <p className="text-label uppercase tracking-widest text-ink-quaternary mb-0.5">{label}</p>
        <p className="text-[22px] font-bold text-ink leading-none">{value}</p>
        {sub && <p className="text-caption text-ink-quaternary mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default async function AdminDashboard() {
  await requireAdmin()
  const admin = createAdminClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [
    entitiesResult,
    pendingSnapshotsResult,
    approvedSnapshotsResult,
    evidenceCountResult,
    todaySearchesResult,
    cacheHitsResult,
    todayRunsResult,
    failedRunsResult,
    refreshQueueResult,
    revenueResult,
    avgConfidenceResult,
    avgDurationResult,
    aiCostTodayResult,
    recentFailuresResult,
    pendingSourcesResult,
  ] = await Promise.all([
    admin.from('entities').select('id', { count: 'exact', head: true }),
    admin.from('scarsian_snapshots').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('scarsian_snapshots').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('evidence_records').select('id', { count: 'exact', head: true }),
    admin.from('entity_search_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    admin.from('entity_search_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayISO).eq('cache_hit', true),
    admin.from('pipeline_runs').select('id', { count: 'exact', head: true }).gte('started_at', todayISO),
    admin.from('pipeline_runs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    (async () => { try { return await admin.from('refresh_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending') } catch { return { count: 0 } } })(),
    admin.from('credit_transactions').select('amount').eq('transaction_type', 'purchase').gte('created_at', todayISO),
    admin.from('scarsian_snapshots').select('confidence_score').eq('status', 'approved').limit(200),
    admin.from('pipeline_runs').select('started_at,completed_at').eq('status', 'completed').gte('started_at', todayISO).limit(50),
    (async () => { try { return await admin.from('pipeline_runs').select('ai_cost_estimate').gte('started_at', todayISO).not('ai_cost_estimate', 'is', null) } catch { return { data: [] } } })(),
    admin.from('pipeline_runs')
      .select('id,entity_slug,entity_name,error_message,started_at')
      .eq('status', 'failed')
      .order('started_at', { ascending: false })
      .limit(5),
    (async () => { try { return await admin.from('user_submitted_sources').select('id', { count: 'exact', head: true }).eq('status', 'pending') } catch { return { count: 0 } } })(),
  ])

  const totalEntities   = entitiesResult.count ?? 0
  const pendingReview   = pendingSnapshotsResult.count ?? 0
  const publishedBriefs = approvedSnapshotsResult.count ?? 0
  const evidenceCount   = evidenceCountResult.count ?? 0
  const todaySearches   = todaySearchesResult.count ?? 0
  const todayCacheHits  = cacheHitsResult.count ?? 0
  const todayRuns       = todayRunsResult.count ?? 0
  const totalFailed     = failedRunsResult.count ?? 0
  const refreshQueue    = (refreshQueueResult as { count?: number | null }).count ?? 0
  const pendingSources  = (pendingSourcesResult as { count?: number | null }).count ?? 0

  const cacheHitRate = todaySearches > 0 ? Math.round((todayCacheHits / todaySearches) * 100) : 0

  const revenueToday = ((revenueResult.data ?? []) as Array<{ amount: number }>)
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)

  const avgConfidence = avgConfidenceResult.data && avgConfidenceResult.data.length > 0
    ? Math.round(
        (avgConfidenceResult.data as Array<{ confidence_score: number }>)
          .reduce((s, r) => s + r.confidence_score, 0) /
        avgConfidenceResult.data.length
      )
    : null

  const completedToday = (avgDurationResult.data ?? []) as Array<{ started_at: string; completed_at: string | null }>
  const avgDurationMs = completedToday.filter(r => r.completed_at).length > 0
    ? completedToday.filter(r => r.completed_at)
        .reduce((s, r) => s + (new Date(r.completed_at!).getTime() - new Date(r.started_at).getTime()), 0)
      / completedToday.filter(r => r.completed_at).length
    : null
  const avgDurationMin = avgDurationMs ? Math.round(avgDurationMs / 60000) : null

  const aiCostToday = ((aiCostTodayResult as { data?: Array<{ ai_cost_estimate: number }> }).data ?? [])
    .reduce((s, r) => s + (r.ai_cost_estimate ?? 0), 0)

  const recentFailures = (recentFailuresResult.data ?? []) as Array<{
    id: string; entity_slug: string; entity_name: string
    error_message: string | null; started_at: string
  }>

  return (
    <AdminLayout activePath="/admin">
      <div className="p-8 max-w-[1100px]">

        <div className="mb-8">
          <h1 className="text-title-lg text-ink font-bold mb-1">Operations Dashboard</h1>
          <p className="text-body-sm text-ink-tertiary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Action alerts */}
        {(totalFailed > 0 || pendingReview > 0 || (pendingSources as number) > 0) && (
          <div className="flex flex-wrap gap-3 mb-8">
            {totalFailed > 0 && (
              <Link href="/admin/pipeline-failures"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-body-sm text-red-600 hover:bg-red-100 transition-colors">
                <AlertTriangle className="w-4 h-4" />
                {totalFailed} failed pipeline{totalFailed !== 1 ? 's' : ''}
              </Link>
            )}
            {pendingReview > 0 && (
              <Link href="/admin/runs"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-body-sm text-amber-700 hover:bg-amber-100 transition-colors">
                <Clock className="w-4 h-4" />
                {pendingReview} brief{pendingReview !== 1 ? 's' : ''} pending review
              </Link>
            )}
            {(pendingSources as number) > 0 && (
              <Link href="/admin/sources"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-light border border-brand/20 text-body-sm text-brand hover:bg-brand/10 transition-colors">
                <Shield className="w-4 h-4" />
                {pendingSources} submitted source{(pendingSources as number) !== 1 ? 's' : ''} to review
              </Link>
            )}
          </div>
        )}

        {/* Today */}
        <p className="text-label uppercase tracking-widest text-ink-quaternary mb-3">Today</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Searches"       value={todaySearches}              icon={Search}      />
          <StatCard label="Cache Hit Rate"  value={`${cacheHitRate}%`}
            sub={`${todayCacheHits} from cache`}                              icon={Zap}  accent />
          <StatCard label="Pipelines Run"   value={todayRuns}                  icon={Activity}    />
          <StatCard label="AI Cost"
            value={`$${aiCostToday.toFixed(2)}`}
            sub={todayRuns > 0 ? `~$${(aiCostToday / todayRuns).toFixed(3)}/run` : undefined}
            icon={DollarSign} />
        </div>

        {/* Platform */}
        <p className="text-label uppercase tracking-widest text-ink-quaternary mb-3">Platform</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Entities"         value={totalEntities.toLocaleString()}   icon={Database}    />
          <StatCard label="Published Briefs"  value={publishedBriefs.toLocaleString()} icon={CheckCircle} accent />
          <StatCard label="Evidence Records"  value={evidenceCount.toLocaleString()}   icon={BarChart2}   />
          <StatCard label="Revenue Today"
            value={`$${(revenueToday / 100).toFixed(2)}`}
            sub="from credit purchases"                                        icon={TrendingUp}  />
        </div>

        {/* Pipeline Health */}
        <p className="text-label uppercase tracking-widest text-ink-quaternary mb-3">Pipeline Health</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Avg Confidence"
            value={avgConfidence != null ? `${avgConfidence}%` : '—'}         icon={Shield}  accent />
          <StatCard label="Avg Duration"
            value={avgDurationMin != null ? `${avgDurationMin}m` : '—'}       icon={Clock}       />
          <StatCard label="Refresh Queue"    value={refreshQueue}              icon={RefreshCw}   />
          <StatCard label="Failed Pipelines" value={totalFailed}
            icon={AlertTriangle} warning={totalFailed > 0} />
        </div>

        {/* Recent failures */}
        {recentFailures.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-label uppercase tracking-widest text-ink-quaternary">Recent Failures</p>
              <Link href="/admin/pipeline-failures" className="text-caption text-brand hover:underline">View all →</Link>
            </div>
            <div className="bg-white border border-divider rounded-xl overflow-hidden">
              {recentFailures.map((run, i) => (
                <div key={run.id} className={cn(
                  'flex items-center gap-4 px-5 py-3.5',
                  i < recentFailures.length - 1 && 'border-b border-divider',
                )}>
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm text-ink font-medium truncate">{run.entity_name}</p>
                    <p className="text-caption text-ink-quaternary truncate">{run.error_message ?? 'Unknown error'}</p>
                  </div>
                  <span className="text-caption text-ink-quaternary flex-shrink-0">
                    {new Date(run.started_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <p className="text-label uppercase tracking-widest text-ink-quaternary mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/runs"
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-divider bg-white text-body-sm text-ink-secondary hover:text-brand hover:border-brand/30 transition-colors">
            <Activity className="w-3.5 h-3.5" />
            Pipeline Monitor
          </Link>
          <Link href="/admin/pipeline-failures"
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-divider bg-white text-body-sm text-ink-secondary hover:text-brand hover:border-brand/30 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed Pipelines
          </Link>
          <Link href="/admin/evidence"
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-divider bg-white text-body-sm text-ink-secondary hover:text-brand hover:border-brand/30 transition-colors">
            <Database className="w-3.5 h-3.5" />
            Evidence Queue
          </Link>
          <Link href="/admin/analyze"
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand text-white text-body-sm font-semibold hover:bg-brand/90 transition-colors">
            <Activity className="w-3.5 h-3.5" />
            Run Analysis
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
