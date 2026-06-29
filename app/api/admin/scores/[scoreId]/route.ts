import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/security/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ scoreId: string }> }) {
  try {
    const auth = await requireAdmin(req)
    if (auth.error) return auth.error

    const { scoreId } = await params
    const { admin_override_score, admin_notes } = await req.json()

    const admin = createAdminClient()
    const { error } = await admin
      .from('company_signal_scores')
      .update({
        admin_override_score: Number(admin_override_score),
        admin_notes,
        review_status: 'overridden',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scoreId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
