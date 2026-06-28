'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AdminLayout } from '@/components/layout/admin-layout'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronRight, Clock, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FailedRun {
  id: string
  entity_slug: string
  entity_name: string
  entity_type: string
  error_message: string | null
  started_at: string
  completed_at: string | null
  step_log: Array<{ step: string; message?: string; ts?: string }>
  event_count: number | null
  signal_count: number | null
  requested_by: string | null
}

export default function PipelineFailuresPage() {
  const [runs, setRuns]         = useState<FailedRun[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [retrying, setRetrying] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [refreshKey, setRefreshKey] = useState(0)
  const load = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('pipeline_runs')
        .select('id,entity_slug,entity_name,entity_type,error_message,started_at,completed_at,step_log,event_count,signal_count,requested_by')
        .eq('status', 'failed')
        .order('started_at', { ascending: false })
        .limit(100)
      if (!active) return
      setRuns((data ?? []) as FailedRun[])
      setLoading(false)
    })()
    return () => { active = false }
  }, [supabase, refreshKey])

  const retry = async (run: FailedRun) => {
    setRetrying(run.id)
    try {
      const res = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityName: run.entity_name, entitySlug: run.entity_slug, entityType: run.entity_type }),
      })
      if (res.ok) {
        await load()
      }
    } finally {
      setRetrying(null)
    }
  }

  const durationStr = (run: FailedRun) => {
    if (!run.completed_at) return null
    const ms = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
    return `${Math.round(ms / 1000)}s`
  }

  return (
    <AdminLayout activePath="/admin/pipeline-failures">
      <div className="p-8 max-w-[900px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-title-lg text-ink font-bold mb-1">Failed Pipelines</h1>
            <p className="text-body-sm text-ink-tertiary">Review, diagnose, and retry failed intelligence runs.</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 h-9 px-4 rounded-xl border border-divider text-body-sm text-ink-secondary hover:text-brand hover:border-brand/30 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">No failed pipelines</p>
              <p className="text-caption text-ink-quaternary mt-1">All pipelines completed successfully.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map(run => (
              <div key={run.id} className="bg-white border border-red-100 rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-body-sm font-semibold text-ink">{run.entity_name}</p>
                      <span className="text-caption text-ink-quaternary">{run.entity_type}</span>
                    </div>
                    <p className="text-caption text-red-600 truncate">{run.error_message ?? 'Unknown error'}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-caption text-ink-quaternary">
                      <Clock className="w-3 h-3" />
                      {durationStr(run) ?? '—'}
                    </div>
                    {run.requested_by && (
                      <div className="flex items-center gap-1 text-caption text-ink-quaternary">
                        <User className="w-3 h-3" />
                        <span className="max-w-[80px] truncate">{run.requested_by.slice(0, 8)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => retry(run)}
                      disabled={retrying === run.id}
                      className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-brand text-white text-caption font-semibold hover:bg-brand/90 disabled:opacity-60 transition-colors"
                    >
                      {retrying === run.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Retry
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                      className="p-1.5 rounded hover:bg-surface-subdued text-ink-quaternary transition-colors"
                    >
                      {expanded === run.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {expanded === run.id && (
                  <div className="border-t border-divider px-5 py-4 bg-surface-subdued/40">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-caption">
                      <div>
                        <p className="text-ink-quaternary mb-0.5">Run ID</p>
                        <p className="text-ink font-mono text-[10px]">{run.id}</p>
                      </div>
                      <div>
                        <p className="text-ink-quaternary mb-0.5">Started</p>
                        <p className="text-ink">{new Date(run.started_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-ink-quaternary mb-0.5">Evidence / Signals</p>
                        <p className="text-ink">{run.event_count ?? 0} events · {run.signal_count ?? 0} signals</p>
                      </div>
                    </div>
                    {run.step_log && run.step_log.length > 0 && (
                      <div>
                        <p className="text-caption text-ink-quaternary mb-2">Step Log</p>
                        <div className={cn(
                          'rounded-lg border border-divider bg-white p-3 font-mono text-[10px] text-ink-secondary',
                          'max-h-48 overflow-y-auto space-y-1',
                        )}>
                          {run.step_log.map((entry, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-ink-quaternary flex-shrink-0">{entry.step}</span>
                              <span className="text-ink-secondary">{entry.message ?? ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
