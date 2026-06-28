// POST /api/admin/cron/monthly
// Monthly archival jobs: old pipeline logs, cost report generation.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function requireCron(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret')
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET
}

export async function POST(req: NextRequest) {
  if (!requireCron(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin   = createAdminClient()
  const started = Date.now()
  const report: Record<string, number | string> = {}

  // 1. Archive pipeline runs older than 90 days that are terminal
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Truncate step_log on old completed runs to reduce storage
  const { count: archived } = await admin
    .from('pipeline_runs')
    .update({ step_log: [] }, { count: 'exact' })
    .in('status', ['completed', 'failed', 'insufficient_evidence'])
    .lt('started_at', ninetyDaysAgo.toISOString())
    .neq('step_log', '[]')
  report.pipeline_logs_archived = archived ?? 0

  // 2. Generate monthly cost summary
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const prevMonthStart = new Date(monthStart)
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)

  const { data: monthlyRuns } = await admin
    .from('pipeline_runs')
    .select('ai_cost_estimate, brave_search_count, openai_input_tokens, openai_output_tokens')
    .gte('started_at', prevMonthStart.toISOString())
    .lt('started_at', monthStart.toISOString())
    .not('ai_cost_estimate', 'is', null)

  const costSummary = (monthlyRuns ?? []).reduce((acc: {
    total_cost: number; brave_searches: number; input_tokens: number; output_tokens: number; run_count: number
  }, r: { ai_cost_estimate: number; brave_search_count: number; openai_input_tokens: number; openai_output_tokens: number }) => ({
    total_cost:    acc.total_cost    + (r.ai_cost_estimate   ?? 0),
    brave_searches: acc.brave_searches + (r.brave_search_count ?? 0),
    input_tokens:   acc.input_tokens   + (r.openai_input_tokens  ?? 0),
    output_tokens:  acc.output_tokens  + (r.openai_output_tokens ?? 0),
    run_count:     acc.run_count + 1,
  }), { total_cost: 0, brave_searches: 0, input_tokens: 0, output_tokens: 0, run_count: 0 })

  report.monthly_cost_usd     = parseFloat(costSummary.total_cost.toFixed(4))
  report.monthly_pipeline_runs = costSummary.run_count
  report.monthly_brave_searches = costSummary.brave_searches
  report.monthly_tokens_used  = costSummary.input_tokens + costSummary.output_tokens

  // 3. Clean superseded snapshots older than 180 days
  const halfYear = new Date()
  halfYear.setDate(halfYear.getDate() - 180)
  const { count: cleaned } = await admin
    .from('scarsian_snapshots')
    .delete({ count: 'exact' })
    .eq('status', 'superseded')
    .lt('created_at', halfYear.toISOString())
  report.old_snapshots_cleaned = cleaned ?? 0

  report.duration_ms = Date.now() - started
  report.ran_at      = new Date().toISOString()

  console.log('[cron:monthly]', report)
  return NextResponse.json({ ok: true, report })
}
