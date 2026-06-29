import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getClientIp } from '@/lib/security/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { parseBody, PipelineStartSchema } from '@/lib/security/validate'
import { log } from '@/lib/security/log'
import { createPipelineRun } from '@/lib/pipeline/db'
import { runPipeline } from '@/lib/pipeline/orchestrator'
import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateFreshness } from '@/lib/refresh-policy'
import type { RefreshPolicy } from '@/lib/refresh-policy'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|corp|corporation|hk|plc|llc|group|holdings?)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) {
    log.authFailed('/api/pipeline/start', getClientIp(request), 'unauthenticated')
    return auth.error
  }

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = parseBody(PipelineStartSchema, body)
  if (!parsed.success) return parsed.error

  const { entityName, entitySlug, entityType } = parsed.data
  const slug    = entitySlug ?? slugify(entityName)
  const userId  = auth.user.id
  const ip      = getClientIp(request)
  const admin   = createAdminClient()

  // ── Cache-first: check for a published, fresh Intelligence Brief ────────────
  const { data: entity } = await admin
    .from('entities')
    .select('id, slug, name, refresh_policy, last_brief_generated_at, refresh_due_at')
    .or(`slug.eq.${slug},name.ilike.${entityName}`)
    .maybeSingle()

  if (entity) {
    // Track search against this entity
    await admin.rpc('increment_entity_search', { p_entity_id: entity.id, p_cache_hit: false })

    const { data: snapshot } = await admin
      .from('scarsian_snapshots')
      .select('id, status, is_current, freshness_status, refresh_due_at, generated_at, confidence_score')
      .eq('entity_id', entity.id)
      .eq('status', 'approved')
      .eq('is_current', true)
      .maybeSingle()

    if (snapshot) {
      const freshness = evaluateFreshness(
        snapshot.generated_at ? new Date(snapshot.generated_at as string) : null,
        (entity.refresh_policy as RefreshPolicy) ?? 'medium',
      )

      if (freshness.isFresh) {
        // ── CACHE HIT: serve immediately, no pipeline ──────────────────────────
        await admin.rpc('increment_entity_search', { p_entity_id: entity.id, p_cache_hit: true })
          // Second increment for the cache hit (net: two increments = one search + one cache hit)
        await admin.rpc('increment_entity_search', { p_entity_id: entity.id, p_cache_hit: true })
        console.log('[pipeline:cache_hit]', { entitySlug: slug, entityId: entity.id, userId })
        return NextResponse.json({
          briefReady: true,
          entitySlug: entity.slug,
          entityName:  entity.name,
          cacheHit:    true,
        })
      }

      if (freshness.isStale) {
        // ── STALE: return existing brief instantly, queue background refresh ──
        const { data: activeRun } = await admin
          .from('pipeline_runs')
          .select('id')
          .eq('entity_id', entity.id)
          .not('status', 'in', '("completed","failed","insufficient_evidence")')
          .maybeSingle()

        if (!activeRun) {
          // Queue a background refresh
          await admin.from('refresh_requests').insert({
            entity_id:        entity.id,
            requested_by:     userId,
            reason:           'Stale brief — background refresh',
            trigger_type:     'user_search',
            credits_required: 0,
            status:           'pending',
          })
        }

        console.log('[pipeline:stale_served]', { entitySlug: slug, entityId: entity.id, userId })
        return NextResponse.json({
          briefReady: true,
          entitySlug: entity.slug,
          entityName:  entity.name,
          cacheHit:    true,
          staleRefreshQueued: !activeRun,
        })
      }
    }

    // ── Check for an already-running pipeline (prevent duplicates) ────────────
    const { data: activeRun } = await admin
      .from('pipeline_runs')
      .select('id')
      .eq('entity_id', entity.id)
      .not('status', 'in', '("completed","failed","insufficient_evidence","needs_user_clarification")')
      .maybeSingle()

    if (activeRun) {
      console.log('[pipeline:duplicate_blocked]', { entitySlug: slug, runId: activeRun.id, userId })
      return NextResponse.json({
        runId:       activeRun.id,
        entitySlug:  slug,
        entityName,
        duplicate:   true,
        message:     'Intelligence Brief is already being prepared.',
      })
    }
  }

  // ── CACHE MISS: run the pipeline ──────────────────────────────────────────

  const rateLimited = await rateLimit(request, userId, LIMITS.PIPELINE_START)
  if (rateLimited) {
    log.rateLimitHit(userId, 'pipeline:start', ip)
    return rateLimited
  }

  const dailyLimited = await rateLimit(request, `${userId}:daily`, LIMITS.PIPELINE_DAY)
  if (dailyLimited) {
    log.rateLimitHit(userId, 'pipeline:day', ip)
    return dailyLimited
  }

  const runId = await createPipelineRun({
    entitySlug: slug,
    entityName,
    entityType,
    requestedBy: userId,
  })

  log.pipelineStarted(runId, entityName, userId)

  runPipeline(runId).catch(err => {
    log.pipelineFailed(runId, 'orchestrator', String(err))
  })

  return NextResponse.json({ runId, entitySlug: slug, entityName })
}
