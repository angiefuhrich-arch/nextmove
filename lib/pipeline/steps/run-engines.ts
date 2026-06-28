// Step: Run Intelligence Engines
// Phase D: Run all 8 intelligence engines against signals.
// Currently: stub.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1800

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function runEnginesStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Load intelligence_signals for this entity
  // 2. Run all 8 engines:
  //    financial_strength, leadership, career_growth, culture,
  //    compensation, global_friendliness, interview_experience, job_stability
  // 3. Store engine_outputs (versioned, with signal_ids_used)
  // Rule: engines compute scores from structured signals only. Never from raw text.

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Intelligence engines not yet implemented (Phase D)',
  }
}
