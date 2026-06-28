import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const SubmitSourceSchema = z.object({
  entitySlug:  z.string().min(1).max(200),
  url:         z.string().url().max(2000),
  description: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { body = {} }

  const parsed = SubmitSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const { entitySlug, url, description } = parsed.data
  const admin = createAdminClient()

  // Look up entity
  const { data: entity } = await admin
    .from('entities')
    .select('id')
    .eq('slug', entitySlug)
    .maybeSingle()

  await admin.from('user_submitted_sources').insert({
    entity_id:    entity?.id ?? null,
    submitted_by: user.id,
    url,
    description:  description ?? null,
    status:       'pending',
  })

  return NextResponse.json({ success: true })
}
