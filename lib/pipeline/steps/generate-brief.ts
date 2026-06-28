import 'server-only'

// Step: Generate Brief
// Phase D: Use AI to write analyst prose from structured intelligence (never from raw text).
// Currently: stub.

import type { PipelineContext, StepResult } from '../types'

const STUB_DELAY = 1600

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function generateBriefStep(_ctx: PipelineContext): Promise<StepResult> {
  // Phase D TODO:
  // 1. Read scarsian_snapshot (draft) for this run
  // 2. Read engine_outputs and top signals
  // 3. Call AI with structured JSON only (no raw web text):
  //    { scores, verdict, signals, events } → analyst prose
  // 4. Store analyst_reports record (status=pending_review)
  // 5. DO NOT publish without admin approval
  // Rule: AI explains structured intelligence. It never invents facts.

  await sleep(STUB_DELAY)

  return {
    success: true,
    note: '[stub] Brief generation not yet implemented (Phase D)',
  }
}
