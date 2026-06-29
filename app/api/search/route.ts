import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireAuth, getClientIp } from '@/lib/security/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { parseQuery, SearchSchema } from '@/lib/security/validate'
import { log } from '@/lib/security/log'

function normalize(query: string): string {
  return query
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|co\.|corp|hk|hong kong|pvt|plc|llc|group)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: NextRequest) {
  // Input validation
  const parsed = parseQuery(SearchSchema, request.nextUrl.searchParams)
  if (!parsed.success) return parsed.error

  const q = parsed.data.q
  const ip = getClientIp(request)

  // Auth check (search allows anonymous but rate-limits more strictly)
  const authResult = await requireAuth()
  const isAuthed = authResult.error === null
  const userId = isAuthed ? authResult.user.id : null

  // Rate limit: authenticated users get 30/10min; anonymous gets 10/min by IP
  if (userId) {
    const limited = await rateLimit(request, userId, LIMITS.SEARCH_USER)
    if (limited) {
      log.rateLimitHit(userId, 'search:user', ip)
      return limited
    }
  } else {
    const limited = await rateLimit(request, `ip:${ip}`, LIMITS.SEARCH_IP)
    if (limited) {
      log.rateLimitHit(`ip:${ip}`, 'search:ip', ip)
      return limited
    }
  }

  const normalized = normalize(q)
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Search companies by slug or name
  const { data: companies } = await supabase
    .from('companies')
    .select('id, slug, name, industry, headquarters')
    .or(`slug.ilike.%${normalized}%,name.ilike.%${q}%`)
    .limit(5)

  const results: { id: string; slug: string; name: string; industry?: string; country?: string }[] = []
  const seen = new Set<string>()

  for (const c of companies ?? []) {
    if (!seen.has(c.id)) {
      seen.add(c.id)
      results.push({ id: c.id, slug: c.slug, name: c.name, industry: c.industry ?? undefined, country: c.headquarters ?? undefined })
    }
  }

  if (results.length > 0) {
    return NextResponse.json({ hit: true, results })
  }

  return NextResponse.json({ hit: false, normalizedQuery: normalized })
}
