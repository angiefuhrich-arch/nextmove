// Scarsian Intelligence Platform — Engine Type System (Phase 2)

import type { PillarKey, EngineName, FormulaVersion } from './intelligence'
import type { Signal, EvidenceRecord } from './intelligence'

// ============================================================
// Engine interface (also exported from base.ts for implementations)
// ============================================================

export interface Engine {
  name: string
  run(input: EngineInput): Promise<EngineResult>
}

// ============================================================
// Engine I/O
// ============================================================

export interface EngineInput {
  entityId: string
  entityName: string
  signals: Signal[]
  evidence: EvidenceRecord[]
  formulaVersion: FormulaVersion
}

export interface EnginePillarOutput {
  pillar: PillarKey
  score: number       // 0–100
  confidence: number  // 0–100
  signalIds: string[]
  reasoning: string
}

export interface EngineResult {
  engineName: EngineName
  formulaVersionId: string
  pillarOutputs: EnginePillarOutput[]
  overallConfidence: number
  reasoning: string
  metadata: Record<string, unknown>
}

// ============================================================
// Snapshot produced by orchestrator
// ============================================================

export interface ScarsianCalculationResult {
  // Pillar scores (from engines)
  cgs_score: number
  crs_score: number
  mvs_score: number
  cfs_score: number
  gfi_score: number
  // Composite
  base_score: number
  momentum_adjustment: number
  volatility_penalty: number
  scarsian_score: number
  career_alpha: number
  // Quality
  confidence_score: number
  insufficient_data: boolean
  verdict: 'strong' | 'caution' | 'no-go'
  // Traceability
  formula_version: string
  formula_version_id: string
  engine_outputs: EngineResult[]
  signal_ids_used: string[]
  calculation_timestamp: string
}

// ============================================================
// Signal groupings per engine
// These are the signal names each engine reads from the signals table
// ============================================================

export const ENGINE_SIGNAL_MAP: Record<EngineName, string[]> = {
  financial_strength:   ['financial_stability', 'reputation_safety'],
  leadership:           ['reputation_safety', 'promotion_velocity', 'network_multiplier'],
  career_growth:        ['promotion_velocity', 'skill_transferability', 'network_multiplier', 'badge_premium', 'sector_optionality'],
  culture:              ['culture_alignment'],
  compensation:         ['badge_premium', 'talent_magnetism'],
  global_friendliness:  ['communication_accessibility', 'visa_accessibility', 'international_leadership', 'expat_retention', 'language_accessibility', 'regional_autonomy'],
  interview_experience: ['culture_alignment', 'talent_magnetism'],
  job_stability:        ['layoff_resilience', 'financial_stability', 'momentum_score', 'volatility_score'],
}

// Confidence signal names read by all engines
export const CONFIDENCE_SIGNAL_NAMES = [
  'evidence_coverage',
  'data_freshness',
  'cross_source_agreement',
  'sample_reliability',
] as const
