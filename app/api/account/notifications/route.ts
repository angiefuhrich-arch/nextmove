import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const NotifSchema = z.object({
  weekly_digest: z.boolean().optional(),
  watchlist_alerts: z.boolean().optional(),
  report_refresh: z.boolean().optional(),
  credit_warnings: z.boolean().optional(),
  product_announcements: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = NotifSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Merge with existing prefs
  const { data: existing } = await admin
    .from('profiles')
    .select('notification_prefs')
    .eq('id', auth.user.id)
    .single()

  const merged = { ...(existing?.notification_prefs ?? {}), ...parsed.data }

  const { error } = await admin
    .from('profiles')
    .update({ notification_prefs: merged })
    .eq('id', auth.user.id)

  if (error) return NextResponse.json({ error: 'Could not update preferences' }, { status: 500 })

  return NextResponse.json({ ok: true, notification_prefs: merged })
}
