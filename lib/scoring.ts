// Server-side only. AI never calls this directly.

// === Signal Definitions ===

// Main scoring signals (AI-proposed)
export const SCORING_SIGNALS = [
  // Career Growth Score pillar
  'promotion_velocity',
  'skill_transferability',
  'network_multiplier',
  // Career Risk Score pillar
  'layoff_resilience',
  'reputation_safety',
  'financial_stability',
  // Market Value Score pillar
  'badge_premium',
  'talent_magnetism',
  'sector_optionality',
  // Career Fit Score pillar (culture_alignment + GFI)
  'culture_alignment',
  // GFI sub-signals
  'communication_accessibility',
  'visa_accessibility',
  'international_leadership',
  'expat_retention',
  'language_accessibility',
  'regional_autonomy',
  // Adjustment layer
  'momentum_score',    // 0–100 where 50 = neutral; converts to -5..+5
  'volatility_score',  // 0–100 where 0 = stable; converts to 0..-10 penalty
] as const

// Confidence inputs (AI-assessed separately)
export const CONFIDENCE_SIGNALS = [
  'evidence_coverage',
  'data_freshness',
  'cross_source_agreement',
  'sample_reliability',
] as const

export const SIGNAL_NAMES = [...SCORING_SIGNALS, ...CONFIDENCE_SIGNALS] as const

export type ScoringSignalName = typeof SCORING_SIGNALS[number]
export type ConfidenceSignalName = typeof CONFIDENCE_SIGNALS[number]
export type SignalName = typeof SIGNAL_NAMES[number]

export type ScoringSignals = Record<ScoringSignalName, number>
export type ConfidenceInputs = Record<ConfidenceSignalName, number>

// === Output Types ===

export interface ScarsianScores {
  // Pillar scores
  career_growth_score: number
  career_risk_score: number
  market_value_score: number
  career_fit_score: number
  gfi_score: number
  // Base before adjustments
  base_score: number
  // Adjustment components
  momentum_adjustment: number   // -5 to +5
  volatility_penalty: number    // -10 to 0
  // Final
  scarsian_score: number        // 0–100 (clamped)
  career_alpha: number          // scarsian_score - 50
  verdict: 'strong' | 'caution' | 'no-go'
  // Confidence
  confidence_score: number
  insufficient_data: boolean    // true if confidence < 50
}

// === Formula ===

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function weighted(pairs: [number, number][]): number {
  return pairs.reduce((sum, [score, weight]) => sum + score * weight, 0)
}

export function calculateScarsianScores(
  signals: ScoringSignals,
  confidence: ConfidenceInputs
): ScarsianScores {
  // --- Step 1: Pillar Scores ---

  // Career Growth Score
  const careerGrowthScore = clamp(weighted([
    [signals.promotion_velocity,   0.35],
    [signals.skill_transferability, 0.35],
    [signals.network_multiplier,   0.30],
  ]))

  // Career Risk Score
  const careerRiskScore = clamp(weighted([
    [signals.layoff_resilience,  0.35],
    [signals.reputation_safety,  0.30],
    [signals.financial_stability, 0.35],
  ]))

  // Market Value Score
  const marketValueScore = clamp(weighted([
    [signals.badge_premium,      0.45],
    [signals.talent_magnetism,   0.30],
    [signals.sector_optionality, 0.25],
  ]))

  // GFI (sub-score used inside CFS)
  const gfiScore = clamp(weighted([
    [signals.communication_accessibility, 0.25],
    [signals.visa_accessibility,          0.20],
    [signals.international_leadership,    0.15],
    [signals.expat_retention,             0.15],
    [signals.language_accessibility,      0.15],
    [signals.regional_autonomy,           0.10],
  ]))

  // Career Fit Score (culture_alignment + GFI)
  const careerFitScore = clamp(weighted([
    [signals.culture_alignment, 0.45],
    [gfiScore,                  0.55],
  ]))

  // --- Step 2: Base Scarsian Index ---
  const baseScore = weighted([
    [careerGrowthScore, 0.35],
    [careerRiskScore,   0.30],
    [marketValueScore,  0.20],
    [careerFitScore,    0.15],
  ])

  // --- Step 3: Adjustment Layer ---
  // momentum_score: 0–100 where 50 = neutral → convert to -5..+5
  const momentumAdjustment = clamp((signals.momentum_score - 50) / 10, -5, 5)

  // volatility_score: 0–100 where 0 = stable, 100 = max volatility → penalty 0..-10
  const volatilityPenalty = clamp(-(signals.volatility_score / 10), -10, 0)

  const rawFinal = baseScore + momentumAdjustment + volatilityPenalty
  const scarsianScore = Math.round(clamp(rawFinal))

  // --- Confidence Score ---
  // Calculated independently from evidence quality signals
  const confidenceScore = Math.round(weighted([
    [confidence.evidence_coverage,      0.30],
    [confidence.data_freshness,         0.25],
    [confidence.cross_source_agreement, 0.25],
    [confidence.sample_reliability,     0.20],
  ]))

  const insufficientData = confidenceScore < 50

  // --- Derived fields ---
  const careerAlpha = scarsianScore - 50
  const verdict: 'strong' | 'caution' | 'no-go' =
    scarsianScore >= 70 ? 'strong' :
    scarsianScore >= 45 ? 'caution' : 'no-go'

  return {
    career_growth_score: Math.round(careerGrowthScore),
    career_risk_score: Math.round(careerRiskScore),
    market_value_score: Math.round(marketValueScore),
    career_fit_score: Math.round(careerFitScore),
    gfi_score: Math.round(gfiScore),
    base_score: Math.round(baseScore),
    momentum_adjustment: Math.round(momentumAdjustment * 10) / 10,
    volatility_penalty: Math.round(volatilityPenalty * 10) / 10,
    scarsian_score: scarsianScore,
    career_alpha: careerAlpha,
    verdict,
    confidence_score: confidenceScore,
    insufficient_data: insufficientData,
  }
}
