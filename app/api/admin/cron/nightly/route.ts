// POST /api/admin/cron/nightly
// Called nightly by an external scheduler (e.g. Vercel Cron, pg_cron, GitHub Actions).
// Auth: requires X-Cron-Secret header matching CRON_SECRET env var.
//
// Jobs:
//   1. Mark stale snapshots (refresh_due_at < NOW())
//   2. Queue refresh_requests for stale entities
//   3. Run confidence automation on all draft snapshots
//   4. Update entity freshness counters

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

  // 1. Mark stale snapshots
  const { data: staleResult } = await admin.rpc('mark_stale_snapshots')
  report.snapshots_marked_stale = (staleResult as number | null) ?? 0

  // 2. Find entities with stale is_current snapshots and queue refresh
  const { data: staleEntities } = await admin
    .from('scarsian_snapshots')
    .select('entity_id')
    .eq('is_current', true)
    .eq('freshness_status', 'stale')
    .eq('status', 'approved')

  let queued = 0
  for (const { entity_id } of (staleEntities ?? [])) {
    // Only queue if no pending request already exists
    const { data: existing } = await admin
      .from('refresh_requests')
      .select('id')
      .eq('entity_id', entity_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (!existing) {
      await admin.from('refresh_requests').insert({
        entity_id,
        reason:       'Nightly refresh — brief exceeded policy TTL',
        trigger_type: 'scheduled',
        credits_required: 0,
        status:       'pending',
      })
      queued++
    }
  }
  report.refresh_requests_queued = queued

  // 3. Confidence automation — auto-approve high-confidence drafts
  const confidenceRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/admin/confidence`,
    {
      method:  'POST',
      headers: { 'x-cron-secret': process.env.CRON_SECRET ?? '' },
    }
  )
  if (confidenceRes.ok) {
    const { processed, results } = await confidenceRes.json()
    report.confidence_processed  = processed
    report.auto_approved         = results?.auto_approved ?? 0
  }

  report.duration_ms = Date.now() - started
  report.ran_at      = new Date().toISOString()

  console.log('[cron:nightly]', report)
  return NextResponse.json({ ok: true, report })
}
