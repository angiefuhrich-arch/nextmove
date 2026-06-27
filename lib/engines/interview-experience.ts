// Interview Experience Engine → CFS
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const interviewExperienceEngine: Engine = {
  name: 'interview_experience',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const [score, signalIds] = weightedSignals(signals, {
      culture_alignment: 0.60,
      talent_magnetism:  0.40,
    })

    const confidence = avgConfidence(signals, signalIds)

    return buildResult(
      'interview_experience',
      formulaVersion.id,
      [{ pillar: 'cfs', score, confidence, signalIds, reasoning: `Interview & onboarding experience → CFS: ${Math.round(score)}` }],
      `Interview experience correlated from culture alignment and talent magnetism. Score: ${Math.round(score)}.`
    )
  },
}
