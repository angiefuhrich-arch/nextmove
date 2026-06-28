// POST /api/admin/confidence
// Processes draft snapshots and applies confidence-based publishing rules:
//   ≥95%  → auto-approve and publish
//   80-94% → flag for AI validation (future: send to AI validator)
//   60-79% → flag for admin review
//   <60%   → mark insufficient_evidence

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveScarsianSnapshot } from '@/lib/dal/snapshots'

async function requireAdmin(req: NextRequest) {
  // Allow cron secret OR logged-in admin
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret && cronSecret === process.env.CRON_SECRET) return { ok: true }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { ok: false, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { ok: true }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.error!

  const admin = createAdminClient()

  // Fetch all draft snapshots with a confidence score
  const { data: drafts, error } = await admin
    .from('scarsian_snapshots')
    .select('id, entity_id, confidence_score, scarsian_score, verdict')
    .eq('status', 'draft')
    .not('confidence_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 })
  if (!drafts || drafts.length === 0) {
    return NextResponse.json({ processed: 0, message: 'No draft snapshots to process' })
  }

  type SnapshotRow = typeof drafts[number]
  const results = { auto_approved: 0, ai_validation: 0, admin_review: 0, insufficient: 0 }

  for (const snapshot of drafts as SnapshotRow[]) {
    const confidence = snapshot.confidence_score as number

    if (confidence >= 95) {
      // Auto-approve
      try {
        await approveScarsianSnapshot(
          snapshot.id,
          'system',
          `Auto-approved: confidence ${confidence}% meets threshold.`,
        )
        results.auto_approved++
      } catch { /* continue */ }

    } else if (confidence >= 80) {
      // Flag for AI validation (queue future processing)
      await admin.from('scarsian_snapshots')
        .update({ analyst_note: `Confidence ${confidence}%: queued for AI validation.` })
        .eq('id', snapshot.id)
      results.ai_validation++

    } else if (confidence >= 60) {
      // Flag for admin review — leave as draft, add note
      await admin.from('scarsian_snapshots')
        .update({ analyst_note: `Confidence ${confidence}%: requires admin review before publishing.` })
        .eq('id', snapshot.id)
      results.admin_review++

    } else {
      // Insufficient confidence — mark rejected
      await admin.from('scarsian_snapshots')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          analyst_note: `Insufficient confidence (${confidence}%). Additional evidence required.`,
        })
        .eq('id', snapshot.id)
      results.insufficient++
    }
  }

  return NextResponse.json({ processed: drafts.length, results })
}
