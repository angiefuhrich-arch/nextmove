// Culture Engine → CFS
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const cultureEngine: Engine = {
  name: 'culture',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const [score, signalIds] = weightedSignals(signals, {
      culture_alignment: 1.0,
    })

    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'culture',
      formulaVersion.id,
      [{ pillar: 'cfs', score, confidence, signalIds, reasoning: `Culture alignment score: ${Math.round(score)}` }],
      `Culture fit assessment from culture_alignment signal. Score: ${Math.round(score)}.`
    )
  },
}
