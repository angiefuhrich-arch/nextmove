import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function normalize(query: string): string {
  return query
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|co\.|corp|hk|hong kong|pvt|plc|llc|group)\b/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  const normalized = normalize(q)
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // Check entities by slug or name
  const { data: entities } = await supabase
    .from('entities')
    .select('id, slug, name, industry, country')
    .or(`slug.ilike.%${normalized}%,name.ilike.%${q}%`)
    .limit(5)

  // Check aliases
  const { data: aliases } = await supabase
    .from('entity_aliases')
    .select('entity_id, alias, entities(id, slug, name, industry, country)')
    .ilike('alias', `%${normalized}%`)
    .limit(5)

  const results: { id: string; slug: string; name: string; industry?: string; country?: string }[] = []
  const seen = new Set<string>()

  for (const e of entities ?? []) {
    if (!seen.has(e.id)) { seen.add(e.id); results.push(e) }
  }
  for (const a of aliases ?? []) {
    const e = ((a as unknown) as { entities: { id: string; slug: string; name: string; industry?: string; country?: string } | null }).entities
    if (e && !seen.has(e.id)) { seen.add(e.id); results.push(e) }
  }

  // Log search (best-effort, no auth required)
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('entity_search_logs').insert({
    user_id: user?.id ?? null,
    raw_query: q,
    normalized,
    matched_entity: results[0]?.id ?? null,
    cache_hit: results.length > 0,
  })

  if (results.length > 0) {
    return NextResponse.json({ hit: true, results })
  }

  return NextResponse.json({ hit: false, normalizedQuery: normalized })
}
