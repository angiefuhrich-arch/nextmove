import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEntityBySlug } from '@/lib/dal/entities'
import { unlockBriefForUser } from '@/lib/dal/unlocks'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ entitySlug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { entitySlug } = await params
  const entity = await getEntityBySlug(entitySlug)
  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const result = await unlockBriefForUser(user.id, entity.id)
  if (!result.ok) {
    if (result.error === 'insufficient_credits') {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }
    return NextResponse.json({ error: 'Failed to unlock brief' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
