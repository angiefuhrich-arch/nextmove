import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateScarsianScores, toEmployerPillarNames, SCORING_SIGNALS, CONFIDENCE_SIGNALS } from '@/lib/scoring'
import type { ScoringSignals, ConfidenceInputs } from '@/lib/scoring'

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
      // Load all signal scores for this snapshot
      const { data: signals } = await admin
        .from('company_signal_scores')
        .select('signal_name, score, confidence, admin_override_score, review_status')
        .eq('snapshot_id', snapshotId)

      const scoringMap: Partial<ScoringSignals> = {}
      const confidenceMap: Partial<ConfidenceInputs> = {}

      if (signals && signals.length > 0) {
        for (const sig of signals) {
          // Use admin override if present, otherwise AI-proposed score
          const effectiveScore = sig.review_status === 'overridden' && sig.admin_override_score != null
            ? sig.admin_override_score
            : sig.score

          if (SCORING_SIGNALS.includes(sig.signal_name as typeof SCORING_SIGNALS[number])) {
            scoringMap[sig.signal_name as keyof ScoringSignals] = effectiveScore
          } else if (CONFIDENCE_SIGNALS.includes(sig.signal_name as typeof CONFIDENCE_SIGNALS[number])) {
            confidenceMap[sig.signal_name as keyof ConfidenceInputs] = effectiveScore
          }
        }
      }

      // Fill missing with neutral defaults
      for (const name of SCORING_SIGNALS) {
        if (scoringMap[name] === undefined) scoringMap[name] = 50
      }
      for (const name of CONFIDENCE_SIGNALS) {
        if (confidenceMap[name] === undefined) confidenceMap[name] = 20
      }

      // Recalculate with backend formula using effective scores (admin overrides respected)
      const recalculated = calculateScarsianScores(
        scoringMap as ScoringSignals,
        confidenceMap as ConfidenceInputs
      )
      const recalcPillars = toEmployerPillarNames(recalculated)

      // Update snapshot
      await admin.from('company_score_snapshots').update({
        scarsian_score: recalculated.scarsian_score,
        career_growth_score: recalcPillars.career_growth_score,
        career_risk_score:   recalcPillars.career_risk_score,
        market_value_score:  recalcPillars.market_value_score,
        career_fit_score:    recalcPillars.career_fit_score,
        gfi_score:           recalcPillars.gfi_score,
        career_alpha: recalculated.career_alpha,
        confidence_score: recalculated.confidence_score,
        verdict: recalculated.verdict,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      }).eq('id', snapshotId)

      // Sync to companies table so company page reflects approved scores
      const { data: snap } = await admin
        .from('company_score_snapshots')
        .select('company_id, analyst_note')
        .eq('id', snapshotId)
        .single()

      if (snap?.company_id) {
        await admin.from('companies').update({
          scarsian_index: recalculated.insufficient_data ? null : recalculated.scarsian_score,
          confidence_score: recalculated.confidence_score,
          verdict: recalculated.verdict,
          analyst_note: snap.analyst_note,
          gfi_score: recalcPillars.gfi_score,
          // Sync individual signal scores
          ladder_speed: scoringMap.promotion_velocity,
          skill_depreciation_risk: scoringMap.skill_transferability != null ? 100 - scoringMap.skill_transferability : undefined,
          network_multiplier: scoringMap.network_multiplier,
          layoff_convexity: scoringMap.layoff_resilience,
          reputation_stain_risk: scoringMap.reputation_safety != null ? 100 - scoringMap.reputation_safety : undefined,
          financial_runway: scoringMap.financial_stability,
          badge_premium: scoringMap.badge_premium,
          talent_magnetism: scoringMap.talent_magnetism,
          sector_optionality: scoringMap.sector_optionality,
          cultural_velocity_match: scoringMap.culture_alignment,
          english_working_language: scoringMap.language_accessibility,
          visa_sponsorship_history: scoringMap.visa_accessibility,
          international_leadership_ratio: scoringMap.international_leadership,
          expat_retention_rate: scoringMap.expat_retention,
          regional_office_culture: scoringMap.regional_autonomy,
        }).eq('id', snap.company_id)
      }

      return NextResponse.json({ success: true, action: 'approved', scores: recalculated })
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
    console.error('[snapshot]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
