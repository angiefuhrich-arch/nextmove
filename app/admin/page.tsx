import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import Link from 'next/link'
import { Plus, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const admin = createAdminClient()

  // Get all snapshots with company info
  const { data: snapshots } = await admin
    .from('company_score_snapshots')
    .select(`
      id, status, scarsian_score, confidence_score, verdict, created_at, approved_at,
      company_id,
      companies(name, slug, industry)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle2 size={14} className="text-green-500" />
    if (status === 'rejected') return <XCircle size={14} className="text-red-400" />
    return <Clock size={14} className="text-amber-400" />
  }

  const statusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-50 text-green-700 border border-green-200'
    if (status === 'rejected') return 'bg-red-50 text-red-700 border border-red-200'
    return 'bg-amber-50 text-amber-700 border border-amber-200'
  }

  const verdictColor = (verdict: string) => {
    if (verdict === 'strong') return 'text-green-600'
    if (verdict === 'no-go') return 'text-red-500'
    return 'text-amber-500'
  }

  const drafts = snapshots?.filter(s => s.status === 'draft').length ?? 0
  const approved = snapshots?.filter(s => s.status === 'approved').length ?? 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Pipeline</h1>
            <p className="text-slate-500 text-sm mt-1">Analyze, review, and approve company reports</p>
          </div>
          <Link
            href="/admin/analyze"
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors"
          >
            <Plus size={16} />
            Analyze Company
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Reports', value: snapshots?.length ?? 0, color: 'text-slate-900' },
            { label: 'Pending Review', value: drafts, color: 'text-amber-600' },
            { label: 'Published', value: approved, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Snapshots table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900">Company Reports</h2>
          </div>
          {!snapshots || snapshots.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-sm">No reports yet. Click &quot;Analyze Company&quot; to start.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {snapshots.map((snapshot) => {
                const company = (Array.isArray(snapshot.companies) ? snapshot.companies[0] : snapshot.companies) as { name: string; slug: string; industry: string } | null
                return (
                  <Link
                    key={snapshot.id}
                    href={`/admin/review/${snapshot.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                      {company?.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{company?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{company?.industry ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-bold ${verdictColor(snapshot.verdict)}`}>
                        {snapshot.scarsian_score}
                      </span>
                      <span className="text-xs text-slate-400">
                        {snapshot.confidence_score}% conf
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(snapshot.status)}`}>
                        {statusIcon(snapshot.status)}
                        {snapshot.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(snapshot.created_at).toLocaleDateString()}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
