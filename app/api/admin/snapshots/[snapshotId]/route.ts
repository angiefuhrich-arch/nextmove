import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateScarsianScores, calculateConfidence, SIGNAL_NAMES } from '@/lib/scoring'
import type { SignalScores } from '@/lib/scoring'

// PATCH: approve, reject, or update analyst note
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ snapshotId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { snapshotId } = await params
    const body = await req.json()
    const admin = createAdminClient()

    if (body.action === 'approve') {
      // Recalculate using any admin overrides before approving
      const { data: signals } = await admin
        .from('company_signal_scores')
        .select('signal_name, score, confidence, admin_override_score, review_status')
        .eq('snapshot_id', snapshotId)

      if (signals && signals.length > 0) {
        const signalMap: Partial<SignalScores> = {}
        const confidences: number[] = []

        for (const sig of signals) {
          const effectiveScore = sig.review_status === 'overridden' && sig.admin_override_score != null
            ? sig.admin_override_score
            : sig.score
          const name = sig.signal_name as keyof SignalScores
          if (SIGNAL_NAMES.includes(name as typeof SIGNAL_NAMES[number])) {
            signalMap[name] = effectiveScore
          }
          confidences.push(sig.confidence)
        }

        for (const name of SIGNAL_NAMES) {
          if (signalMap[name as keyof SignalScores] === undefined) signalMap[name as keyof SignalScores] = 50
        }

        const recalculated = calculateScarsianScores(signalMap as SignalScores)
        const confidenceScore = calculateConfidence(confidences)

        await admin.from('company_score_snapshots').update({
          ...recalculated,
          confidence_score: confidenceScore,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        }).eq('id', snapshotId)

        // Also update the company row with the approved scores
        const { data: snapshot } = await admin
          .from('company_score_snapshots')
          .select('company_id, analyst_note')
          .eq('id', snapshotId)
          .single()

        if (snapshot) {
          await admin.from('companies').update({
            scarsian_index: recalculated.scarsian_score,
            confidence_score: confidenceScore,
            verdict: recalculated.verdict,
            analyst_note: snapshot.analyst_note,
            gfi_score: recalculated.gfi_score,
            ladder_speed: signalMap.ladder_speed,
            skill_depreciation_risk: signalMap.skill_depreciation_risk,
            network_multiplier: signalMap.network_multiplier,
            layoff_convexity: signalMap.layoff_convexity,
            reputation_stain_risk: signalMap.reputation_stain_risk,
            financial_runway: signalMap.financial_runway,
            badge_premium: signalMap.badge_premium,
            talent_magnetism: signalMap.talent_magnetism,
            sector_optionality: signalMap.sector_optionality,
            cultural_velocity_match: signalMap.cultural_velocity_match,
            global_mobility_index: signalMap.global_mobility_index,
            english_working_language: signalMap.english_working_language,
            visa_sponsorship_history: signalMap.visa_sponsorship_history,
            international_leadership_ratio: signalMap.international_leadership_ratio,
            expat_retention_rate: signalMap.expat_retention_rate,
            cantonese_requirement_level: signalMap.cantonese_requirement_level,
            regional_office_culture: signalMap.regional_office_culture,
          }).eq('id', snapshot.company_id)
        }
      } else {
        await admin.from('company_score_snapshots').update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        }).eq('id', snapshotId)
      }

      return NextResponse.json({ success: true, action: 'approved' })
    }

    if (body.action === 'reject') {
      await admin.from('company_score_snapshots').update({ status: 'rejected' }).eq('id', snapshotId)
      return NextResponse.json({ success: true, action: 'rejected' })
    }

    if (body.action === 'update_note') {
      await admin.from('company_score_snapshots').update({ analyst_note: body.note }).eq('id', snapshotId)
      await admin.from('company_analyst_notes').update({
        note: body.note,
        updated_at: new Date().toISOString(),
      }).eq('snapshot_id', snapshotId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
