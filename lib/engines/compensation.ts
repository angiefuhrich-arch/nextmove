// Compensation Engine → MVS
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const compensationEngine: Engine = {
  name: 'compensation',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const [score, signalIds] = weightedSignals(signals, {
      badge_premium:    0.55,
      talent_magnetism: 0.45,
    })

    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'compensation',
      formulaVersion.id,
      [{ pillar: 'mvs', score, confidence, signalIds, reasoning: `Compensation & brand premium → MVS: ${Math.round(score)}` }],
      `Compensation attractiveness from badge premium and talent magnetism. Score: ${Math.round(score)}.`
    )
  },
}
