// Server-side only. AI never generates scores. Formula loaded from DB.
// Hardcoded formula (FALLBACK_FORMULA) is used only when DB is unavailable.
// Production always uses the active scoring_model row for the entity_type.

import type { ScoringModel } from '@/lib/dal/scoring-models'

// === Signal Definitions ===
// These are the employer-specific signal keys for the v1.0.0 model.
// Other entity types will have their own signal keys defined in their scoring_model.

export const SCORING_SIGNALS = [
  'promotion_velocity',
  'skill_transferability',
  'network_multiplier',
  'layoff_resilience',
  'reputation_safety',
  'financial_stability',
  'badge_premium',
  'talent_magnetism',
  'sector_optionality',
  'culture_alignment',
  'communication_accessibility',
  'visa_accessibility',
  'international_leadership',
  'expat_retention',
  'language_accessibility',
  'regional_autonomy',
  'momentum_score',
  'volatility_score',
] as const

export const CONFIDENCE_SIGNALS = [
  'evidence_coverage',
  'data_freshness',
  'cross_source_agreement',
  'sample_reliability',
] as const

export const SIGNAL_NAMES = [...SCORING_SIGNALS, ...CONFIDENCE_SIGNALS] as const

export type ScoringSignalName   = typeof SCORING_SIGNALS[number]
export type ConfidenceSignalName = typeof CONFIDENCE_SIGNALS[number]
export type SignalName          = typeof SIGNAL_NAMES[number]

export type ScoringSignals  = Record<string, number>   // generic: keyed by signal_key
export type ConfidenceInputs = Record<ConfidenceSignalName, number>

// === Output Types ===
export interface ScarsianScores {
  pillar_scores:       Record<string, number>   // dimension_key → score
  base_score:          number
  momentum_adjustment: number
  volatility_penalty:  number
  scarsian_score:      number
  career_alpha:        number
  verdict:             'strong' | 'caution' | 'no-go'
  confidence_score:    number
  insufficient_data:   boolean
  formula_version:     string
  model_name:          string
  entity_type:         string
}

// === Helpers ===
function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function weightedAvg(pairs: Array<[number, number]>): number {
  const totalWeight = pairs.reduce((s, [, w]) => s + w, 0)
  if (totalWeight === 0) return 0
  return pairs.reduce((s, [v, w]) => s + v * w, 0) / totalWeight
}

// === FALLBACK: hardcoded employer formula (used if DB unavailable) ===
const EMPLOYER_FALLBACK_MODEL: ScoringModel = {
  id: 'fallback',
  entity_type: 'company',
  model_name: 'Scarsian Employer Index (fallback)',
  version: 'v1.0.0',
  description: null,
  insufficient_data_threshold: 50,
  verdict_strong:  70,
  verdict_caution: 45,
  is_active: true,
  dimensions: [
    {
      dimension_key: 'career_growth', dimension_label: 'Career Growth Score',
      pillar_weight: 0.30, is_adjustment: false, sort_order: 1,
      sub_dimensions: [
        { key: 'promotion_velocity',    label: 'Promotion Velocity',    weight: 0.35 },
        { key: 'skill_transferability', label: 'Skill Transferability', weight: 0.35 },
        { key: 'network_multiplier',    label: 'Network Multiplier',    weight: 0.30 },
      ],
    },
    {
      dimension_key: 'career_risk', dimension_label: 'Career Risk Score',
      pillar_weight: 0.25, is_adjustment: false, sort_order: 2,
      sub_dimensions: [
        { key: 'layoff_resilience',   label: 'Layoff Resilience',   weight: 0.35 },
        { key: 'reputation_safety',   label: 'Reputation Safety',   weight: 0.30 },
        { key: 'financial_stability', label: 'Financial Stability', weight: 0.35 },
      ],
    },
    {
      dimension_key: 'market_value', dimension_label: 'Market Value Score',
      pillar_weight: 0.15, is_adjustment: false, sort_order: 3,
      sub_dimensions: [
        { key: 'badge_premium',      label: 'Badge Premium',      weight: 0.45 },
        { key: 'talent_magnetism',   label: 'Talent Magnetism',   weight: 0.30 },
        { key: 'sector_optionality', label: 'Sector Optionality', weight: 0.25 },
      ],
    },
    {
      dimension_key: 'career_fit', dimension_label: 'Career Fit Score',
      pillar_weight: 0.20, is_adjustment: false, sort_order: 4,
      sub_dimensions: [
        { key: 'culture_alignment', label: 'Culture Alignment', weight: 1.0 },
      ],
    },
    {
      dimension_key: 'global_friendliness', dimension_label: 'Global Friendliness Index',
      pillar_weight: 0.10, is_adjustment: false, sort_order: 5,
      sub_dimensions: [
        { key: 'communication_accessibility', label: 'Communication Accessibility', weight: 0.25 },
        { key: 'visa_accessibility',          label: 'Visa Accessibility',          weight: 0.20 },
        { key: 'international_leadership',    label: 'International Leadership',    weight: 0.15 },
        { key: 'expat_retention',             label: 'Expat Retention',             weight: 0.15 },
        { key: 'language_accessibility',      label: 'Language Accessibility',      weight: 0.15 },
        { key: 'regional_autonomy',           label: 'Regional Autonomy',           weight: 0.10 },
      ],
    },
  ],
}

