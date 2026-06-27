// Base engine interface and shared helpers.
// Server-side only.

import type { Engine, EngineInput, EngineResult, EnginePillarOutput } from '@/lib/types/engines'
import type { Signal } from '@/lib/types/intelligence'
import { effectiveSignalScore, computeDecayFactor } from '@/lib/types/intelligence'

export type { Engine }

// Returns the effective (override-aware, decay-weighted) score for a signal
export function decayedScore(signal: Signal): number {
  const base = effectiveSignalScore(signal)
  const decay = computeDecayFactor(signal.expires_at, signal.created_at)
  return base * decay
}

// Weighted average of signal values by weights map; returns [score, signalIds used]
export function weightedSignals(
  signals: Signal[],
  weights: Record<string, number>
): [number, string[]] {
  let totalWeight = 0
  let weightedSum = 0
  const used: string[] = []

  for (const [name, weight] of Object.entries(weights)) {
    const sig = signals.find(s => s.signal_name === name && !s.expired)
    if (sig) {
      weightedSum += decayedScore(sig) * weight
      totalWeight += weight
      used.push(sig.id)
    }
  }

  if (totalWeight === 0) return [50, []]
  return [Math.min(100, Math.max(0, weightedSum / totalWeight)), used]
}

// Average confidence of a set of signals
export function avgConfidence(signals: Signal[], signalIds: string[]): number {
  const relevant = signals.filter(s => signalIds.includes(s.id))
  if (relevant.length === 0) return 30
  return relevant.reduce((sum, s) => sum + s.confidence, 0) / relevant.length
}

// Build a minimal EngineResult
export function buildResult(
  engineName: EngineResult['engineName'],
  formulaVersionId: string,
  pillarOutputs: EnginePillarOutput[],
  reasoning: string,
  metadata: Record<string, unknown> = {}
): EngineResult {
  const overallConfidence =
    pillarOutputs.length > 0
      ? pillarOutputs.reduce((s, p) => s + p.confidence, 0) / pillarOutputs.length
      : 30

  return {
    engineName,
    formulaVersionId,
    pillarOutputs,
    overallConfidence,
    reasoning,
    metadata,
  }
}
