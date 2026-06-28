import 'server-only'

// Rate limiter abstraction — currently Supabase-backed.
// To migrate to Upstash Redis: replace the `supabaseCheck` implementation;
// the calling interface (checkRateLimit / rateLimit) stays the same.

import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export interface RateLimitConfig {
  /** Unique name for this limit (e.g. "search:user") */
  name: string
  /** Max allowed requests in the window */
  limit: number
  /** Window length in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

// ── Predefined limits ─────────────────────────────────────────────────────────

export const LIMITS = {
  SEARCH_USER:       { name: 'search:user',       limit: 30,  windowSeconds: 600  }, // 30/10min
  SEARCH_IP:         { name: 'search:ip',          limit: 10,  windowSeconds: 60   }, // 10/min
  PIPELINE_START:    { name: 'pipeline:start',     limit: 3,   windowSeconds: 600  }, // 3/10min
  PIPELINE_DAY:      { name: 'pipeline:day',       limit: 10,  windowSeconds: 86400 }, // 10/day
  SOURCE_SUBMIT:     { name: 'source:submit',      limit: 10,  windowSeconds: 86400 }, // 10/day
  REFRESH_REQUEST:   { name: 'refresh:request',    limit: 5,   windowSeconds: 86400 }, // 5/day
  FEEDBACK:          { name: 'feedback:submit',    limit: 20,  windowSeconds: 86400 }, // 20/day
} satisfies Record<string, RateLimitConfig>

// ── Supabase-backed implementation ────────────────────────────────────────────

async function supabaseCheck(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const db = createAdminClient()
  const now = new Date()
  const windowStart = new Date(
    Math.floor(now.getTime() / (config.windowSeconds * 1000)) * (config.windowSeconds * 1000)
  )
  const windowKey = `${key}:${config.name}`

  // Upsert: increment count for this window
  const { data, error } = await db
    .from('rate_limit_windows')
    .upsert(
      { key: windowKey, window_start: windowStart.toISOString(), count: 1 },
      { onConflict: 'key,window_start', ignoreDuplicates: false }
    )
    .select('count')
    .single()

  if (error || !data) {
    // If upsert failed (race), increment manually
    const { data: existing } = await db
      .from('rate_limit_windows')
      .select('count')
      .eq('key', windowKey)
      .eq('window_start', windowStart.toISOString())
      .single()

    if (existing) {
      await db
        .from('rate_limit_windows')
        .update({ count: (existing.count as number) + 1 })
        .eq('key', windowKey)
        .eq('window_start', windowStart.toISOString())

      const count = (existing.count as number) + 1
      const windowEndMs = windowStart.getTime() + config.windowSeconds * 1000
      return {
        allowed: count <= config.limit,
        remaining: Math.max(0, config.limit - count),
        retryAfterSeconds: count > config.limit
          ? Math.ceil((windowEndMs - now.getTime()) / 1000)
          : 0,
      }
    }

    // Fallback: allow (don't block on rate limiter errors)
    console.error('[rate-limit] supabase error', error?.message)
    return { allowed: true, remaining: config.limit, retryAfterSeconds: 0 }
  }

  const count = data.count as number
  const windowEndMs = windowStart.getTime() + config.windowSeconds * 1000

  // Prune old windows asynchronously (no await — best-effort)
  const cutoff = new Date(now.getTime() - config.windowSeconds * 2000).toISOString()
  db.from('rate_limit_windows').delete().lt('window_start', cutoff).then(() => {})

  return {
    allowed: count <= config.limit,
    remaining: Math.max(0, config.limit - count),
    retryAfterSeconds: count > config.limit
      ? Math.ceil((windowEndMs - now.getTime()) / 1000)
      : 0,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check rate limit for a key. Key should be `userId` or `ip:${ip}`.
 * Returns allowed=false when over limit.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  options?: { bypassForAdmin?: boolean }
): Promise<RateLimitResult> {
  if (options?.bypassForAdmin && key.startsWith('admin:')) {
    return { allowed: true, remaining: 999, retryAfterSeconds: 0 }
  }
  return supabaseCheck(key, config)
}

/**
 * Middleware helper: checks rate limit and returns a 429 Response if exceeded.
 * Returns null if allowed, NextResponse if blocked.
 */
export async function rateLimit(
  request: NextRequest,
  key: string,
  config: RateLimitConfig,
  options?: { bypassForAdmin?: boolean }
): Promise<NextResponse | null> {
  const result = await checkRateLimit(key, config, options)

  if (!result.allowed) {
    console.info('[rate-limit] blocked', { key, config: config.name, retryAfter: result.retryAfterSeconds })
    return NextResponse.json(
      { error: 'This request was rate limited. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfterSeconds),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}
