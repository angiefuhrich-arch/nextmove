import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminLayout } from '@/components/layout/admin-layout'
import { FileText, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

type ReviewStatus = 'unreviewed' | 'accepted' | 'rejected'

interface EvidenceRow {
  id: string
  entity_name: string
  entity_slug: string
  source_url: string
  source_title: string | null
  source_type: string
  source_tier: 1 | 2 | 3 | 4
  content_summary: string
  review_status: ReviewStatus
  disputed: boolean
  dispute_reason: string | null
  collected_at: string
  evidence_date: string | null
  pipeline_run_id: string | null
}

const TIER_LABELS: Record<number, string> = { 1: 'Official', 2: 'Verified', 3: 'News', 4: 'Community' }
const TIER_COLORS: Record<number, string> = {
  1: 'bg-status-success-bg text-status-success',
  2: 'bg-status-info-bg text-status-info',
  3: 'bg-surface-subdued text-ink-secondary',
  4: 'bg-surface-subdued text-ink-tertiary',
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; classes: string; icon: React.ReactNode }> = {
  unreviewed: { label: 'Pending',  classes: 'bg-status-warning-bg text-status-warning', icon: <Clock size={11} /> },
  accepted:   { label: 'Accepted', classes: 'bg-status-success-bg text-status-success', icon: <CheckCircle2 size={11} /> },
  rejected:   { label: 'Rejected', classes: 'bg-status-danger-bg text-status-danger',   icon: <XCircle size={11} /> },
}

const FILTER_TABS = ['All', 'Pending', 'Accepted', 'Rejected', 'Flagged'] as const
type FilterTab = typeof FILTER_TABS[number]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export default async function EvidenceQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/evidence')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const { filter: filterParam } = await searchParams
  const activeFilter = (filterParam ?? 'All') as FilterTab

  const admin = createAdminClient()

  // Join evidence_records with entities for display
  let query = admin
    .from('evidence_records')
    .select(`
      id, source_url, source_title, source_type, source_tier,
      content_summary, review_status, disputed, dispute_reason,
      collected_at, evidence_date, pipeline_run_id,
      entities!inner(name, slug)
    `)
    .order('collected_at', { ascending: false })
    .limit(300)

  if (activeFilter === 'Pending')  query = query.eq('review_status', 'unreviewed')
  if (activeFilter === 'Accepted') query = query.eq('review_status', 'accepted')
  if (activeFilter === 'Rejected') query = query.eq('review_status', 'rejected')
  if (activeFilter === 'Flagged')  query = query.eq('disputed', true)

  const { data: rawRows } = await query

  const rows: EvidenceRow[] = (rawRows ?? []).map((r: Record<string, unknown>) => {
    const entity = (r.entities as { name: string; slug: string } | null) ?? { name: 'Unknown', slug: '' }
    return {
      id:              r.id as string,
      entity_name:     entity.name,
      entity_slug:     entity.slug,
      source_url:      r.source_url as string,
      source_title:    r.source_title as string | null,
      source_type:     r.source_type as string,
      source_tier:     (r.source_tier as 1 | 2 | 3 | 4) ?? 3,
      content_summary: r.content_summary as string,
      review_status:   r.review_status as ReviewStatus,
      disputed:        r.disputed as boolean,
      dispute_reason:  r.dispute_reason as string | null,
      collected_at:    r.collected_at as string,
      evidence_date:   r.evidence_date as string | null,
      pipeline_run_id: r.pipeline_run_id as string | null,
    }
  })

  const counts = {
    All:      rows.length,
    Pending:  rows.filter(r => r.review_status === 'unreviewed').length,
    Accepted: rows.filter(r => r.review_status === 'accepted').length,
    Rejected: rows.filter(r => r.review_status === 'rejected').length,
    Flagged:  rows.filter(r => r.disputed).length,
  }

  return (
    <AdminLayout activePath="/admin/evidence">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-title-xl text-ink font-bold">Evidence Review Queue</h1>
          <p className="text-body-sm text-ink-secondary mt-1">{rows.length} evidence records</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-divider pb-0">
        {FILTER_TABS.map(tab => (
          <a
            key={tab}
            href={`/admin/evidence${tab === 'All' ? '' : `?filter=${tab}`}`}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 rounded-t-md -mb-px text-nav transition-colors duration-fast',
              activeFilter === tab
                ? 'bg-surface-elevated border border-b-surface-elevated border-divider text-brand font-semibold'
                : 'text-ink-tertiary hover:text-ink-secondary'
            )}
          >
            {tab}
            {counts[tab] > 0 && (
              <span className={cn('h-5 min-w-[20px] px-1 rounded-full text-caption text-center leading-5',
                activeFilter === tab ? 'bg-brand-light text-brand' : 'bg-surface-subdued text-ink-tertiary'
              )}>
                {counts[tab]}
              </span>
            )}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText size={40} className="text-ink-quaternary mb-4" />
          <p className="text-title-sm text-ink">No evidence to review</p>
          <p className="text-body-sm text-ink-tertiary mt-1">
            {activeFilter === 'All' ? 'Evidence will appear here after pipeline runs' : `No ${activeFilter.toLowerCase()} evidence found`}
          </p>
        </div>
      ) : (
        <div className="bg-surface-elevated border border-divider rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-divider">
                <Th>Date</Th>
                <Th>Employer</Th>
                <Th className="hidden md:table-cell">Category</Th>
                <Th>Source</Th>
                <Th className="hidden lg:table-cell">Content</Th>
                <Th>Status</Th>
                <Th className="w-16"></Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const statusCfg = STATUS_CONFIG[row.review_status]
                return (
                  <tr key={row.id} className="border-b border-divider last:border-0 hover:bg-surface-subdued/40 transition-colors duration-fast">
                    <td className="px-3 py-3 w-20 shrink-0">
                      <span className="text-caption text-ink-tertiary whitespace-nowrap">
                        {formatDate(row.evidence_date ?? row.collected_at)}
                      </span>
                    </td>
                    <td className="px-3 py-3 w-28">
                      <p className="text-body-sm text-ink font-medium truncate max-w-[110px]">{row.entity_name}</p>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell w-20">
                      <span className="text-caption uppercase tracking-wider text-ink-tertiary">
                        {row.source_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 w-[100px]">
                      <div className="flex flex-col gap-1">
                        <span className={cn('inline-flex items-center h-5 px-1.5 rounded text-caption', TIER_COLORS[row.source_tier])}>
                          T{row.source_tier} · {TIER_LABELS[row.source_tier]}
                        </span>
                        <p className="text-caption text-ink-quaternary truncate max-w-[90px]">
                          {row.source_title ?? new URL(row.source_url).hostname}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <p className="text-caption text-ink-secondary line-clamp-2 max-w-[200px]">{row.content_summary}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-caption font-medium', statusCfg.classes)}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                      {row.disputed && (
                        <span className="block text-caption text-status-danger mt-0.5">Disputed</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={row.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-caption text-ink-tertiary hover:text-brand hover:bg-brand-light transition-colors duration-fast"
                        aria-label="Open source"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-3 py-2.5 text-caption uppercase tracking-[0.05em] text-ink-tertiary font-semibold', className)}>
      {children}
    </th>
  )
}
