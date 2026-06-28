import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveScarsianSnapshot, rejectScarsianSnapshot } from '@/lib/dal/snapshots'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const { snapshotId } = await params
  const body = await req.json().catch(() => ({}))

  try {
    if (body.action === 'approve') {
      const snapshot = await approveScarsianSnapshot(snapshotId, user!.id, body.analystNote ?? undefined)
      return NextResponse.json({ success: true, snapshot })
    }

    if (body.action === 'reject') {
      await rejectScarsianSnapshot(snapshotId, user!.id)
      return NextResponse.json({ success: true })
    }

    if (body.action === 'update_note') {
      const admin = createAdminClient()
      await admin.from('scarsian_snapshots')
        .update({ analyst_note: body.note })
        .eq('id', snapshotId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    console.error('[admin/briefs]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
