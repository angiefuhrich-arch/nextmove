/**
 * Seed script: 6 test companies with Scarsian Index scores
 * Run: npx tsx scripts/seed-companies.ts
 *
 * Uses service-role admin client — bypasses RLS.
 * All data is clearly marked as seed/test data.
 */

import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Signal definitions (from lib/scoring.ts) ────────────────────────────────

interface CompanySeed {
  name: string
  slug: string
  market: string
  metadata: {
    industry: string
    country: string
    website: string
    description: string
    founded: number
  }
  signals: {
    // CGS — Career Growth Score (pillar weight 0.30)
    promotion_velocity: number        // weight 0.35
    skill_transferability: number     // weight 0.35
    network_multiplier: number        // weight 0.30
    // CRS — Career Risk Score (pillar weight 0.25)
    layoff_resilience: number         // weight 0.35
    reputation_safety: number         // weight 0.30
    financial_stability: number       // weight 0.35
    // MVS — Market Value Score (pillar weight 0.15)
    badge_premium: number             // weight 0.45
    talent_magnetism: number          // weight 0.30
    sector_optionality: number        // weight 0.25
    // CFS — Career Fit Score (pillar weight 0.20)
    culture_alignment: number         // weight 1.0
    // GFI — Global Friendliness Index (pillar weight 0.10)
    communication_accessibility: number  // weight 0.25
    visa_accessibility: number           // weight 0.20
    international_leadership: number     // weight 0.15
    expat_retention: number              // weight 0.15
    language_accessibility: number       // weight 0.15
    regional_autonomy: number            // weight 0.10
    // Adjustments
    momentum_score: number
    volatility_score: number
  }
  confidence: {
    evidence_coverage: number
    data_freshness: number
    cross_source_agreement: number
    sample_reliability: number
  }
  analyst_note: string
}

// ─── Score calculation (mirrors lib/scoring.ts exactly) ──────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function weightedAvg(pairs: Array<[number, number]>): number {
  const totalW = pairs.reduce((s, [, w]) => s + w, 0)
  if (totalW === 0) return 0
  return pairs.reduce((s, [v, w]) => s + v * w, 0) / totalW
}

function calculate(seed: CompanySeed) {
  const s = seed.signals

  const cgs = weightedAvg([
    [s.promotion_velocity, 0.35],
    [s.skill_transferability, 0.35],
    [s.network_multiplier, 0.30],
  ])
  const crs = weightedAvg([
    [s.layoff_resilience, 0.35],
    [s.reputation_safety, 0.30],
    [s.financial_stability, 0.35],
  ])
  const mvs = weightedAvg([
    [s.badge_premium, 0.45],
    [s.talent_magnetism, 0.30],
    [s.sector_optionality, 0.25],
  ])
  const cfs = s.culture_alignment
  const gfi = weightedAvg([
    [s.communication_accessibility, 0.25],
    [s.visa_accessibility, 0.20],
    [s.international_leadership, 0.15],
    [s.expat_retention, 0.15],
    [s.language_accessibility, 0.15],
    [s.regional_autonomy, 0.10],
  ])

  const baseScore = weightedAvg([
    [cgs, 0.30],
    [crs, 0.25],
    [mvs, 0.15],
    [cfs, 0.20],
    [gfi, 0.10],
  ])

  const momentumAdj  = clamp((s.momentum_score - 50) / 10, -5, 5)
  const volatilityPen = clamp(-(s.volatility_score / 10), -10, 0)
  const scarsianScore = Math.round(clamp(baseScore + momentumAdj + volatilityPen))

  const c = seed.confidence
  const confidenceScore = Math.round(weightedAvg([
    [c.evidence_coverage, 0.30],
    [c.data_freshness, 0.25],
    [c.cross_source_agreement, 0.25],
    [c.sample_reliability, 0.20],
  ]))

  const insufficientData = confidenceScore < 50
  const verdict: 'strong' | 'caution' | 'no-go' =
    scarsianScore >= 70 ? 'strong' :
    scarsianScore >= 45 ? 'caution' : 'no-go'

  return {
    cgs_score:           Math.round(cgs),
    crs_score:           Math.round(crs),
    mvs_score:           Math.round(mvs),
    cfs_score:           Math.round(cfs),
    gfi_score:           Math.round(gfi),
    base_score:          Math.round(baseScore * 10) / 10,
    momentum_adjustment: Math.round(momentumAdj * 10) / 10,
    volatility_penalty:  Math.round(volatilityPen * 10) / 10,
    scarsian_score:      scarsianScore,
    career_alpha:        scarsianScore - 50,
    confidence_score:    confidenceScore,
    insufficient_data:   insufficientData,
    verdict,
  }
}

