import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { collectCompanyData } from '@/lib/data-collection'
import { analyzeSignals, generateAnalystNote } from '@/lib/signal-analysis'
import { calculateScarsianScores, SCORING_SIGNALS, CONFIDENCE_SIGNALS } from '@/lib/scoring'
import type { ScoringSignals, ConfidenceInputs } from '@/lib/scoring'

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
    const slug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Upsert company record
    const { data: company, error: companyError } = await admin
      .from('companies')
      .upsert({ name: companyName.trim(), slug }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Failed to create company', detail: companyError?.message }, { status: 500 })
    }

    // 1. Collect public data
    const sources = await collectCompanyData(companyName, market ?? '')

    // 2. Persist sources
    if (sources.length > 0) {
      await admin.from('company_sources').insert(
        sources.map(s => ({ ...s, company_id: company.id }))
      )
    }

    const { data: savedSources } = await admin
      .from('company_sources')
      .select('id')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(sources.length || 1)

    const sourceIds = (savedSources ?? []).map(s => s.id)

    // 3. AI proposes signal scores (AI never computes final score)
    const signalScores = await analyzeSignals(companyName, market ?? '', sources)

    // 4. Split signals into scoring vs confidence inputs
    const scoringMap: Partial<ScoringSignals> = {}
    const confidenceMap: Partial<ConfidenceInputs> = {}

    for (const sig of signalScores) {
      if (SCORING_SIGNALS.includes(sig.signal_name as typeof SCORING_SIGNALS[number])) {
        scoringMap[sig.signal_name as keyof ScoringSignals] = sig.score
      } else if (CONFIDENCE_SIGNALS.includes(sig.signal_name as typeof CONFIDENCE_SIGNALS[number])) {
        confidenceMap[sig.signal_name as keyof ConfidenceInputs] = sig.score
      }
    }

    // Fill missing with neutral defaults
    for (const name of SCORING_SIGNALS) {
      if (scoringMap[name] === undefined) scoringMap[name] = 50
    }
    for (const name of CONFIDENCE_SIGNALS) {
      if (confidenceMap[name] === undefined) confidenceMap[name] = 20
    }

    // 5. Backend calculates all scores — AI is not involved in this step
    const calculatedScores = calculateScarsianScores(
      scoringMap as ScoringSignals,
      confidenceMap as ConfidenceInputs
    )

    // 6. AI generates editable analyst note (never used to compute scores)
    const analystNote = await generateAnalystNote(
      companyName,
      market ?? '',
      calculatedScores,
      signalScores
    )

    // 7. Persist snapshot as draft
    const { data: snapshot, error: snapshotError } = await admin
      .from('company_score_snapshots')
      .insert({
        company_id: company.id,
        scarsian_score: calculatedScores.scarsian_score,
        career_growth_score: calculatedScores.career_growth_score,
        career_risk_score: calculatedScores.career_risk_score,
        market_value_score: calculatedScores.market_value_score,
        career_fit_score: calculatedScores.career_fit_score,
        gfi_score: calculatedScores.gfi_score,
        career_alpha: calculatedScores.career_alpha,
        confidence_score: calculatedScores.confidence_score,
        verdict: calculatedScores.verdict,
        analyst_note: analystNote,
        status: 'draft',
      })
      .select('id')
      .single()

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: 'Failed to create snapshot', detail: snapshotError?.message }, { status: 500 })
    }

    // 8. Persist signal scores linked to snapshot
    await admin.from('company_signal_scores').insert(
      signalScores.map(s => ({
        company_id: company.id,
        snapshot_id: snapshot.id,
        signal_name: s.signal_name,
        score: s.score,
        confidence: s.confidence,
        reasoning: s.reasoning,
        source_ids: sourceIds,
        review_status: 'pending',
      }))
    )

    // 9. Persist analyst note record
    await admin.from('company_analyst_notes').insert({
      company_id: company.id,
      snapshot_id: snapshot.id,
      note: analystNote,
      created_by: user.id,
    })

    return NextResponse.json({
      snapshotId: snapshot.id,
      companyId: company.id,
      slug,
      scores: calculatedScores,
      insufficientData: calculatedScores.insufficient_data,
      signalCount: signalScores.length,
      sourceCount: sources.length,
    })
  } catch (error) {
    console.error('[analyze]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
