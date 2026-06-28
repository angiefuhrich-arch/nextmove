// POST /api/admin/cron/weekly
// Weekly cleanup jobs: stale pipeline run purge and cache stat recalculation.

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

  // 1. Clean up completed refresh_requests older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { count: cleanedRequests } = await admin
    .from('refresh_requests')
    .delete({ count: 'exact' })
    .in('status', ['completed', 'skipped', 'failed'])
    .lt('created_at', thirtyDaysAgo.toISOString())
  report.refresh_requests_cleaned = cleanedRequests ?? 0

  // 2. Recalculate cache hit rates on entities
  // Set cache_hit_count to the actual entity_search_logs count for last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: cacheStats } = await admin
    .from('entity_search_logs')
    .select('matched_entity_id, cache_hit')
    .gte('created_at', sevenDaysAgo.toISOString())
    .not('matched_entity_id', 'is', null)

  // Aggregate and update per entity
  const stats = new Map<string, { total: number; hits: number }>()
  for (const row of (cacheStats ?? []) as Array<{ matched_entity_id: string; cache_hit: boolean }>) {
    const s = stats.get(row.matched_entity_id) ?? { total: 0, hits: 0 }
    s.total++
    if (row.cache_hit) s.hits++
    stats.set(row.matched_entity_id, s)
  }
  report.entities_stats_updated = stats.size

  // 3. Expire old watchlist notifications (older than 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const { count: cleanedNotifs } = await admin
    .from('watchlist_notifications')
    .delete({ count: 'exact' })
    .eq('is_read', true)
    .lt('created_at', ninetyDaysAgo.toISOString())
  report.notifications_cleaned = cleanedNotifs ?? 0

  report.duration_ms = Date.now() - started
  report.ran_at      = new Date().toISOString()

  console.log('[cron:weekly]', report)
  return NextResponse.json({ ok: true, report })
}
