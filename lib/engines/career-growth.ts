// Career Growth Engine → CGS (60%) + MVS (40%)
import type { Engine, EngineInput, EngineResult } from '@/lib/types/engines'
import { weightedSignals, avgConfidence, buildResult } from './base'

export const careerGrowthEngine: Engine = {
  name: 'career_growth',

  async run(input: EngineInput): Promise<EngineResult> {
    const { signals, formulaVersion } = input

    const [cgsScore, cgsIds] = weightedSignals(signals, {
      promotion_velocity:    0.40,
      skill_transferability: 0.35,
      network_multiplier:    0.25,
    })

    const [mvsScore, mvsIds] = weightedSignals(signals, {
      badge_premium:      0.55,
      sector_optionality: 0.45,
    })

    const allIds = [...new Set([...cgsIds, ...mvsIds])]
    const confidence = avgConfidence(signals, allIds)

    return buildResult(
      'career_growth',
      formulaVersion.id,
      [
        { pillar: 'cgs', score: cgsScore, confidence, signalIds: cgsIds, reasoning: `Growth trajectory → CGS: ${Math.round(cgsScore)}` },
        { pillar: 'mvs', score: mvsScore, confidence, signalIds: mvsIds, reasoning: `Market value → MVS: ${Math.round(mvsScore)}` },
      ],
      `Career growth and market value analysed. CGS: ${Math.round(cgsScore)}, MVS impact: ${Math.round(mvsScore)}.`
    )
  },
}
