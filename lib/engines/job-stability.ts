// Job Stability Engine → CRS
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const jobStabilityEngine: Engine = {
  name: 'job_stability',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const [score, signalIds] = weightedSignals(signals, {
      layoff_resilience:   0.45,
      financial_stability: 0.35,
      momentum_score:      0.12,
      volatility_score:    0.08,  // low volatility = high stability
    })

    // Invert volatility contribution: high volatility = low stability
    const volatilitySig = signals.find(s => s.signal_name === 'volatility_score' && !s.expired)
    let adjustedScore = score
    if (volatilitySig) {
      const rawVolatility = volatilitySig.admin_override_score ?? volatilitySig.score
      adjustedScore = Math.max(0, Math.min(100, score - (rawVolatility - 50) * 0.2))
    }

    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'job_stability',
      formulaVersion.id,
      [{ pillar: 'crs', score: adjustedScore, confidence, signalIds, reasoning: `Job stability (layoff risk, volatility) → CRS: ${Math.round(adjustedScore)}` }],
      `Stability assessment from layoff resilience, financial stability, and volatility. Score: ${Math.round(adjustedScore)}.`
    )
  },
}
