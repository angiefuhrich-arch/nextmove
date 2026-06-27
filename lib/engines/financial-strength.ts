// Financial Strength Engine → CRS
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const financialStrengthEngine: Engine = {
  name: 'financial_strength',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const weights: Record<string, number> = {
      financial_stability: 0.65,
      reputation_safety:   0.35,
    }

    const [score, signalIds] = weightedSignals(signals, weights)
    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'financial_strength',
      formulaVersion.id,
      [{ pillar: 'crs', score, confidence, signalIds, reasoning: `Financial stability and reputation weighted ${Math.round(score)}/100` }],
      `Financial health assessment from ${signalIds.length} signal(s). Score: ${Math.round(score)}.`
    )
  },
}
