import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/security/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const PrefsSchema = z.object({
  default_market: z.string().max(10).optional(),
  email_frequency: z.enum(['realtime', 'daily', 'weekly', 'never']).optional(),
  default_report_view: z.enum(['summary', 'full', 'scores']).optional(),
  language: z.string().max(10).optional(),
})

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = PrefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('profiles')
    .select('preferences')
    .eq('id', auth.user.id)
    .single()

  const merged = { ...(existing?.preferences ?? {}), ...parsed.data }

  const { error } = await admin
    .from('profiles')
    .update({ preferences: merged })
    .eq('id', auth.user.id)

  if (error) return NextResponse.json({ error: 'Could not update preferences' }, { status: 500 })

  return NextResponse.json({ ok: true, preferences: merged })
}
