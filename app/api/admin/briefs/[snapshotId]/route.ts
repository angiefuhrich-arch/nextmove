import { NextRequest, NextResponse } from 'next/server'
import { approveScarsianSnapshot, rejectScarsianSnapshot } from '@/lib/dal/snapshots'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/security/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  const auth = await requireAdmin(req)
  if (auth.error) return auth.error
  const user = auth.user

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
