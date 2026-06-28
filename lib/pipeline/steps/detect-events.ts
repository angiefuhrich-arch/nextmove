import 'server-only'

// Step: Detect Events
// Phase D: Cluster evidence into discrete employer events (layoff, funding, leadership change…).
// Currently: stub.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1400

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function detectEventsStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Read evidence_records for this pipeline run
  // 2. Group by event type using AI classification
  // 3. Store into employer_events table (to be created in Phase D migration)

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Event detection not yet implemented (Phase D)',
  }
}
