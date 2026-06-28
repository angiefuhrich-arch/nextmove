import 'server-only'

// Step: Generate Signals
// Phase D: Convert events into scored signals mapped to intelligence pillars.
// Currently: stub.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1600

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function generateSignalsStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Read employer_events for this run
  // 2. For each event, classify into CGS/CRS/MVS/CFS/GFI pillars
  // 3. Store into intelligence_signals table
  // Rule: AI interprets structured events. AI never invents signals.

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Signal generation not yet implemented (Phase D)',
  }
}
