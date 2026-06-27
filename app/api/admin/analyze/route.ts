import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { collectCompanyData } from '@/lib/data-collection'
import { analyzeSignals, generateAnalystNote } from '@/lib/signal-analysis'
import { calculateScarsianScores, SCORING_SIGNALS, CONFIDENCE_SIGNALS } from '@/lib/scoring'
import type { ScoringSignals, ConfidenceInputs } from '@/lib/scoring'
import { upsertEntity } from '@/lib/dal/entities'
import { createSignal } from '@/lib/dal/signals'
import { createEvidence } from '@/lib/dal/evidence'
import { createScarsianSnapshot, recordTrendPoint } from '@/lib/dal/snapshots'
import { createAnalystReport } from '@/lib/dal/analyst-reports'
import { runIntelligenceEngines } from '@/lib/engines/orchestrator'

// Signal name → category mapping
const SIGNAL_CATEGORY_MAP: Record<string, 'cgs' | 'crs' | 'mvs' | 'cfs' | 'gfi' | 'confidence' | 'adjustment'> = {
  promotion_velocity: 'cgs', skill_transferability: 'cgs', network_multiplier: 'cgs',
  layoff_resilience: 'crs', reputation_safety: 'crs', financial_stability: 'crs',
  badge_premium: 'mvs', talent_magnetism: 'mvs', sector_optionality: 'mvs',
  culture_alignment: 'cfs',
  communication_accessibility: 'gfi', visa_accessibility: 'gfi', international_leadership: 'gfi',
  expat_retention: 'gfi', language_accessibility: 'gfi', regional_autonomy: 'gfi',
  momentum_score: 'adjustment', volatility_score: 'adjustment',
  evidence_coverage: 'confidence', data_freshness: 'confidence',
  cross_source_agreement: 'confidence', sample_reliability: 'confidence',
}

