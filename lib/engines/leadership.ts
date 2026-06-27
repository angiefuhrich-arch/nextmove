// Leadership Engine → CRS (50%) + CGS (50%)
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const leadershipEngine: Engine = {
  name: 'leadership',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    // Leadership credibility affects CRS (stability under leadership)
    const [crsScore, crsIds] = weightedSignals(signals, {
      reputation_safety: 0.60,
      promotion_velocity: 0.40,
    })

    // Leadership quality affects CGS (mentorship, promotion culture)
    const [cgsScore, cgsIds] = weightedSignals(signals, {
      promotion_velocity:  0.55,
      network_multiplier:  0.45,
    })

    const allIds = [...new Set([...crsIds, ...cgsIds])]
    const confidence = avgConfidence(signals, allIds)

    return buildResult(
      'leadership',
      formulaVersion.id,
      [
        { pillar: 'crs', score: crsScore, confidence, signalIds: crsIds, reasoning: `Leadership credibility → CRS: ${Math.round(crsScore)}` },
        { pillar: 'cgs', score: cgsScore, confidence, signalIds: cgsIds, reasoning: `Leadership quality → CGS: ${Math.round(cgsScore)}` },
      ],
      `Leadership signals analysed. CRS impact: ${Math.round(crsScore)}, CGS impact: ${Math.round(cgsScore)}.`
    )
  },
}