// ─── Company seed data ────────────────────────────────────────────────────────

const COMPANIES: CompanySeed[] = [
  {
    name: 'Google',
    slug: 'google',
    market: 'US',
    metadata: {
      industry: 'Technology',
      country: 'United States',
      website: 'https://careers.google.com',
      description: 'Alphabet subsidiary operating search, cloud, advertising, and hardware divisions globally.',
      founded: 1998,
    },
    signals: {
      promotion_velocity: 72, skill_transferability: 85, network_multiplier: 90,
      layoff_resilience: 62, reputation_safety: 70, financial_stability: 95,
      badge_premium: 95, talent_magnetism: 92, sector_optionality: 88,
      culture_alignment: 72,
      communication_accessibility: 90, visa_accessibility: 82, international_leadership: 78,
      expat_retention: 74, language_accessibility: 85, regional_autonomy: 68,
      momentum_score: 58, volatility_score: 25,
    },
    confidence: { evidence_coverage: 75, data_freshness: 80, cross_source_agreement: 72, sample_reliability: 78 },
    analyst_note: 'Strong badge premium and skills transfer. Recent layoffs (2023–2024) weigh on resilience score. GFI is high due to broad international footprint and English-first environment.',
  },
  {
    name: 'OpenAI',
    slug: 'openai',
    market: 'US',
    metadata: {
      industry: 'Artificial Intelligence',
      country: 'United States',
      website: 'https://openai.com/careers',
      description: 'AI research and deployment company responsible for ChatGPT, GPT-4, and related models.',
      founded: 2015,
    },
    signals: {
      promotion_velocity: 78, skill_transferability: 88, network_multiplier: 82,
      layoff_resilience: 55, reputation_safety: 62, financial_stability: 68,
      badge_premium: 92, talent_magnetism: 88, sector_optionality: 82,
      culture_alignment: 68,
      communication_accessibility: 88, visa_accessibility: 78, international_leadership: 72,
      expat_retention: 68, language_accessibility: 82, regional_autonomy: 55,
      momentum_score: 72, volatility_score: 40,
    },
    confidence: { evidence_coverage: 65, data_freshness: 72, cross_source_agreement: 62, sample_reliability: 68 },
    analyst_note: 'Exceptional badge premium for AI roles. High momentum offset by elevated volatility from structural uncertainty around revenue model and governance. Financial stability reflects continued dependence on external capital.',
  },
  {
    name: 'Deloitte',
    slug: 'deloitte',
    market: 'GB',
    metadata: {
      industry: 'Professional Services',
      country: 'United Kingdom',
      website: 'https://www2.deloitte.com/careers',
      description: 'Big Four professional services network providing audit, consulting, financial advisory, and tax services worldwide.',
      founded: 1845,
    },
    signals: {
      promotion_velocity: 65, skill_transferability: 78, network_multiplier: 82,
      layoff_resilience: 75, reputation_safety: 80, financial_stability: 85,
      badge_premium: 80, talent_magnetism: 72, sector_optionality: 82,
      culture_alignment: 60,
      communication_accessibility: 85, visa_accessibility: 78, international_leadership: 85,
      expat_retention: 72, language_accessibility: 82, regional_autonomy: 65,
      momentum_score: 52, volatility_score: 12,
    },
    confidence: { evidence_coverage: 80, data_freshness: 75, cross_source_agreement: 78, sample_reliability: 82 },
    analyst_note: 'Stable career risk profile with strong sector optionality post-exit. Culture alignment is moderate — up-or-out dynamic reduces fit scores for non-partner-track candidates. Global mobility is a key strength.',
  },
  {
    name: 'HSBC Hong Kong',
    slug: 'hsbc-hong-kong',
    market: 'HK',
    metadata: {
      industry: 'Banking & Financial Services',
      country: 'Hong Kong',
      website: 'https://www.hsbc.com.hk/careers',
      description: 'Regional headquarters for HSBC Group in Asia, focusing on retail, commercial, and investment banking across the Asia-Pacific region.',
      founded: 1865,
    },
    signals: {
      promotion_velocity: 48, skill_transferability: 62, network_multiplier: 70,
      layoff_resilience: 68, reputation_safety: 72, financial_stability: 85,
      badge_premium: 75, talent_magnetism: 62, sector_optionality: 58,
      culture_alignment: 52,
      communication_accessibility: 78, visa_accessibility: 72, international_leadership: 80,
      expat_retention: 68, language_accessibility: 70, regional_autonomy: 60,
      momentum_score: 46, volatility_score: 18,
    },
    confidence: { evidence_coverage: 72, data_freshness: 68, cross_source_agreement: 70, sample_reliability: 75 },
    analyst_note: 'Strong financial stability and respectable international leadership. Promotion velocity is slow by industry standards. Skill transferability is moderate — banking-specific skills limit optionality outside the sector. HK regulatory environment introduces some confidence discount.',
  },
  {
    name: 'Cathay Pacific',
    slug: 'cathay-pacific',
    market: 'HK',
    metadata: {
      industry: 'Aviation',
      country: 'Hong Kong',
      website: 'https://www.cathaypacific.com/careers',
      description: 'Hong Kong\'s flag carrier airline, operating passenger and cargo services across a global network of over 100 destinations.',
      founded: 1946,
    },
    signals: {
      promotion_velocity: 52, skill_transferability: 55, network_multiplier: 62,
      layoff_resilience: 48, reputation_safety: 65, financial_stability: 58,
      badge_premium: 65, talent_magnetism: 55, sector_optionality: 45,
      culture_alignment: 58,
      communication_accessibility: 75, visa_accessibility: 68, international_leadership: 70,
      expat_retention: 60, language_accessibility: 72, regional_autonomy: 55,
      momentum_score: 48, volatility_score: 30,
    },
    confidence: { evidence_coverage: 62, data_freshness: 65, cross_source_agreement: 60, sample_reliability: 68 },
    analyst_note: 'Aviation remains structurally challenged post-pandemic. Skill transferability is below average — aviation-specific roles limit exit optionality. GFI benefits from the international nature of operations but regional autonomy is constrained.',
  },
  {
    name: 'Tencent',
    slug: 'tencent',
    market: 'CN',
    metadata: {
      industry: 'Technology',
      country: 'China',
      website: 'https://careers.tencent.com',
      description: 'Chinese multinational conglomerate operating WeChat, QQ, gaming, cloud, and fintech platforms across China and internationally.',
      founded: 1998,
    },
    signals: {
      promotion_velocity: 68, skill_transferability: 72, network_multiplier: 78,
      layoff_resilience: 55, reputation_safety: 55, financial_stability: 82,
      badge_premium: 72, talent_magnetism: 75, sector_optionality: 68,
      culture_alignment: 55,
      communication_accessibility: 62, visa_accessibility: 55, international_leadership: 65,
      expat_retention: 55, language_accessibility: 60, regional_autonomy: 62,
      momentum_score: 50, volatility_score: 35,
    },
    confidence: { evidence_coverage: 60, data_freshness: 62, cross_source_agreement: 58, sample_reliability: 65 },
    analyst_note: 'Strong financial position and domestic brand equity. GFI scores are suppressed by language accessibility and regulatory opacity for international hires. Reputation safety affected by ongoing geopolitical headwinds.',
  },
]

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  console.log('=== Scarsian Company Seed ===\n')

  // 1. Get active formula version
  const { data: fvRows, error: fvErr } = await db
    .from('formula_versions')
    .select('id, version')
    .eq('is_active', true)
    .limit(1)

  if (fvErr || !fvRows?.length) {
    console.error('No active formula_version found. Run migrations first.\nError:', fvErr?.message)
    process.exit(1)
  }

  const formulaVersionId = fvRows[0].id
  console.log(`Using formula version: ${fvRows[0].version} (${formulaVersionId})\n`)

  for (const company of COMPANIES) {
    console.log(`Seeding ${company.name}...`)

    // 2. Upsert entity
    const { data: entityRows, error: entityErr } = await db
      .from('entities')
      .upsert({
        entity_type: 'company',
        name: company.name,
        slug: company.slug,
        market: company.market,
        metadata: company.metadata,
        is_active: true,
      }, { onConflict: 'slug' })
      .select('id')

    if (entityErr || !entityRows?.length) {
      // Phase-ab schema (no entity_type column) — try without it
      const { data: entityRows2, error: entityErr2 } = await db
        .from('entities')
        .upsert({
          name: company.name,
          slug: company.slug,
          industry: company.metadata.industry,
          country: company.metadata.country,
        }, { onConflict: 'slug' })
        .select('id')

      if (entityErr2 || !entityRows2?.length) {
        console.error(`  ✗ Failed to upsert entity: ${entityErr?.message ?? entityErr2?.message}`)
        continue
      }
    }

    // Re-fetch to get the entity id
    const { data: entityData } = await db
      .from('entities')
      .select('id')
      .eq('slug', company.slug)
      .single()

    if (!entityData?.id) {
      console.error(`  ✗ Could not find entity after upsert`)
      continue
    }
    const entityId = entityData.id
    console.log(`  ✓ Entity: ${entityId}`)

    // 3. Insert signals (one per signal key)
    const signalCategories: Record<string, string> = {
      promotion_velocity: 'cgs', skill_transferability: 'cgs', network_multiplier: 'cgs',
      layoff_resilience: 'crs', reputation_safety: 'crs', financial_stability: 'crs',
      badge_premium: 'mvs', talent_magnetism: 'mvs', sector_optionality: 'mvs',
      culture_alignment: 'cfs',
      communication_accessibility: 'gfi', visa_accessibility: 'gfi',
      international_leadership: 'gfi', expat_retention: 'gfi',
      language_accessibility: 'gfi', regional_autonomy: 'gfi',
      momentum_score: 'adjustment', volatility_score: 'adjustment',
    }

    const signalInserts = Object.entries(company.signals).map(([key, value]) => ({
      entity_id: entityId,
      signal_name: key,
      signal_category: signalCategories[key] ?? 'cgs',
      score: value,
      confidence: company.confidence.evidence_coverage,
      reasoning: `Seed data — ${company.name}`,
      review_status: 'accepted',
    }))

    // Delete old seed signals for this entity first (idempotent)
    await db.from('signals').delete().eq('entity_id', entityId)

    const { data: insertedSignals, error: signalErr } = await db
      .from('signals')
      .insert(signalInserts)
      .select('id')

    if (signalErr) {
      console.error(`  ✗ Failed to insert signals: ${signalErr.message}`)
      continue
    }
    const signalIds = insertedSignals?.map(r => r.id) ?? []
    console.log(`  ✓ Signals: ${signalIds.length} inserted`)

    // 4. Calculate scores
    const scores = calculate(company)
    console.log(`  ✓ Scores: Scarsian=${scores.scarsian_score} (${scores.verdict}) | Confidence=${scores.confidence_score}`)
    console.log(`           CGS=${scores.cgs_score} CRS=${scores.crs_score} MVS=${scores.mvs_score} CFS=${scores.cfs_score} GFI=${scores.gfi_score}`)

    // 5. Supersede old approved snapshot if any
    await db
      .from('scarsian_snapshots')
      .update({ status: 'superseded' })
      .eq('entity_id', entityId)
      .eq('status', 'approved')

    // 6. Insert approved snapshot directly (bypasses pending review for seed data)
    const { data: snapData, error: snapErr } = await db
      .from('scarsian_snapshots')
      .insert({
        entity_id:             entityId,
        formula_version_id:    formulaVersionId,
        cgs_score:             scores.cgs_score,
        crs_score:             scores.crs_score,
        mvs_score:             scores.mvs_score,
        cfs_score:             scores.cfs_score,
        gfi_score:             scores.gfi_score,
        base_score:            scores.base_score,
        momentum_adjustment:   scores.momentum_adjustment,
        volatility_penalty:    scores.volatility_penalty,
        scarsian_score:        scores.scarsian_score,
        career_alpha:          scores.career_alpha,
        confidence_score:      scores.confidence_score,
        insufficient_data:     scores.insufficient_data,
        verdict:               scores.verdict,
        engine_output_ids:     [],
        signal_ids:            signalIds,
        calculation_timestamp: new Date().toISOString(),
        status:                'approved',
        approved_at:           new Date().toISOString(),
        analyst_note:          company.analyst_note,
      })
      .select('id')

    if (snapErr || !snapData?.length) {
      console.error(`  ✗ Failed to insert snapshot: ${snapErr?.message}`)
      continue
    }

    // 7. Record initial trend point
    await db.from('intelligence_trend_points').insert({
      entity_id:        entityId,
      snapshot_id:      snapData[0].id,
      scarsian_score:   scores.scarsian_score,
      confidence_score: scores.confidence_score,
      cgs_score:        scores.cgs_score,
      crs_score:        scores.crs_score,
      mvs_score:        scores.mvs_score,
      cfs_score:        scores.cfs_score,
      gfi_score:        scores.gfi_score,
      trigger:          'initial',
    })

    console.log(`  ✓ Snapshot ${snapData[0].id} (approved)\n`)
  }

  console.log('=== Seed complete ===')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