export async function POST(req: NextRequest) {
  try {
    // Auth — admin only
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { companyName, market } = await req.json()
    if (!companyName?.trim()) return NextResponse.json({ error: 'Company name required' }, { status: 400 })

    const admin = createAdminClient()
    const trimmed = companyName.trim()
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // ── 1. Upsert legacy company (bridge until full v3 migration)
    const { data: company, error: companyError } = await admin
      .from('companies')
      .upsert({ name: trimmed, slug }, { onConflict: 'slug' })
      .select('id')
      .single()
    if (companyError || !company) {
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    // ── 2. Upsert entity (v3 system)
    const entity = await upsertEntity({
      entity_type: 'company',
      name: trimmed,
      slug,
      market: market ?? null,
      legacy_company_id: company.id,
    })

    // ── 3. Collect public data sources
    const sources = await collectCompanyData(trimmed, market ?? '')

    // ── 4. Persist legacy sources + new evidence records in parallel
    const [savedSources] = await Promise.all([
      (async () => {
        if (sources.length > 0) {
          await admin.from('company_sources').insert(
            sources.map(s => ({ ...s, company_id: company.id }))
          )
        }
        const { data } = await admin
          .from('company_sources')
          .select('id')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(Math.max(sources.length, 1))
        return (data ?? []).map((s: { id: string }) => s.id)
      })(),
      // Create evidence records in the new system
      Promise.all(sources.map(s => createEvidence({
        entity_id: entity.id,
        source_type: s.source_type as 'news' | 'wikipedia' | 'brave_search',
        source_url: s.source_url ?? null,
        source_title: s.source_title ?? null,
        content_summary: s.raw_text ?? s.source_title ?? 'Source',
        collected_by: user.id,
        default_expiry_days: 90,
      }).catch(() => null))),
    ])

    // ── 5. AI proposes 22 signal scores (AI never computes final Scarsian Index)
    const aiSignalScores = await analyzeSignals(trimmed, market ?? '', sources)

    // ── 6. Persist signals in the new signals table
    const signalInserts = aiSignalScores.map(s =>
      createSignal({
        entity_id: entity.id,
        signal_name: s.signal_name,
        signal_category: SIGNAL_CATEGORY_MAP[s.signal_name] ?? 'cgs',
        score: s.score,
        confidence: s.confidence,
        reasoning: s.reasoning,
        evidence_ids: [],
      }).catch(() => null)
    )
    await Promise.all(signalInserts)

    // ── 7. Run intelligence engines + compute Scarsian Index v1.0.0
    //    Falls back to legacy formula if entity signals aren't loaded yet
    let engineResult
    try {
      engineResult = await runIntelligenceEngines({
        entityId: entity.id,
        userId: user.id,
        runTrigger: 'admin_refresh',
      })
    } catch {
      // Fallback: use legacy scoring if Phase 1 migration hasn't run yet
      const scoringMap: Partial<ScoringSignals> = {}
      const confidenceMap: Partial<ConfidenceInputs> = {}
      for (const sig of aiSignalScores) {
        if (SCORING_SIGNALS.includes(sig.signal_name as typeof SCORING_SIGNALS[number])) {
          scoringMap[sig.signal_name as keyof ScoringSignals] = sig.score
        } else if (CONFIDENCE_SIGNALS.includes(sig.signal_name as typeof CONFIDENCE_SIGNALS[number])) {
          confidenceMap[sig.signal_name as keyof ConfidenceInputs] = sig.score
        }
      }
      for (const name of SCORING_SIGNALS) { if (scoringMap[name] === undefined) scoringMap[name] = 50 }
      for (const name of CONFIDENCE_SIGNALS) { if (confidenceMap[name] === undefined) confidenceMap[name] = 20 }
      const legacy = calculateScarsianScores(scoringMap as ScoringSignals, confidenceMap as ConfidenceInputs)
      engineResult = {
        ...legacy,
        cgs_score: legacy.career_growth_score,
        crs_score: legacy.career_risk_score,
        mvs_score: legacy.market_value_score,
        cfs_score: legacy.career_fit_score,
        formula_version: legacy.formula_version,
        formula_version_id: 'legacy',
        engine_outputs: [],
        signal_ids_used: [],
        calculation_timestamp: new Date().toISOString(),
      }
    }

    // ── 8. AI generates analyst note (never used to compute scores)
    const analystNote = await generateAnalystNote(
      trimmed,
      market ?? '',
      {
        career_growth_score: engineResult.cgs_score,
        career_risk_score:   engineResult.crs_score,
        market_value_score:  engineResult.mvs_score,
        career_fit_score:    engineResult.cfs_score,
        gfi_score:           engineResult.gfi_score,
        scarsian_score:      engineResult.scarsian_score,
        insufficient_data:   engineResult.insufficient_data,
        verdict:             engineResult.verdict,
      },
      aiSignalScores
    )

    // ── 9. Persist new-system snapshot
    let newSnapshotId: string | null = null
    try {
      const newSnapshot = await createScarsianSnapshot(
        entity.id,
        engineResult,
        [],
        user.id
      )
      newSnapshotId = newSnapshot.id
      // Record initial trend point (draft — records even before approval for trend history)
      await recordTrendPoint(entity.id, newSnapshot, 'admin_refresh')
    } catch {
      // Non-fatal: Phase 2 tables may not exist yet
    }

    // ── 10. Persist legacy snapshot (for existing review UI compatibility)
    const { data: legacySnapshot, error: snapshotError } = await admin
      .from('company_score_snapshots')
      .insert({
        company_id:          company.id,
        scarsian_score:      engineResult.scarsian_score,
        career_growth_score: engineResult.cgs_score,
        career_risk_score:   engineResult.crs_score,
        market_value_score:  engineResult.mvs_score,
        career_fit_score:    engineResult.cfs_score,
        gfi_score:           engineResult.gfi_score,
        career_alpha:        engineResult.career_alpha,
        confidence_score:    engineResult.confidence_score,
        verdict:             engineResult.verdict,
        analyst_note:        analystNote,
        status:              'draft',
      })
      .select('id')
      .single()

    if (snapshotError || !legacySnapshot) {
      return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
    }

    // ── 11. Persist legacy signal scores for review UI
    await admin.from('company_signal_scores').insert(
      aiSignalScores.map(s => ({
        company_id:    company.id,
        snapshot_id:   legacySnapshot.id,
        signal_name:   s.signal_name,
        score:         s.score,
        confidence:    s.confidence,
        reasoning:     s.reasoning,
        source_ids:    savedSources,
        review_status: 'pending',
      }))
    )

    // ── 12. Persist analyst note
    await admin.from('company_analyst_notes').insert({
      company_id:  company.id,
      snapshot_id: legacySnapshot.id,
      note:        analystNote,
      created_by:  user.id,
    })

    // ── 13. Persist new-system analyst report
    if (newSnapshotId) {
      await createAnalystReport({
        entity_id:   entity.id,
        snapshot_id: newSnapshotId,
        title:       `${trimmed} Intelligence Report`,
        summary:     analystNote,
        created_by:  user.id,
      }).catch(() => null)
    }

    return NextResponse.json({
      snapshotId:      legacySnapshot.id,
      newSnapshotId,
      entityId:        entity.id,
      companyId:       company.id,
      slug,
      scores: {
        scarsian_score:      engineResult.scarsian_score,
        career_growth_score: engineResult.cgs_score,
        career_risk_score:   engineResult.crs_score,
        market_value_score:  engineResult.mvs_score,
        career_fit_score:    engineResult.cfs_score,
        gfi_score:           engineResult.gfi_score,
        confidence_score:    engineResult.confidence_score,
        career_alpha:        engineResult.career_alpha,
        verdict:             engineResult.verdict,
        formula_version:     engineResult.formula_version,
      },
      insufficientData: engineResult.insufficient_data,
      signalCount:      aiSignalScores.length,
      sourceCount:      sources.length,
    })
  } catch (error) {
    console.error('[analyze]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
