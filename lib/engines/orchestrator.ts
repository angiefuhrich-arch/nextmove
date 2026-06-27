// Scarsian Intelligence Orchestrator
// Runs all 8 engines, combines outputs using the active formula version,
// and produces a versioned ScarsianCalculationResult.
// Server-side only.

import { createAdminClient } from '@/lib/supabase/admin'
import type { FormulaVersion } from '@/lib/types/intelligence'
import type { EngineInput, EngineResult, ScarsianCalculationResult } from '@/lib/types/engines'
import { getActiveSignalsForEntity } from '@/lib/dal/signals'
import { getEvidenceForEntity } from '@/lib/dal/evidence'
import { getEntityById } from '@/lib/dal/entities'

import { financialStrengthEngine } from './financial-strength'
import { leadershipEngine }        from './leadership'
import { careerGrowthEngine }      from './career-growth'
import { cultureEngine }           from './culture'
import { compensationEngine }      from './compensation'
import { globalFriendlinessEngine }from './global-friendliness'
import { interviewExperienceEngine }from './interview-experience'
import { jobStabilityEngine }      from './job-stability'

const ALL_ENGINES = [
  financialStrengthEngine,
  leadershipEngine,
  careerGrowthEngine,
  cultureEngine,
  compensationEngine,
  globalFriendlinessEngine,
  interviewExperienceEngine,
  jobStabilityEngine,
]

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

// Merge all engine pillar outputs into a single score per pillar.
// When multiple engines contribute to the same pillar, their scores are
// averaged weighted by their reported confidence.
function mergePillarScores(results: EngineResult[]): Record<string, number> {
  const totals: Record<string, { weightedSum: number; totalWeight: number }> = {}

  for (const result of results) {
    for (const po of result.pillarOutputs) {
      if (!totals[po.pillar]) totals[po.pillar] = { weightedSum: 0, totalWeight: 0 }
      totals[po.pillar].weightedSum += po.score * po.confidence
      totals[po.pillar].totalWeight += po.confidence
    }
  }

  const merged: Record<string, number> = {}
  for (const [pillar, { weightedSum, totalWeight }] of Object.entries(totals)) {
    merged[pillar] = totalWeight > 0 ? clamp(weightedSum / totalWeight) : 50
  }
  return merged
}

// Load the active formula version from DB
async function loadActiveFormula(): Promise<FormulaVersion> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('formula_versions')
    .select('*')
    .eq('is_active', true)
    .single()
  if (error || !data) throw new Error('No active formula version found')
  return data as FormulaVersion
}

// Compute confidence score from confidence signals
function computeConfidence(
  pillarScores: Record<string, number>,
  signals: Awaited<ReturnType<typeof getActiveSignalsForEntity>>,
  formulaVersion: FormulaVersion
): number {
  const weights = formulaVersion.confidence_weights
  let weighted = 0
  let totalWeight = 0
  for (const [name, weight] of Object.entries(weights)) {
    const sig = signals.find(s => s.signal_name === name && !s.expired)
    const score = sig ? (sig.admin_override_score ?? sig.score) : 20
    weighted += score * weight
    totalWeight += weight
  }
  return totalWeight > 0 ? Math.round(weighted / totalWeight) : 20
}

export interface OrchestratorOptions {
  entityId: string
  userId?: string
  runTrigger?: 'admin_refresh' | 'new_signals' | 'news' | 'financial_report' | 'weekly' | 'api'
}