// === Core calculation — model-driven ===
export function calculateScarsianScores(
  signals: ScoringSignals,
  confidence: ConfidenceInputs,
  model: ScoringModel = EMPLOYER_FALLBACK_MODEL
): ScarsianScores {
  // Step 1: Pillar scores from model dimensions
  const pillarScores: Record<string, number> = {}
  const adjustments: Array<{ dimension_key: string; value: number; min: number; max: number }> = []

  for (const dim of model.dimensions) {
    if (dim.is_adjustment) {
      // Collect adjustment layers for step 3
      const raw = signals[dim.dimension_key] ?? 50
      adjustments.push({
        dimension_key: dim.dimension_key,
        value: raw,
        min: dim.adjustment_min ?? -10,
        max: dim.adjustment_max ?? 10,
      })
      continue
    }

    const subScore = weightedAvg(
      dim.sub_dimensions.map(sd => [signals[sd.key] ?? 0, sd.weight])
    )
    pillarScores[dim.dimension_key] = clamp(subScore)
  }

  // Step 2: Base score = weighted average of pillar scores
  const pillarDims = model.dimensions.filter(d => !d.is_adjustment)
  const baseScore = weightedAvg(
    pillarDims.map(d => [pillarScores[d.dimension_key] ?? 0, d.pillar_weight])
  )

  // Step 3: Adjustment layer
  // Momentum: signal 0–100 where 50 = neutral; maps to -5..+5
  const momentumRaw   = signals['momentum_score']   ?? 50
  const volatilityRaw = signals['volatility_score'] ?? 0
  const momentumAdj  = clamp((momentumRaw - 50) / 10, -5, 5)
  const volatilityPen = clamp(-(volatilityRaw / 10), -10, 0)

  const scarsianScore = Math.round(clamp(baseScore + momentumAdj + volatilityPen))

  // Step 4: Confidence
  const confidenceScore = Math.round(weightedAvg([
    [confidence.evidence_coverage,      0.30],
    [confidence.data_freshness,         0.25],
    [confidence.cross_source_agreement, 0.25],
    [confidence.sample_reliability,     0.20],
  ]))

  const insufficientData = confidenceScore < model.insufficient_data_threshold

  // Step 5: Verdict
  const verdict: 'strong' | 'caution' | 'no-go' =
    scarsianScore >= model.verdict_strong  ? 'strong' :
    scarsianScore >= model.verdict_caution ? 'caution' : 'no-go'

  return {
    pillar_scores:       Object.fromEntries(
      Object.entries(pillarScores).map(([k, v]) => [k, Math.round(v)])
    ),
    base_score:          Math.round(baseScore),
    momentum_adjustment: Math.round(momentumAdj * 10) / 10,
    volatility_penalty:  Math.round(volatilityPen * 10) / 10,
    scarsian_score:      scarsianScore,
    career_alpha:        scarsianScore - 50,
    verdict,
    confidence_score:    confidenceScore,
    insufficient_data:   insufficientData,
    formula_version:     model.version,
    model_name:          model.model_name,
    entity_type:         model.entity_type,
  }
}

// === Backward-compat accessor for employer-specific pillar names ===
// Existing code may reference .career_growth_score etc. — derive from pillar_scores.
export function toEmployerPillarNames(scores: ScarsianScores) {
  return {
    career_growth_score: scores.pillar_scores['career_growth']      ?? 0,
    career_risk_score:   scores.pillar_scores['career_risk']        ?? 0,
    market_value_score:  scores.pillar_scores['market_value']       ?? 0,
    career_fit_score:    scores.pillar_scores['career_fit']         ?? 0,
    gfi_score:           scores.pillar_scores['global_friendliness'] ?? 0,
  }
}
