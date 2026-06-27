// Server-side only. AI never calls this directly.
// Formula version: v1.0.0 (approved 2026-06-27)
// GFI is a first-class pillar in v1. See formula_versions table for stored weights.

// === Signal Definitions ===

export const SCORING_SIGNALS = [
  // Career Growth Score (CGS — 30% of Scarsian Index)
  'promotion_velocity',
  'skill_transferability',
  'network_multiplier',
  // Career Risk Score (CRS — 25%)
  'layoff_resilience',
  'reputation_safety',
  'financial_stability',
  // Market Value Score (MVS — 15%)
  'badge_premium',
  'talent_magnetism',
  'sector_optionality',
  // Career Fit Score (CFS — 20%; culture only — GFI is separate pillar)
  'culture_alignment',
  // Global Friendliness Index (GFI — 10%; first-class pillar)
  'communication_accessibility',
  'visa_accessibility',
  'international_leadership',
  'expat_retention',
  'language_accessibility',
  'regional_autonomy',
  // Adjustment layer
  'momentum_score',   // 0–100 where 50 = neutral → -5..+5
  'volatility_score', // 0–100 where 0 = stable → 0..-10 penalty
] as const

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
  career_growth_score: number   // CGS
  career_risk_score: number     // CRS
  market_value_score: number    // MVS
  career_fit_score: number      // CFS
  gfi_score: number             // GFI (first-class pillar)
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
  // Formula traceability
  formula_version: string
}

// === Formula ===

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

function weighted(pairs: [number, number][]): number {
  return pairs.reduce((sum, [score, weight]) => sum + score * weight, 0)
}

// Formula v1.0.0
// Pillar weights: CGS=30% CRS=25% MVS=15% CFS=20% GFI=10%
export function calculateScarsianScores(
  signals: ScoringSignals,
  confidence: ConfidenceInputs,
  formulaVersion = 'v1.0.0'
): ScarsianScores {
  // --- Step 1: Pillar Scores ---

  // Career Growth Score (CGS)
  const careerGrowthScore = clamp(weighted([
    [signals.promotion_velocity,    0.35],
    [signals.skill_transferability, 0.35],
    [signals.network_multiplier,    0.30],
  ]))

  // Career Risk Score (CRS)
  const careerRiskScore = clamp(weighted([
    [signals.layoff_resilience,   0.35],
    [signals.reputation_safety,   0.30],
    [signals.financial_stability, 0.35],
  ]))

  // Market Value Score (MVS)
  const marketValueScore = clamp(weighted([
    [signals.badge_premium,      0.45],
    [signals.talent_magnetism,   0.30],
    [signals.sector_optionality, 0.25],
  ]))

  // Career Fit Score (CFS) — culture only; GFI is now a separate first-class pillar
  const careerFitScore = clamp(signals.culture_alignment)

  // Global Friendliness Index (GFI) — first-class pillar
  const gfiScore = clamp(weighted([
    [signals.communication_accessibility, 0.25],
    [signals.visa_accessibility,          0.20],
    [signals.international_leadership,    0.15],
    [signals.expat_retention,             0.15],
    [signals.language_accessibility,      0.15],
    [signals.regional_autonomy,           0.10],
  ]))

  // --- Step 2: Base Scarsian Index (formula v1.0.0) ---
  // CGS=30% CRS=25% MVS=15% CFS=20% GFI=10%
  const baseScore = weighted([
    [careerGrowthScore, 0.30],
    [careerRiskScore,   0.25],
    [marketValueScore,  0.15],
    [careerFitScore,    0.20],
    [gfiScore,          0.10],
  ])

  // --- Step 3: Adjustment Layer ---
  const momentumAdjustment = clamp((signals.momentum_score - 50) / 10, -5, 5)
  const volatilityPenalty  = clamp(-(signals.volatility_score / 10), -10, 0)

  const scarsianScore = Math.round(clamp(baseScore + momentumAdjustment + volatilityPenalty))

  // --- Confidence Score ---
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
    career_risk_score:   Math.round(careerRiskScore),
    market_value_score:  Math.round(marketValueScore),
    career_fit_score:    Math.round(careerFitScore),
    gfi_score:           Math.round(gfiScore),
    base_score:          Math.round(baseScore),
    momentum_adjustment: Math.round(momentumAdjustment * 10) / 10,
    volatility_penalty:  Math.round(volatilityPenalty * 10) / 10,
    scarsian_score:      scarsianScore,
    career_alpha:        careerAlpha,
    verdict,
    confidence_score:    confidenceScore,
    insufficient_data:   insufficientData,
    formula_version:     formulaVersion,
  }
}