export async function runIntelligenceEngines(
  opts: OrchestratorOptions
): Promise<ScarsianCalculationResult> {
  const { entityId, userId } = opts
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Load prerequisites in parallel
  const [entity, signals, evidence, formulaVersion] = await Promise.all([
    getEntityById(entityId),
    getActiveSignalsForEntity(entityId),
    getEvidenceForEntity(entityId, { limit: 200 }),
    loadActiveFormula(),
  ])

  if (!entity) throw new Error(`Entity not found: ${entityId}`)

  const engineInput: EngineInput = {
    entityId,
    entityName: entity.name,
    signals,
    evidence,
    formulaVersion,
  }

  // Run all 8 engines
  const results = await Promise.all(
    ALL_ENGINES.map(engine => engine.run(engineInput))
  )

  // Save engine outputs to DB
  const engineOutputInserts = results.map(r => ({
    entity_id: entityId,
    engine_name: r.engineName,
    formula_version_id: formulaVersion.id,
    pillar_scores: Object.fromEntries(r.pillarOutputs.map(p => [p.pillar, p.score])),
    pillar_confidence: Object.fromEntries(r.pillarOutputs.map(p => [p.pillar, p.confidence])),
    signal_ids: [...new Set(r.pillarOutputs.flatMap(p => p.signalIds))],
    overall_confidence: r.overallConfidence,
    reasoning: r.reasoning,
    metadata: r.metadata,
    created_by: userId ?? null,
  }))

  const { data: savedOutputs } = await admin
    .from('engine_outputs')
    .insert(engineOutputInserts)
    .select('id') as { data: { id: string }[] | null }

  const engineOutputIds = (savedOutputs ?? []).map(o => o.id)

  // Merge pillar scores from all engines
  const merged = mergePillarScores(results)
  const cgsScore = clamp(merged.cgs ?? 50)
  const crsScore = clamp(merged.crs ?? 50)
  const mvsScore = clamp(merged.mvs ?? 50)
  const cfsScore = clamp(merged.cfs ?? 50)
  const gfiScore = clamp(merged.gfi ?? 50)

  // Pull pillar weights from active formula version
  const pw = formulaVersion.pillar_weights
  const baseScore =
    cgsScore * pw.cgs +
    crsScore * pw.crs +
    mvsScore * pw.mvs +
    cfsScore * pw.cfs +
    gfiScore * pw.gfi

  // Adjustment layer (from adjustment signals if present)
  const momentumSig  = signals.find(s => s.signal_name === 'momentum_score' && !s.expired)
  const volatilitySig = signals.find(s => s.signal_name === 'volatility_score' && !s.expired)

  const momentumRaw   = momentumSig  ? (momentumSig.admin_override_score  ?? momentumSig.score)  : 50
  const volatilityRaw = volatilitySig? (volatilitySig.admin_override_score ?? volatilitySig.score): 0

  const ar = formulaVersion.adjustment_rules
  const momentumAdj    = clamp((momentumRaw - 50) / ar.momentum_divisor,  ar.momentum_range[0],  ar.momentum_range[1])
  const volatilityPenalty = clamp(-(volatilityRaw / ar.volatility_divisor), ar.volatility_range[0], ar.volatility_range[1])

  const scarsianScore  = Math.round(clamp(baseScore + momentumAdj + volatilityPenalty))
  const careerAlpha    = scarsianScore - 50

  // Confidence
  const confidenceScore   = computeConfidence(merged, signals, formulaVersion)
  const insufficientData  = confidenceScore < formulaVersion.insufficient_data_threshold

  const vt = formulaVersion.verdict_thresholds
  const verdict: 'strong' | 'caution' | 'no-go' =
    scarsianScore >= vt.strong ? 'strong' :
    scarsianScore >= vt.caution ? 'caution' : 'no-go'

  const signalIdsUsed = [...new Set(results.flatMap(r => r.pillarOutputs.flatMap(p => p.signalIds)))]

  return {
    cgs_score:           Math.round(cgsScore),
    crs_score:           Math.round(crsScore),
    mvs_score:           Math.round(mvsScore),
    cfs_score:           Math.round(cfsScore),
    gfi_score:           Math.round(gfiScore),
    base_score:          Math.round(baseScore * 10) / 10,
    momentum_adjustment: Math.round(momentumAdj * 10) / 10,
    volatility_penalty:  Math.round(volatilityPenalty * 10) / 10,
    scarsian_score:      scarsianScore,
    career_alpha:        careerAlpha,
    confidence_score:    confidenceScore,
    insufficient_data:   insufficientData,
    verdict,
    formula_version:     formulaVersion.version,
    formula_version_id:  formulaVersion.id,
    engine_outputs:      results,
    signal_ids_used:     signalIdsUsed,
    calculation_timestamp: now,
  }
}
