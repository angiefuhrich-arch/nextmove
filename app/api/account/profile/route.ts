import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const PatchSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  avatar_url: z.string().url().max(500).optional(),
})

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const admin = createAdminClient()
  const userId = auth.user.id

  const [{ data: profile }, { count: briefCount }, { count: savedCount }, { count: searchCount }] =
    await Promise.all([
      admin
        .from('profiles')
        .select('email, display_name, avatar_url, credits, is_admin, notification_prefs, preferences, created_at')
        .eq('id', userId)
        .single(),
      admin.from('brief_unlocks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      admin.from('saved_companies').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      admin.from('pipeline_runs').select('*', { count: 'exact', head: true }).eq('requested_by', userId),
    ])

  return NextResponse.json({
    id: userId,
    email: auth.user.email,
    display_name: profile?.display_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    credits: profile?.credits ?? 0,
    is_admin: profile?.is_admin ?? false,
    notification_prefs: profile?.notification_prefs ?? {},
    preferences: profile?.preferences ?? {},
    member_since: profile?.created_at ?? auth.user.created_at,
    brief_count: briefCount ?? 0,
    saved_count: savedCount ?? 0,
    search_count: searchCount ?? 0,
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update(parsed.data)
    .eq('id', auth.user.id)

  if (error) {
    return NextResponse.json({ error: 'Could not update profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
