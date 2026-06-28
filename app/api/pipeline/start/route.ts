import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getClientIp } from '@/lib/security/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { parseBody, PipelineStartSchema } from '@/lib/security/validate'
import { log } from '@/lib/security/log'
import { createPipelineRun } from '@/lib/pipeline/db'
import { runPipeline } from '@/lib/pipeline/orchestrator'

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
  // Auth: pipeline start requires authentication
  const auth = await requireAuth()
  if (auth.error) {
    log.authFailed('/api/pipeline/start', getClientIp(request), 'unauthenticated')
    return auth.error
  }

  // Input validation
  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = parseBody(PipelineStartSchema, body)
  if (!parsed.success) return parsed.error

  const { entityName, entitySlug, entityType } = parsed.data
  const slug = entitySlug ?? slugify(entityName)

  // Rate limit: 3 pipeline starts per user per 10 minutes
  const userId = auth.user.id
  const ip     = getClientIp(request)

  const rateLimited = await rateLimit(request, userId, LIMITS.PIPELINE_START)
  if (rateLimited) {
    log.rateLimitHit(userId, 'pipeline:start', ip)
    return rateLimited
  }

  // Daily limit check
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

  // Fire-and-forget: pipeline runs async, frontend polls /status
  runPipeline(runId).catch(err => {
    log.pipelineFailed(runId, 'orchestrator', String(err))
  })

  return NextResponse.json({ runId, entitySlug: slug, entityName })
}
