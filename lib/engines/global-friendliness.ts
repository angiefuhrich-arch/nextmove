// Global Friendliness Engine → GFI (first-class pillar)
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const globalFriendlinessEngine: Engine = {
  name: 'global_friendliness',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    // Weights match the formula v1.0.0 GFI sub-weights
    const [score, signalIds] = weightedSignals(signals, {
      communication_accessibility: 0.25,
      visa_accessibility:          0.20,
      international_leadership:    0.15,
      expat_retention:             0.15,
      language_accessibility:      0.15,
      regional_autonomy:           0.10,
    })

    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'global_friendliness',
      formulaVersion.id,
      [{
        pillar: 'gfi',
        score,
        confidence,
        signalIds,
        reasoning: `Global Friendliness Index from ${signalIds.length} sub-signals. GFI: ${Math.round(score)}`,
      }],
      `GFI assessment: visa accessibility, English environment, expat retention, international leadership. Score: ${Math.round(score)}.`
    )
  },
}
