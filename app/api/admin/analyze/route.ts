import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { collectCompanyData } from '@/lib/data-collection'
import { analyzeSignals, generateAnalystNote } from '@/lib/signal-analysis'
import { calculateScarsianScores, calculateConfidence, SIGNAL_NAMES } from '@/lib/scoring'
import type { SignalScores } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { companyName, market } = await req.json()
    if (!companyName?.trim()) return NextResponse.json({ error: 'Company name required' }, { status: 400 })

    const admin = createAdminClient()
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Upsert company
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

    // 2. Save sources
    if (sources.length > 0) {
      await admin.from('company_sources').insert(
        sources.map(s => ({ ...s, company_id: company.id }))
      )
    }

    // 3. Get source IDs for linking
    const { data: savedSources } = await admin
      .from('company_sources')
      .select('id')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .limit(sources.length)

    const sourceIds = (savedSources ?? []).map(s => s.id)

    // 4. AI analyzes evidence → proposes signal scores
    const signalScores = await analyzeSignals(companyName, market ?? '', sources)

    // 5. Build signal map for formula
    const signalMap: Partial<SignalScores> = {}
    for (const sig of signalScores) {
      const name = sig.signal_name as keyof SignalScores
      if (SIGNAL_NAMES.includes(name as typeof SIGNAL_NAMES[number])) {
        signalMap[name] = sig.score
      }
    }

    // Fill any missing with 50
    for (const name of SIGNAL_NAMES) {
      if (signalMap[name as keyof SignalScores] === undefined) {
        signalMap[name as keyof SignalScores] = 50
      }
    }

    // 6. Calculate scores server-side (formula, not AI)
    const calculatedScores = calculateScarsianScores(signalMap as SignalScores)
    const confidenceScore = calculateConfidence(signalScores.map(s => s.confidence))

    // 7. Generate analyst note
    const analystNote = await generateAnalystNote(companyName, market ?? '', { ...calculatedScores }, signalScores)

    // 8. Create snapshot (status: draft)
    const { data: snapshot, error: snapshotError } = await admin
      .from('company_score_snapshots')
      .insert({
        company_id: company.id,
        ...calculatedScores,
        confidence_score: confidenceScore,
        analyst_note: analystNote,
        status: 'draft',
      })
      .select('id')
      .single()

    if (snapshotError || !snapshot) {
      return NextResponse.json({ error: 'Failed to create snapshot', detail: snapshotError?.message }, { status: 500 })
    }

    // 9. Save signal scores linked to snapshot
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

    // 10. Save analyst note record
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
      confidenceScore,
      signalCount: signalScores.length,
      sourceCount: sources.length,
    })
  } catch (error) {
    console.error('[analyze]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
