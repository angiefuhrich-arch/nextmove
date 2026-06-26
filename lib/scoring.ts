// Server-side only. AI never calls this directly.

export interface SignalScores {
  financial_runway: number
  ladder_speed: number
  skill_depreciation_risk: number
  network_multiplier: number
  layoff_convexity: number
  reputation_stain_risk: number
  badge_premium: number
  talent_magnetism: number
  sector_optionality: number
  cultural_velocity_match: number
  global_mobility_index: number
  english_working_language: number
  visa_sponsorship_history: number
  international_leadership_ratio: number
  expat_retention_rate: number
  cantonese_requirement_level: number
  regional_office_culture: number
}

export interface ScarsianScores {
  scarsian_score: number
  career_growth_score: number
  career_risk_score: number
  market_value_score: number
  career_fit_score: number
  gfi_score: number
  career_alpha: number
  verdict: 'strong' | 'caution' | 'no-go'
}

export const SIGNAL_NAMES = [
  'financial_runway',
  'ladder_speed',
  'skill_depreciation_risk',
  'network_multiplier',
  'layoff_convexity',
  'reputation_stain_risk',
  'badge_premium',
  'talent_magnetism',
  'sector_optionality',
  'cultural_velocity_match',
  'global_mobility_index',
  'english_working_language',
  'visa_sponsorship_history',
  'international_leadership_ratio',
  'expat_retention_rate',
  'cantonese_requirement_level',
  'regional_office_culture',
] as const

function avg(values: number[]): number {
  if (values.length === 0) return 50
  return values.reduce((a, b) => a + b, 0) / values.length
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function calculateScarsianScores(signals: SignalScores): ScarsianScores {
  // Higher skill_depreciation_risk, reputation_stain_risk, cantonese_requirement_level = worse → invert
  const careerGrowthScore = clamp(avg([
    signals.ladder_speed,
    100 - signals.skill_depreciation_risk,
    signals.sector_optionality,
    signals.badge_premium,
  ]))

  // Higher = safer career (layoff_convexity: high score = low layoff risk)
  const careerRiskScore = clamp(avg([
    signals.layoff_convexity,
    signals.financial_runway,
    100 - signals.reputation_stain_risk,
  ]))

  const marketValueScore = clamp(avg([
    signals.badge_premium,
    signals.talent_magnetism,
    signals.sector_optionality,
    signals.network_multiplier,
  ]))

  const careerFitScore = clamp(avg([
    signals.cultural_velocity_match,
    signals.network_multiplier,
    signals.talent_magnetism,
  ]))

  // cantonese_requirement_level: 0=no requirement (good for internationals), 100=mandatory (bad)
  const gfiScore = clamp(avg([
    signals.english_working_language,
    signals.visa_sponsorship_history,
    signals.international_leadership_ratio,
    signals.expat_retention_rate,
    100 - signals.cantonese_requirement_level,
    signals.regional_office_culture,
  ]))

  const scarsianScore = clamp(
    careerGrowthScore * 0.30 +
    careerRiskScore * 0.25 +
    marketValueScore * 0.25 +
    careerFitScore * 0.20
  )

  const careerAlpha = scarsianScore - 50

  const verdict: 'strong' | 'caution' | 'no-go' =
    scarsianScore >= 70 ? 'strong' :
    scarsianScore >= 45 ? 'caution' : 'no-go'

  return {
    scarsian_score: scarsianScore,
    career_growth_score: careerGrowthScore,
    career_risk_score: careerRiskScore,
    market_value_score: marketValueScore,
    career_fit_score: careerFitScore,
    gfi_score: gfiScore,
    career_alpha: careerAlpha,
    verdict,
  }
}

export function calculateConfidence(signalConfidences: number[]): number {
  if (signalConfidences.length === 0) return 0
  return clamp(avg(signalConfidences))
}
